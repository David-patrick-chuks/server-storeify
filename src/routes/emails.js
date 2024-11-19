import express from 'express';
import { authenticateJWT, isAuthorized } from '../utils/authMiddleware.js';
import { sendEmailController, replyToEmail,sendBulkEmailController, getEmailsTotal, deleteEmail, getEmailsWithPagination, getEmailByMessageId } from '../controllers/emailController.js';
import { getEmailList } from '../controllers/emailListController.js';

const router = express.Router();

// Protect routes with authenticateJWT and isAuthorized middleware

router.get('/client-email-list', authenticateJWT, getEmailList);
router.get('/emails/total', authenticateJWT, getEmailsTotal);
router.post('/reply/:messageId', authenticateJWT, replyToEmail);
router.get('/emails', authenticateJWT, getEmailsWithPagination);
router.get('/emails/:messageId', authenticateJWT, getEmailByMessageId);
router.post('/send', authenticateJWT, isAuthorized, sendEmailController);
router.post('/send-bulk', authenticateJWT, sendBulkEmailController); // New route for bulk emails
router.delete('/delete/:id', authenticateJWT, deleteEmail);

export default router;
