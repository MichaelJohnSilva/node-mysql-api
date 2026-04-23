import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import Joi from 'joi';
import db from '../_helpers/db';
import { Role } from '../_helpers/role';
import jwt from 'jsonwebtoken';
import config from '../config.json';
import { accountService } from './account.service';

const router = express.Router();

const authenticateSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

const registerSchema = Joi.object({
    title: Joi.string().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    acceptTerms: Joi.boolean().valid(true).required(),
});

const verifyEmailSchema = Joi.object({
    token: Joi.string().optional(),
    email: Joi.string().email().optional(),
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
});

const updateSchema = Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).optional(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).optional(),
}).min(1);

router.post('/authenticate', validateRequest(authenticateSchema), authenticate);
router.post('/register', validateRequest(registerSchema), register);
router.get('/verify-email', verifyEmailGet);
router.post('/verify-email', validateRequest(verifyEmailSchema), verifyEmailPost);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);
router.post('/refresh-token', refreshToken);
router.post('/revoke-token', authenticateMiddleware(), revokeToken);
router.get('/', authenticateMiddleware([Role.Admin]), getAll);
router.get('/:id', authenticateMiddleware(), getById);
router.put('/:id', authenticateMiddleware(), validateRequest(updateSchema), update);
router.delete('/:id', authenticateMiddleware([Role.Admin]), _delete);

export default router;

function validateRequest(schema: Joi.Schema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const options = {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true
        };
        const { error, value } = schema.validate(req.body, options);
        if (error) {
            next(`Validation error: ${error.details.map(x => x.message).join(', ')}`);
        } else {
            req.body = value;
            next();
        }
    };
}

function authenticateMiddleware(roles: string[] = []): RequestHandler[] {
    return [
        (req: Request, res: Response, next: NextFunction) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader?.startsWith('Bearer ')) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, config.secret) as { id: string };
                (req as any).user = { id: decoded.id, role: '' };
                next();
            } catch {
                return res.status(401).json({ message: 'Unauthorized' });
            }
        },
        (req: Request, res: Response, next: NextFunction) => {
            const user = (req as any).user;
            db.Account.findByPk(user.id).then((account: any) => {
                if (!account) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }
                if (roles.length && !roles.includes(account.role)) {
                    return res.status(403).json({ message: 'Forbidden' });
                }
                (req as any).user = { id: account.id, role: account.role };
                next();
            }).catch(next);
        }
    ];
}

async function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body;
        const { refreshToken, ...account } = await accountService.authenticate({ email, password });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' });
        res.json(account);
    } catch (error) {
        next(error);
    }
}

async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const result = await accountService.register(req.body, getOrigin(req));
        res.json({ 
            message: 'Successfully registered',
            previewUrl: result.previewUrl 
        });
    } catch (error) {
        next(error);
    }
}

async function verifyEmailGet(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.query.token as string;
        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }
        const account = await accountService.verifyEmail(token);
        res.json({ message: 'Verification successful, you can now login', account });
    } catch (error) {
        next(error);
    }
}

async function verifyEmailPost(req: Request, res: Response, next: NextFunction) {
    try {
        const { token, email } = req.body;
        
        if (token) {
            // Public verification with token (standard user flow)
            const account = await accountService.verifyEmail(token);
            return res.json({ message: 'Verification successful, you can now login', account });
        }
        
        if (email) {
            // Admin verification by email (no auth required for simplicity)
            const account = await accountService.verifyEmailByEmail(email);
            return res.json({ message: 'Verification successful, you can now login', account });
        }
        
        next('Invalid request: either token or email must be provided');
    } catch (error) {
        next(error);
    }
}

async function forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const origin = getOrigin(req);
        await accountService.forgotPassword(req.body.email, origin);
        res.json({ message: 'Please check your email for password reset instructions' });
    } catch (error) {
        next(error);
    }
}

async function resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
        await accountService.resetPassword(req.body);
        res.json({ message: 'Password reset successful, you can now login' });
    } catch (error) {
        next(error);
    }
}

async function refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.cookies.refreshToken;
        const { refreshToken: newRefreshToken, ...account } = await accountService.refreshToken(token);
        res.cookie('refreshToken', newRefreshToken, { httpOnly: true, sameSite: 'strict' });
        res.json(account);
    } catch (error) {
        next(error);
    }
}

async function revokeToken(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.cookies.refreshToken;
        await accountService.revokeToken(token);
        res.json({ message: 'Token revoked' });
    } catch (error) {
        next(error);
    }
}

async function getAll(req: Request, res: Response, next: NextFunction) {
    try {
        const accounts = await accountService.getAll();
        res.json(accounts);
    } catch (error) {
        next(error);
    }
}

async function getById(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const account = await accountService.getById(id);
        if (!account) throw 'Account not found';
        const reqUser = (req as any).user;
        if (reqUser?.role !== Role.Admin && reqUser?.id !== account.id) throw 'Unauthorized';
        res.json(account);
    } catch (error) {
        next(error);
    }
}

async function update(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const reqUser = (req as any).user;
        if (reqUser?.role !== Role.Admin && reqUser?.id !== id) throw 'Unauthorized';
        
        // Non-admin users cannot modify role
        if (reqUser?.role !== Role.Admin && req.body.role) {
            throw 'Cannot modify role';
        }
        
        const account = await accountService.update(id, req.body);
        res.json(account);
    } catch (error) {
        next(error);
    }
}

async function _delete(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        const reqUser = (req as any).user;
        if (reqUser?.role !== Role.Admin) throw 'Unauthorized';
        await accountService.delete(id);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        next(error);
    }
}

function getOrigin(req: Request): string {
    return `${req.protocol}://${req.get('host')}`;
}
