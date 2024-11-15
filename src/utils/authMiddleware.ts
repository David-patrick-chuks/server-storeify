import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import User from '../models/User';
import { refreshAccessToken } from '../services/googleOAuth';

// Extend the Express Request interface globally to include 'user' and 'userId'
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: JwtPayload; // Add 'user' here to hold the decoded JWT payload
    }
  }
}


// Middleware to check if the user is authorized to access the resource
// In this case, only Chutek@gmail.com can access
export const isAuthorized = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user; // Now `user` is recognized on the request object

    // Ensure that the user object and googleId are present
    if (!user?.googleId) {
      res.status(400).json({ message: 'User Google ID missing in the request.' })
      return
    }

    // Check if the Google ID exists in the MongoDB database
    const foundUser = await User.findOne({ googleId: user.googleId });

    if (!foundUser) {
      // If the user does not exist in the database, deny access
      res.status(403).json({ message: 'Access denied. Unauthorized user.' })
      return
    }

    // If user is authorized, continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error in isAuthorized middleware:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


// Middleware to authenticate JWT
export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies.jwt;

  if (!token) {
    res.status(401).json({ message: 'No token provided. Unauthorized access.' });
    return;
  }

  // Typecast jwt.verify to the correct function signature
  (jwt.verify as (
    token: string,
    secretOrPublicKey: jwt.Secret,
    callback: (err: VerifyErrors | null, decoded: JwtPayload | undefined) => void
  ) => void)(token, process.env.JWT_SECRET || '', async (err: VerifyErrors | null, decoded: JwtPayload | undefined) => {
    if (err) {
      // Handle token errors specifically
      if (err.name === 'TokenExpiredError') {
        // Check if the refresh token is available
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
          return res.status(401).json({ message: 'Token expired and no refresh token provided.' });
        }

        // Attempt to refresh the access token using the refresh token
        try {
          if (!decoded) {
            return res.status(401).json({ message: 'Invalid token structure' });
          }
          // Assuming `decoded.googleId` is the user's unique identifier
          const user = await User.findOne({ googleId: decoded.googleId });
          if (!user || !user.refreshToken) {
            return res.status(401).json({ message: 'No refresh token associated with this user.' });
          }

          // Refresh the access token using the stored refresh token
          const newAccessToken = await refreshAccessToken(user.refreshToken);
          if (!newAccessToken) {
            return res.status(401).json({ message: 'Failed to refresh access token.' });
          }

          // Set the new access token in the response cookies
          res.cookie('jwt', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            maxAge: 30 * 60 * 1000, // Set the expiration time for the access token (30 minutes)
          });

          // Retry the request with the new token
          return next();
        } catch (refreshError) {
          return res.status(401).json({ message: 'Failed to refresh token' });
        }
      }
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    // Attach the decoded user data to the request object
    if (decoded && decoded.accessToken) {
      req.userId = decoded.googleId; // Attach googleId to the request (matching JWT payload key)
      req.user = decoded; // Attach the full decoded user payload for further use
    } else {
      return res.status(401).json({ message: 'Invalid token structure' });
    }

    // Continue to the next middleware
    next();
  });
};


