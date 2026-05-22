import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../_helpers/db';
import { sendEmail } from '../_helpers/send-email';
import { Role } from '../_helpers/role';

const jwtSecret = () => process.env.JWT_SECRET || 'REPLACE_WITH_STRONG_SECRET_FROM_ENV_IN_PRODUCTION';

// Frontend URL for building email links — must be set in production
const frontendUrl = () => process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:4000';

export const accountService = {
    authenticate,
    refreshToken,
    revokeToken,
    register,
    verifyEmail,
    verifyEmailByEmail,
    forgotPassword,
    resetPassword,
    getAll,
    getById,
    update,
    delete: _delete
};

async function authenticate({ email, password }: { email: string; password: string }) {
    const account = await db.Account.scope('withHash').findOne({ where: { email } });
    if (!account || !await bcrypt.compare(password, account.password)) {
        throw 'Invalid email or password';
    }
    if (account.verificationToken) {
        throw 'Account not verified';
    }
    return createAccountResponse(account);
}

async function refreshToken(token: string) {
    const refreshToken = await db.RefreshToken.findOne({ where: { token } });
    if (!refreshToken || !refreshToken.isActive) throw 'Invalid token';

    const account = await db.Account.findByPk(refreshToken.AccountId);
    if (!account || account.verificationToken) throw 'Account not found or not verified';

    await refreshToken.update({ revoked: new Date(), revokedByIp: 'unknown' });
    const newRefreshToken = await createRefreshToken(account.id, 'unknown');
    return createAccountResponse(account, newRefreshToken.token);
}

async function revokeToken(token: string) {
    const refreshToken = await db.RefreshToken.findOne({ where: { token } });
    if (!refreshToken || !refreshToken.isActive) throw 'Token not found';
    await refreshToken.update({ revoked: new Date(), revokedByIp: 'unknown' });
}

async function register(params: any, origin: string) {
    if (await db.Account.findOne({ where: { email: params.email } })) {
        throw `Email ${params.email} is already registered`;
    }

    const count = await db.Account.count();
    const role = count === 0 ? Role.Admin : Role.User;

    const account = await db.Account.create({
        ...params,
        password: await bcrypt.hash(params.password, 10),
        role,
        verificationToken: randomTokenString()
    });

    await sendVerificationEmail(account);
    return { account: await createAccountResponse(account) };
}

async function verifyEmail(token: string) {
    const account = await db.Account.findOne({ where: { verificationToken: token } });
    if (!account) throw 'Invalid verification token';

    // Use null (not undefined) so Sequelize actually clears the column in the DB
    await account.update({ verificationToken: null });

    return createAccountResponse(account);
}

async function verifyEmailByEmail(email: string) {
    const account = await db.Account.findOne({ where: { email } });
    if (!account) throw 'Account not found';
    if (!account.verificationToken) throw 'Account already verified';

    await account.update({ verificationToken: null });

    return createAccountResponse(account);
}

async function forgotPassword(email: string, origin: string) {
    const account = await db.Account.findOne({ where: { email } });
    // Return without error to prevent email enumeration
    if (!account) return;

    const resetToken = randomTokenString();
    const resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await account.update({ resetToken, resetTokenExpires });

    await sendPasswordResetEmail(account);
}

async function resetPassword({ token, password }: { token: string; password: string }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.Account.update(
        { password: hashedPassword, resetToken: null, resetTokenExpires: null, verificationToken: null },
        { where: { resetToken: token, resetTokenExpires: { [db.Op.gt]: new Date() } } }
    );
    if (result[0] === 0) throw 'Invalid or expired token';
}

async function getAll() {
    return db.Account.findAll();
}

async function getById(id: string) {
    const account = await db.Account.findByPk(id);
    if (!account) throw 'Account not found';
    return account.toJSON();
}

async function update(id: string, params: any) {
    const account = await db.Account.findByPk(id);
    if (!account) throw 'Account not found';

    if (params.email) {
        const existingAccount = await db.Account.findOne({ where: { email: params.email } });
        if (existingAccount && existingAccount.id !== id) throw 'Email already in use';
    }

    if (params.password) {
        params.password = await bcrypt.hash(params.password, 10);
    }

    Object.assign(account, params);
    await account.save();
    return account.toJSON();
}

async function _delete(id: string) {
    const account = await db.Account.findByPk(id);
    if (!account) throw 'Account not found';
    await account.destroy();
}

async function createRefreshToken(accountId: string, ipAddress: string) {
    return await db.RefreshToken.create({
        token: randomTokenString(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdByIp: ipAddress,
        AccountId: accountId
    });
}

async function createAccountResponse(account: any, refreshTokenString?: string) {
    const token = jwt.sign({ id: account.id }, jwtSecret(), { expiresIn: '15m' });
    let refreshToken = refreshTokenString;
    if (!refreshToken) {
        const rt = await createRefreshToken(account.id, 'unknown');
        refreshToken = rt.token;
    }
    return {
        id: account.id,
        title: account.title,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        role: account.role,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        isVerified: !account.verificationToken,
        jwtToken: token,
        refreshToken
    };
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

async function sendVerificationEmail(account: any) {
    const verifyUrl = `${frontendUrl()}/account/verify-email?token=${account.verificationToken}`;
    const name = account.title
        ? `${account.title} ${account.firstName || account.email}`
        : (account.firstName || account.email);
    await sendEmail({
        to: account.email,
        subject: 'Sign-up Verification',
        html: `<p>Hi ${name},</p>
               <p>Please verify your email address by clicking the link below:</p>
               <p><a href="${verifyUrl}">${verifyUrl}</a></p>
               <p>If you did not create an account, please ignore this email.</p>`
    });
}

async function sendPasswordResetEmail(account: any) {
    const resetUrl = `${frontendUrl()}/account/reset-password?token=${account.resetToken}`;
    await sendEmail({
        to: account.email,
        subject: 'Reset Password',
        html: `<p>Hi ${account.firstName || account.email},</p>
               <p>Please reset your password by clicking the link below (valid for 24 hours):</p>
               <p><a href="${resetUrl}">${resetUrl}</a></p>
               <p>If you did not request a password reset, please ignore this email.</p>`
    });
}
