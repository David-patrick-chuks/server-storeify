

import express from 'express';
import { authenticateJWT, isAuthorized } from '../utils/authMiddleware';
import { getAllEmails, sendEmailController, deleteEmail } from '../controllers/emailController';

const router = express.Router();

// Protect routes with authenticateJWT and isAuthorized middleware
router.get('/emails', authenticateJWT, isAuthorized, getAllEmails);
router.post('/send', authenticateJWT, isAuthorized, sendEmailController);
router.delete('/delete/:id', authenticateJWT, isAuthorized, deleteEmail);

export default router;
