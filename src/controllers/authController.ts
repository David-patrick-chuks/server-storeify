import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { getAuthUrl, getTokens, storeTokens, createJWT } from '../services/googleOAuth';
import logger from '../config/logger';
import User from '../models/User';

// Login Route (use your static login credentials)
// export const login = async (req: Request, res: Response): Promise<void> => {
//   const { username, password } = req.body;

//   try {
//     // Find the user by username or email
//     // const user = await User.findOne({ $or: [{ username }, { email: username }] });

//     const user = await User.findOne({ username });

//     if (!user) {
//       res.status(401).json({ message: 'User not found' });
//       return;
//     }

//     // Check if the password matches
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       res.status(401).json({ message: 'Invalid credentials' });
//       return;
//     }

//     // Generate JWT token
//     const jwtToken = createJWT(user.email);
//     res.cookie('jwt', jwtToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days
//     });

//     res.status(200).json({ message: 'Logged in successfully' });
//     return;
//   } catch (error) {
//     console.error('Error during login:', error);
//     res.status(500).json({ message: 'Internal server error' });
//     return;
//   }
// };



// Google OAuth2 Callback

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string | null;
  scope?: string;
  token_type?: string | null;
  id_token?: string | null;
  expiry_date?: number | null;
}

export interface GoogleProfile {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}


// Google OAuth2 Callback
export const oauth2Callback = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;

  if (!code) {
    res.status(400).send('No authorization code provided');
    return;
  }

  try {
    const { tokens, profile }: { tokens: GoogleTokens; profile: GoogleProfile } = await getTokens(code as string);

    if (!tokens || !tokens.access_token) {
      logger.error('Access token not found');
      res.status(400).send('Failed to retrieve access token');
      return;
    }

    // Ensure profile has an email
    if (!profile || !profile.email) {
      logger.error('Email not found in Google profile');
      res.status(400).send('Failed to retrieve email from Google profile');
      return;
    }

    // Store tokens and user profile info in the database
    await storeTokens(profile, tokens);

    // Generate JWT token with googleId and accessToken
    const jwtToken = createJWT(profile.id, tokens.access_token); // Include access_token in the JWT

    // Set JWT token in cookies
    res.cookie('jwt', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    });

    logger.info('Authentication successful, redirecting to profile');
    res.redirect('http://localhost:5173/about');
  } catch (err) {
    if (err instanceof Error) {
      logger.error(`Error during Google OAuth2 callback: ${err.message}`, err.stack);
    } else {
      logger.error('Unknown error during Google OAuth2 callback');
    }
    res.status(500).send('Failed to authenticate');
  }
};


// Redirect to Google OAuth2 for login
export const redirectToGoogleLogin = async (req: Request, res: Response): Promise<void> => {
  const authUrl = await getAuthUrl()
  res.redirect(authUrl);
};



// Logout function
// Logout function
export const logout = (req: Request, res: Response) => {
  // Clear the cookie by using the same options as during setting the cookie
  res.clearCookie('jwt', {
    httpOnly: true, // Ensure it was set with httpOnly
    secure: process.env.NODE_ENV === 'production', // Make sure it's the same secure flag
    sameSite: 'strict', // Same site settings should match what was used when setting the cookie
  });

  res.status(200).json({ message: 'Logged out successfully' });
};



// export const logout = (req: Request, res: Response) => {
//   req.session.destroy((err) => {
//     if (err) {
//       return res.status(500).json({ message: 'Logout failed' });
//     }
//     res.clearCookie('connect.sid');
//     res.status(200).json({ message: 'Logged out successfully' });
//   });
// };
