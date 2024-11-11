

import express from 'express';
import { authenticateJWT, isAuthorized } from '../utils/authMiddleware';
import { getEmails, sendEmailController, deleteEmail } from '../controllers/emailController';

const router = express.Router();

// Protect routes with authenticateJWT and isAuthorized middleware
router.get('/emails', authenticateJWT, isAuthorized, getEmails);
router.post('/send', authenticateJWT, isAuthorized, sendEmailController);
router.delete('/delete/:id', authenticateJWT, isAuthorized, deleteEmail);

export default router;
