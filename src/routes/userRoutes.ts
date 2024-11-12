import { Router } from 'express';
import { getUserProfile } from '../controllers/userController';
import { authenticateJWT } from '../utils/authMiddleware';

const router = Router();

// Route to get user profile
router.get('/profile', authenticateJWT, getUserProfile);

// Route to update user profilep
// router.put('/profile', authenticateJWT, updateUserProfile);

router.get('/check-auth', authenticateJWT, (req, res) => {
    res.status(200).json({ message: 'User is authenticated' });
  });

  
export default router;
