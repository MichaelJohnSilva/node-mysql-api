import nodemailer from 'nodemailer';
import config from '../config.json';

let testAccount: any;
let previewUrl: string = '';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    if (!testAccount) {
        testAccount = await nodemailer.createTestAccount();
        console.log('\n=== ETHEREAL EMAIL CONFIG ===');
        console.log('Host: smtp.ethereal.email');
        console.log('Port: 587');
        console.log('User:', testAccount.user);
        console.log('Pass:', testAccount.pass);
        console.log('===========================\n');
    }
    
    const transport = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });

    const info = await transport.sendMail({
        from: config.emailFrom,
        to,
        subject,
        html
    });

    previewUrl = nodemailer.getTestMessageUrl(info) || '';
    console.log(`Email sent to ${to}`);
    console.log(`Preview URL: ${previewUrl}\n`);
    
    return previewUrl;
}

export function getPreviewUrl() {
    return previewUrl;
}
