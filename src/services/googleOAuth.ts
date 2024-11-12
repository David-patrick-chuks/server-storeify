import { google } from 'googleapis';
import User from '../models/User';
import jwt from 'jsonwebtoken';

// Set up Google OAuth client
const oauth2Client = new google.auth.OAuth2(
  "1072182978229-uucstd3nc542b39dncd0tasvgn8hkp3u.apps.googleusercontent.com",
  "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",
  "http://localhost:5555/api/v1/auth/google/oauth2callback"
);

// Function to generate authentication URL
export const getAuthUrl = async () => {
  const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'];

  // await oauth2Client.revokeCredentials();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    redirect_uri: "http://localhost:5555/api/v1/auth/google/oauth2callback", // Ensure this is set correctly
    prompt: 'consent' // Forces a refresh token prompt
  });
};

// Function to get Google tokens from authorization code
// export const getTokens = async (code: string) => {
//   const { tokens } = await oauth2Client.getToken(code);  // OAuth2 exchange code for tokens
//   oauth2Client.setCredentials(tokens); // Store tokens for later use
//   const profile = await oauth2Client.request({ url: 'https://www.googleapis.com/oauth2/v2/userinfo' });
//   const userData = { tokens, profile: profile.data }
//   return userData
// };

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

// Function to get Google tokens from authorization code
export const getTokens = async (code: string): Promise<{ tokens: GoogleTokens; profile: GoogleProfile }> => {
  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Check if access_token is available
    if (!tokens.access_token) {
      console.error('Access token not found:', tokens);
      throw new Error('Failed to retrieve access token');
    }

    // Ensure the tokens are set for future requests
    oauth2Client.setCredentials(tokens);

    // Fetch the user's profile information
    const { data: profileData } = await oauth2Client.request<GoogleProfile>({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });

    return {
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        id_token: tokens.id_token,
        expiry_date: tokens.expiry_date,
      },
      profile: profileData,
    };
  } catch (error) {
    console.error('Error fetching tokens or profile:', error);
    throw new Error('Failed to retrieve Google OAuth tokens or profile');
  }
};


// Function to store user details in MongoDB
// export const storeTokens = async (userEmail: string, tokens: any) => {
//   const user = await User.findOneAndUpdate({ email: userEmail }, { googleTokens: tokens.access_token, refreshToken: tokens.refresh_token }, { new: true, upsert: true });
//   return user;
// };


// interface GoogleProfile {
//   id: string;
//   email: string;
//   picture?: string;
//   name?: string;
// }

// interface GoogleTokens {
//   access_token?: string | null; // Allow undefined or null
//   refresh_token?: string | null;
// }


// Function to store user details in MongoDB
export const storeTokens = async (profile: GoogleProfile, tokens: GoogleTokens) => {
  const { id, email, picture, name } = profile;

  // Ensure tokens are valid
  const accessToken = tokens.access_token ?? null;
  const refreshToken = tokens.refresh_token ?? null;

  // Validate essential fields before storing
  if (!email || !id) {
    throw new Error('Profile must contain an email and Google ID');
  }

  // Store or update user details in the database
  const user = await User.findOneAndUpdate(
    { email },
    {
      googleId: id,
      username: name || 'Google User',
      email,
      googleTokens: accessToken,
      refreshToken: refreshToken,
      googlePicture: picture || null,
    },
    { new: true, upsert: true }
  );

  return user;
};


// Function to create JWT token

export const createJWT = (googleId: string) => {
  return jwt.sign({ googleId }, process.env.JWT_SECRET || '', { expiresIn: '15d' });
};
// Function to send email using Google API
export const sendEmail = async (to: string, subject: string, body: string) => {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const raw = `To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`;
  const encodedEmail = Buffer.from(raw).toString('base64');
  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail,
    },
  });
  return res;
};
