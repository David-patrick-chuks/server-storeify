import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { refreshAccessToken } from '../services/googleOAuth.js';

// Middleware to check if the user is authorized to access the resource
// In this case, only Chutek@gmail.com can access// Middleware to check if the user is authorized to access the resource
export const isAuthorized = async (req, res, next) => {
  try {
    const user = req.user; // Now `user` is recognized on the request object

    // Ensure that the user object and googleId are present
    if (!user?.googleId) {
      return res.status(400).json({ message: 'User Google ID missing in the request.' });
    }

    // Check if the Google ID exists in the MongoDB database
    const foundUser = await User.findOne({ googleId: user.googleId });

    if (!foundUser) {
      // If the user does not exist in the database, deny access
      return res.status(403).json({ message: 'Access denied. Unauthorized user.' });
    }

    // If user is authorized, continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error in isAuthorized middleware:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// Middleware to authenticate JWT
// Middleware to authenticate JWT
import jwt from 'jsonwebtoken';

// Middleware to authenticate JWT
export const authenticateJWT = (req, res, next) => {
  // Check for token in the Authorization header (Bearer token)
  const token = req.headers['authorization']?.split(' ')[1] || req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ message: 'No token provided. Unauthorized access.' });
  }

  // Verify the JWT token
  jwt.verify(token, process.env.JWT_SECRET || '', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    // Attach the decoded user data to the request object
    if (decoded && decoded.googleId) {
      req.userId = decoded.googleId; // Attach googleId to the request (matching JWT payload key)
      req.user = decoded; // Attach the full decoded user payload for further use
    } else {
      return res.status(401).json({ message: 'Invalid token structure' });
    }
    
    // Continue to the next middleware
    next();
  });
};
