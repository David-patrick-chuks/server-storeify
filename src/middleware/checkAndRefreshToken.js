// import { Request, Response, NextFunction } from 'express';
// import { google } from 'googleapis';
// import User from '../models/User';
// import { refreshAccessToken } from '../services/googleOAuth';

// // Extend Express Request interface to include accessToken
// declare module 'express' {
//   interface Request {
//     accessToken?: string;
//     user?: {
//       id: string;
//     };
//   }
// }
// export const checkAndRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       // If the JWT is already validated (e.g., via authenticateJWT), don't refresh
//       if (req.user) {
//         // We already have a valid user from JWT, just proceed
//         return next();
//       }
  
//       // Proceed with Google token refresh logic if no valid JWT is found
//       const userId = req.user?.id;
//       if (!userId) {
//         return res.status(401).json({ message: 'Unauthorized: User ID not found' });
//       }
  
//       // Fetch the stored tokens from MongoDB
//       const user = await User.findOne({ _id: userId });
//       if (!user || !user.googleTokens) {
//         return res.status(401).json({ message: 'No Google tokens found for user' });
//       }
  
//       const tokens = {
//         access_token: user.googleTokens,
//         refresh_token: user.refreshToken,
//         expiry_date: user.tokenExpiryDate, // Ensure you have this field in your schema
//       };
  
//       // Check if the access token is expired
//       if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
//         console.log('Access token expired, attempting to refresh...');
  
//         if (tokens.refresh_token) {
//           try {
//             // Refresh the access token
//             const newAccessToken = await refreshAccessToken(tokens.refresh_token);
  
//             if (newAccessToken) {
//               // Update tokens in the database with new expiry date
//               const newExpiryDate = Date.now() + 3600 * 1000; // 1 hour from now
//               await User.findByIdAndUpdate(userId, {
//                 googleTokens: newAccessToken,
//                 tokenExpiryDate: newExpiryDate,
//               });
  
//               console.log('Token refreshed successfully');
//               req.accessToken = newAccessToken; // Attach new token to request
//             } else {
//               return res.status(401).json({ message: 'Failed to refresh access token' });
//             }
//           } catch (err) {
//             console.error('Error refreshing access token:', err);
//             return res.status(500).json({ message: 'Failed to refresh access token' });
//           }
//         } else {
//           return res.status(401).json({ message: 'Missing refresh token' });
//         }
//       } else {
//         // If token is valid, attach it to the request for further use
//         req.accessToken = tokens.access_token;
//       }
  
//       // Proceed to the next middleware or route handler
//       next();
//     } catch (err) {
//       console.error('Error in token validation middleware:', err);
//       res.status(500).json({ message: 'Server error during token validation' });
//     }
//   };
  