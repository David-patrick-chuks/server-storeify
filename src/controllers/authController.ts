import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { getAuthUrl, getTokens, storeTokens, createJWT } from '../services/googleOAuth';
import logger from '../config/logger';
import User from '../models/User';
import Joi from 'joi';

// Login Route (use your static login credentials)

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const login = async (req: Request, res: Response): Promise<void> => {


  const { error } = loginSchema.validate(req.body);

  if (error) {
    res.status(400).json({ message: error.details[0].message })
    return
  }

  const { email, password } = req.body;

  try {
    // Find the user by email in the db mongo database
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Check if the password matches
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    // const googleAuthUrl = await getAuthUrl();
    // if (!googleAuthUrl) {
    //   res.status(500).json({ message: 'Failed to generate Google OAuth2 URL' })
    //   return
    // }

    logger.info('User Logged in successfully');
    // logger.info('Redirecting to Google OAuth URL:', googleAuthUrl);
    
    res.status(200).json({ message: 'Logged in successfully' });
    return

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
};




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
  const { code, error, error_description } = req.query;

  // Check if the user denied access
  if (error) {
    logger.error(`OAuth2 error: ${error} - ${error_description}`);

    // Redirect to a custom UI page with an access denied message
    res.redirect(`${process.env.CLIENT_BASE_URL}/access-denied?error=${error}&description=${error_description}`);
    return;
  }

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
    res.redirect(`${process.env.CLIENT_BASE_URL}/dashboard`);
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
  if (authUrl) {
    res.redirect(authUrl);
  } else {
    res.status(500).json({ message: 'Failed to generate Google OAuth2 URL' });
  }
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
