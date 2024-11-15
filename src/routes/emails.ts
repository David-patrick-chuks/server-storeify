

import express from 'express';
import { authenticateJWT, isAuthorized } from '../utils/authMiddleware';
import {  sendEmailController, deleteEmail, getEmailsWithPagination } from '../controllers/emailController';

const router = express.Router();

// Protect routes with authenticateJWT and isAuthorized middleware
router.get('/emails', authenticateJWT, getEmailsWithPagination);
router.post('/send', authenticateJWT, isAuthorized, sendEmailController);
router.delete('/delete/:id', authenticateJWT, isAuthorized, deleteEmail);

export default router;
