import { Router } from 'express';
import { getUserProfile, updateIsNotify, checkAuthentication, updatePassword } from '../controllers/userController.js';
import { authenticateJWT } from '../utils/authMiddleware.js';

const router = Router();

// Route to get user profile
router.get('/profile', getUserProfile);

router.put('/email-notify', updateIsNotify);

router.put('/update-password', updatePassword);


// Route to update user profilep
// router.put('/profile', authenticateJWT, updateUserProfile);


router.get('/check-auth', checkAuthentication);


export default router;
