
import express from 'express';
import {  logout, oauth2Callback, redirectToGoogleLogin } from '../controllers/authController';

const router = express.Router();

// Login Route (use your static login credentials)

router.post('/logout', logout);
// Google OAuth2 Callback
router.get('/google/oauth2callback', oauth2Callback);

// Redirect to Google OAuth2 for login
router.get('/login/google', redirectToGoogleLogin);

export default router;
