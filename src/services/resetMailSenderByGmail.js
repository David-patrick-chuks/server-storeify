

// src/services/emailService.ts
import nodemailer from 'nodemailer';

import dotenv from 'dotenv';

dotenv.config();


export const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',  // Gmail service
        auth: {
            user: process.env.EMAIL_USER, // Email from .env
            pass: process.env.EMAIL_PASS, // Email password or app-specific password
        },
    });
};


export const sendPasswordResetEmail = async (email, resetLink) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: '"Storeify Team" <noreply@storeify.com>',
        to: email,
        subject: 'Password Reset Request',
        text: `Hello,\n\nYou requested a password reset. Click the link below to reset your password:\n${resetLink}\n\nIf you did not request this, please ignore this email.\n\nBest,\nStoreify Team`,
        html: `<p>Hello,</p><p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p><p>If you did not request this, please ignore this email.</p><p>Best,<br>Storeify Team</p>`,
    };

    await transporter.sendMail(mailOptions);
};
