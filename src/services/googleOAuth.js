import { google } from 'googleapis';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Set up Google OAuth client
const oauth2Client = new google.auth.OAuth2(
  "1072182978229-uucstd3nc542b39dncd0tasvgn8hkp3u.apps.googleusercontent.com",
  "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",
  "https://server-storeify.onrender.com/api/v1/auth/google/oauth2callback"
);

export const refreshAccessToken = async (refreshToken)=> {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const response = await oauth2Client.refreshAccessToken();
    return response.credentials.access_token; // Return the new access token
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token');
  }
};
// Function to generate authentication URL
export const getAuthUrl = async () => {
  const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    "https://www.googleapis.com/auth/gmail.modify",
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    "https://www.googleapis.com/auth/contacts.readonly"
  ];

  try {
    // Generate the Google OAuth2 URL with necessary parameters
    const googleAuthUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      redirect_uri: process.env.REDIRECT_URI || "https://server-storeify.onrender.com/api/v1/auth/google/oauth2callback", // Use environment variable for flexibility
      prompt: 'consent' // Forces the user to re-consent
    });

    return googleAuthUrl;
  } catch (error) {
    console.error('Error generating Google Auth URL:', error);
    return null;
  }
};



export const getTokens = async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      console.error('Access token not found:', tokens);
      throw new Error('Failed to retrieve access token');
    }

    oauth2Client.setCredentials(tokens);

    // Fetch the user's profile information
    const { data: profileData } = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
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
    console.error('Error fetching tokens or profile:', error.message || error);
    throw new Error('Failed to retrieve Google OAuth tokens or profile');
  }
};




// Function to store user details in MongoDB
export const storeTokens = async (profile, tokens) => {
  const { id, email, picture, name } = profile;

  // Ensure tokens are valid
  const accessToken = tokens.access_token ?? null;
  const refreshToken = tokens.refresh_token ?? null;

  // Validate essential fields before storing
  if (!email || !id) {
    throw new Error('Profile must contain an email and Google ID');
  }

  if (!accessToken || !refreshToken) {
    throw new Error('Tokens must contain both access and refresh tokens');
  }

  // Store or update user details in the database
  try {
    const user = await User.findOneAndUpdate(
      { email },
      {
        googleId: id,
        username: name || 'Google User', // Default username if name is not provided
        email,
        googleTokens: accessToken, // Store the access token
        refreshToken: refreshToken, // Store the refresh token
        googlePicture: picture || null, // Optional profile picture
        tokenExpiryDate: Date.now() + 1800 * 1000, // Set the expiry date to 30 minutes from now
      },
      { new: true, upsert: true } // Ensure we get the updated user, and insert if not found
    );

    return user;
  } catch (err) {
    console.error('Error storing tokens:', err);
    throw new Error('Failed to store user tokens');
  }
};

// Function to create JWT token
// Create JWT including accessToken
// export const createJWT = (googleId, accessToken) => {
//   return jwt.sign({ googleId, accessToken }, process.env.JWT_SECRET || 'R3@lM3G@N0!_S3cure&Pa$$w0rd20244SWEET', { expiresIn: '15d' });
// };
;

export const createJWT = (email) => {
  // Ensure you set JWT_SECRET in your environment variables for production
  if (!process.env.JWT_SECRET) {
    console.warn("Warning: Using fallback secret key. Set process.env.JWT_SECRET for production.");
  }

  return jwt.sign(
    { email }, // Payload: only include the email
    process.env.JWT_SECRET || 'fallbackSecretKey-R3@lM3G@N0!_S3cure&Pa$$w0rd20244SWEET', // Secret key (use env var in production)
    {
      algorithm: 'HS256', // Explicitly define the algorithm
      expiresIn: '2m', // Token expiration time
    }
  );
};


// Function to send email using Google API
export const sendEmail = async (to, subject, body) => {
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


// Function to retrieve tokens from the database for a specific user using googleId (userId)
const getTokensFromDB = async (userId) => {
  try {
    // Query the database for the user by googleId (userId passed as parameter)
    const user = await User.findOne({ email: userId }).select('googleTokens refreshToken tokenExpiryDate');

    if (!user) {
      throw new Error('User not found');
    }

    // Return the user's tokens and token expiry date
    return {
      access_token: user.googleTokens,
      refresh_token: user.refreshToken,
      expiry_date: user.tokenExpiryDate,
    };
  } catch (error) {
    console.error('Error retrieving tokens from database:', error);
    throw new Error('Failed to retrieve tokens');
  }
};


// Function to update the tokens in the database for a specific user
const updateTokensInDB = async (userId, newAccessToken, newRefreshToken, newExpiryDate) => {
  try {
    // Find the user by googleId (userId) and update their tokens and expiry date
    const updatedUser = await User.findOneAndUpdate(
      { email: userId }, // Query to find the user by googleId
      {
        googleTokens: newAccessToken, // Update access token
        refreshToken: newRefreshToken, // Update refresh token
        tokenExpiryDate: newExpiryDate, // Update token expiry date
      },
      { new: true } // This option ensures that the returned document is the updated one
    );

    if (!updatedUser) {
      throw new Error('User not found or failed to update');
    }

    console.log('Tokens updated successfully:', updatedUser);
    return updatedUser;  // Return the updated user document, or you can return just the updated tokens if needed
  } catch (error) {
    console.error('Error updating tokens in database:', error);
    throw new Error('Failed to update tokens');
  }
};




export const checkAndRefreshAccessToken = async (userId) => {
  try {
    // Retrieve tokens from the database
    const { access_token, refresh_token, expiry_date } = await getTokensFromDB(userId);

    // Check if the access token is expired
    const currentTime = Date.now();
    if (expiry_date && expiry_date < currentTime) {
      console.log('Access token expired, refreshing...');

      if (refresh_token === null) {
        throw new Error('Refresh token is null, cannot refresh access token');
      }

      // Refresh the access token
      const newAccessToken = await refreshAccessToken(refresh_token);

      // Get a new expiry date (usually, 1 hour from now)
      const newExpiryDate = currentTime + 3600 * 1000; // Assuming 1 hour expiry

      // Update the tokens in the database
      const updatedUser = await updateTokensInDB(userId, newAccessToken, refresh_token, newExpiryDate);

      // Return the new access token
      return updatedUser.googleTokens;

    } else {
      console.log('Access token is still valid.');
      return access_token;
      // Return the current access token if it's valid
    }
  } catch (error) {
    console.error('Error checking and refreshing access token:', error);
    throw new Error('Failed to validate or refresh access token');
  }
};