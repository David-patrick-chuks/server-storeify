import express from 'express';
import { authenticateJWT, isAuthorized } from '../utils/authMiddleware.js';
import { emailContent } from '../controllers/aiEmailContent.js';

const router = express.Router();

router.post("/generate" ,emailContent )


export default router;
