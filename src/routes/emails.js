import express from 'express';
import { authenticateJWT, isAuthorized } from '../utils/authMiddleware.js';
import { sendEmailController, replyToEmail,sendBulkEmailController, getEmailsTotal, deleteEmail, getEmailsWithPagination, getEmailByMessageId } from '../controllers/emailController.js';
import { getEmailList } from '../controllers/emailListController.js';

const router = express.Router();

// Protect routes with authenticateJWT and isAuthorized middleware

router.get('/client-email-list',  getEmailList);
router.get('/emails/total',  getEmailsTotal);
router.post('/reply/:messageId',  replyToEmail);
router.get('/emails',  getEmailsWithPagination);
router.get('/emails/:messageId',  getEmailByMessageId);
router.post('/send',  sendEmailController);
router.post('/send-bulk',  sendBulkEmailController); // New route for bulk emails
router.delete('/delete/:id',  deleteEmail);

export default router;
