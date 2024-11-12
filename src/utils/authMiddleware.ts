import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';

// Extend the Express Request interface globally to include 'user' and 'userId'
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: JwtPayload; // Add 'user' here to hold the decoded JWT payload
    }
  }
}

// Middleware to authenticate JWT

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies.jwt;

  if (!token) {
     res.status(401).json({ message: 'No token provided. Unauthorized access.' })
     return;
  }

  // Typecast jwt.verify to the correct function signature
  (jwt.verify as (
    token: string,
    secretOrPublicKey: jwt.Secret,
    callback: (err: VerifyErrors | null, decoded: JwtPayload | undefined) => void
  ) => void)(token, process.env.JWT_SECRET || '', (err: VerifyErrors | null, decoded: JwtPayload | undefined) => {
    if (err) {
      // Handle token errors specifically
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    // Attach the decoded user data to the request object
    if (decoded) {
      req.userId = decoded.googleId; // Attach googleId to the request (matching JWT payload key)
      req.user = decoded; // Attach the full decoded user payload for further use
    }

    // Continue to the next middleware
    next();
  });
};

// Middleware to check if the user is authorized to access the resource
// In this case, only Chutek@gmail.com can access
export const isAuthorized = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user; // Now `user` is recognized on the request object

  if (user?.email !== 'pd3072894@gmail.com') {
    res.status(403).json({ message: 'Access denied. Unauthorized user.' })
    return
  }

  // If authorized, move to the next middleware or route handler
  next();
};
