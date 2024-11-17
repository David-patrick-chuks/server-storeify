import express from 'express';
import { authenticateJWT, isAuthorized } from '../utils/authMiddleware';
import { emailContent } from '../controllers/aiEmailContent';

const router = express.Router();

router.post("/generate",authenticateJWT,isAuthorized ,emailContent )


export default router;
