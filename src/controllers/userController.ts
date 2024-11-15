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
    logger.info(`User ID: ${userId}`);

    const user = await User.findOne({ googleId: userId }).select('-googleTokens -refreshToken -password -createdAt -updatedAt -googleId'); // Exclude sensitive tokens
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user); // Return user profile data
  } catch (error) {
    logger.info(error);
    res.status(500).json({ message: 'Server error' });
  }
};


////// checkAuthentication
export const checkAuthentication = (req: Request, res: Response): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (req.user) {
      // Send back user data if authentication is successful
      // res.status(200).json({ message: req.user });
      logger.info("user auth data", req.user)
      res.status(200).json({ message: "Authorized", data: req.user, success: true, id:  req.userId });
      resolve(); // Resolve the promise after the response is sent
    } else {
      // Unauthorized if user is not authenticated
      res.status(401).json({ message: 'Unauthorized' });
      resolve(); // Resolve the promise after the response is sent
    }
  });
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
  
  
