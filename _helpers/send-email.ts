import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    const host = process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io';
    const port = parseInt(process.env.SMTP_PORT || '2525');
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';
    const from = process.env.EMAIL_FROM || 'noreply@my-node-api.com';

    const transport = nodemailer.createTransport({
        host,
        port,
        auth: { user, pass }
    });

    const info = await transport.sendMail({ from, to, subject, html });

    console.log(`Email sent to ${to} | MessageId: ${info.messageId}`);
    return info.messageId;
}

// kept for backward-compat (controllers call getPreviewUrl after register/forgotPassword)
export function getPreviewUrl(): string {
    return '';
}
