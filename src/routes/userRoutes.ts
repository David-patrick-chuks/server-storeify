import { Router } from 'express';
import { getUserProfile,checkAuthentication, updatePassword } from '../controllers/userController';
import { authenticateJWT } from '../utils/authMiddleware';

const router = Router();

// Route to get user profile
router.get('/profile', authenticateJWT, getUserProfile);
router.put('/update-password', authenticateJWT, updatePassword);


// Route to update user profilep
// router.put('/profile', authenticateJWT, updateUserProfile);


router.get('/check-auth', authenticateJWT, checkAuthentication);


export default router;
