// controllers/userController.ts
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import logger from '../config/logger.js';
import User from '../models/User.js';

// Get User Profile

// Get User Profile
export const getUserProfile = async (req, res)  => {
  try {
    const userId = req.userId; // Get userId from JWT middleware
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    logger.info(`User ID: ${userId}`);

    const user = await User.findOne({ email: userId }).select('-googleTokens -refreshToken -password -createdAt -updatedAt -googleId'); // Exclude sensitive tokens
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
export const checkAuthentication = (req, res)  => {
  return new Promise((resolve, reject) => {
    if (req.user) {
      // Send back user data if authentication is successful
      // res.status(200).json({ message: req.user });
      logger.info("user auth data", req.user)
      res.status(200).json({ message: "Authorized", data: req.user, success: true, id: req.userId });
      resolve(); // Resolve the promise after the response is sent
    } else {
      // Unauthorized if user is not authenticated
      res.status(401).json({ message: 'Unauthorized' });
      resolve(); // Resolve the promise after the response is sent
    }
  });
};




const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(8).required(),
  newPassword: Joi.string().min(8).required().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/).messages({
    'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number.',
  }),
});




export const updatePassword = async (req, res)  => {
  try {
    // Validate the request body using Joi schema
    const { error } = updatePasswordSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0].message });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Assuming user ID is stored in the session or JWT token
    const googleId = req.userId;
    if (!googleId) {
      res.status(400).json({ message: 'User ID is missing or invalid.' });
      // res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Fetch user from the database
    const user = await User.findOne({ googleId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if the current password is correct
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    user.password = hashedNewPassword;
    await user.save();

    logger.info(`User with  ID: ${googleId} successfully updated their password`);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Error updating password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateIsNotify = async (req, res)  => {
  try {
    // Validate the request body using Joi schema


    const { emailNotify } = req.body;

    // Assuming user ID is stored in the session or JWT token
    const googleId = req.userId;
    if (!googleId) {
      res.status(400).json({ message: 'User ID is missing or invalid.' });
      // res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Fetch user from the database
    const user = await User.findOne({ googleId });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.notify = emailNotify;
    await user.save();

    logger.info(`User with  ID: ${googleId} successfully updated their notify by mail`);
    res.status(200).json({ message: 'Notify by mail updated successfully' });
  } catch (error) {
    logger.error('Error updating notify by mail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};