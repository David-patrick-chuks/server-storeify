import express from 'express';
import { authenticateJWT, isAuthorized } from '../utils/authMiddleware';
import { sendEmailController, replyToEmail,sendBulkEmailController, getEmailsTotal, deleteEmail, getEmailsWithPagination, getEmailByMessageId } from '../controllers/emailController';
import { getEmailList } from '../controllers/emailListController';

const router = express.Router();

// Protect routes with authenticateJWT and isAuthorized middleware

router.get('/client-email-list', authenticateJWT, getEmailList);
router.get('/emails/total', authenticateJWT, getEmailsTotal);
router.post('/reply/:messageId', authenticateJWT, replyToEmail);
router.get('/emails', authenticateJWT, getEmailsWithPagination);
router.get('/emails/:messageId', authenticateJWT, getEmailByMessageId);
router.post('/send', authenticateJWT, isAuthorized, sendEmailController);
router.post('/send-bulk', authenticateJWT, isAuthorized, sendBulkEmailController); // New route for bulk emails
router.delete('/delete/:id', authenticateJWT, isAuthorized, deleteEmail);

export default router;
