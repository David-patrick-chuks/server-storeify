import { google } from 'googleapis';
import User from '../models/User';
import jwt from 'jsonwebtoken';

// Set up Google OAuth client
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Function to generate authentication URL
export const getAuthUrl = () => {
  const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
};

// Function to get Google tokens from authorization code
export const getTokens = async (code: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
};

// Function to store user details in MongoDB
export const storeTokens = async (userEmail: string, tokens: any) => {
  const user = await User.findOneAndUpdate({ email: userEmail }, { googleTokens: tokens.access_token, refreshToken: tokens.refresh_token }, { new: true, upsert: true });
  return user;
};

// Function to create JWT token
export const createJWT = (email: string) => {
  return jwt.sign({ email }, process.env.JWT_SECRET || '', { expiresIn: '15d' });
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
