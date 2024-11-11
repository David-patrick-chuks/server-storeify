import { Request, Response } from 'express';
import { getAuthUrl, getTokens, storeTokens, createJWT } from '../services/googleOAuth';

// Login Route (use your static login credentials)
export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (username === 'Chutek Telogines' && password === '5686qwerty') {
    // Successful login, generate JWT token
    const jwtToken = createJWT('Chutek@gmail.com');
    res.cookie('jwt', jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 24 * 60 * 60 * 1000
    })
    res.status(200).json({ message: 'Logged in successfully' })
    return
  } else {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }
};

// Google OAuth2 Callback
export const oauth2Callback = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;
  if (!code) {
    res.status(400).send('No code provided')
    return
  }

  try {
    const tokens = await getTokens(code as string);
    await storeTokens('Chutek@gmail.com', tokens);
    const jwtToken = createJWT('Chutek@gmail.com');
    res.cookie('jwt', jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 24 * 60 * 60 * 1000
    });

    // Ensure that the response is returned properly
    res.redirect('/dashboard')
    return // This is where the redirection should occur.
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to authenticate')
    return
  }
};


// Redirect to Google OAuth2 for login
export const redirectToGoogleLogin = (req: Request, res: Response): void => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
};
