// controllers/userController.ts
import { Request, Response } from 'express';
import User from '../models/User';
import logger from '../config/logger';

// Get User Profile

// Get User Profile
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId; // Get userId from JWT middleware
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    console.log(`User ID: ${userId}`);

    const user = await User.findOne({ googleId: userId }).select('-googleTokens -refreshToken'); // Exclude sensitive tokens
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user); // Return user profile data
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// // Update User Profile
// export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const userId = req.userId; // Get userId from JWT middleware
//       if (!userId) {
//         res.status(401).json({ message: 'Unauthorized' });
//         return;
//       }
  
//       const { username, email, googlePicture } = req.body;
  
//       const updatedUser = await User.findByIdAndUpdate(
//         userId,
//         {
//           $set: {
//             username,
//             email,
//             googlePicture,
//           },
//         },
//         { new: true }
//       ).select('-password'); // Do not return password in response
  
//       if (!updatedUser) {
//         res.status(404).json({ message: 'User not found' });
//         return;
//       }
  
//       res.status(200).json(updatedUser); // Return the updated user data
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   };
  
  
