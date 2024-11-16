import { Request, Response } from 'express';
import { checkAndRefreshAccessToken, sendEmail } from '../services/googleOAuth';
import { google } from 'googleapis';
import logger from '../config/logger';
import sharp from 'sharp';

// Helper function to generate a random color in hex format
const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Function to generate the avatar
const generateAvatar = async (email: string, size: number = 100): Promise<string> => {
  // Extract the first letter of the email (before '@')
  const initial = email.trim().toLowerCase().split('@')[0].charAt(0).toUpperCase();

  // Generate a random background color
  const bgColor = getRandomColor();

  // Create the avatar image using sharp
  const image = await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: bgColor,  // Set the background to the random color
    },
  })
    .composite([
      {
        input: Buffer.from(`
          <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${bgColor}" />
            <text x="50%" y="50%" font-size="${size / 2}" font-family="Arial" text-anchor="middle" dy=".3em" fill="white">${initial}</text>
          </svg>
        `),
        blend: 'over',
      },
    ])
    .png()  // Convert to PNG image format
    .toBuffer();  // Convert the image to a buffer

  // Convert the buffer to a Base64-encoded string
  const base64Image = image.toString('base64');
  
  // Return the Base64 image as a data URL
  return `data:image/png;base64,${base64Image}`;
};
import crypto from 'crypto';
import { checkAndUpdateEmailCount } from '../utils/checkAndUpdateEmailCount';

const getGravatarUrl = (email: string, size: number = 100): string => {
  const hash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
};

// Function to extract email address from the 'From' field, e.g., "Medium Daily Digest <noreply@medium.com>"
const extractEmailFromHeader = (headerValue: string): string | null => {
  const emailMatch = headerValue.match(/<(.+?)>/); // Regular expression to match the email inside '<>'
  return emailMatch ? emailMatch[1] : null; // Return the email address if found, otherwise null
};

function extractName(emailString: string): string {
  const match = emailString.match(/^(.+?)\s*<.*?>$/);
  return match ? match[1].trim() : '';
}

export const getEmailsWithPagination = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(400).json({ message: 'User ID is missing or invalid.' });
      return;
    }

    const accessToken = await checkAndRefreshAccessToken(userId);
    if (!accessToken) {
      res.status(401).json({ message: 'Unauthorized, no access token provided.' });
      return;
    }

    const limit = parseInt(req.query.limit as string, 10) || 10;
    const nextPageToken = req.query.nextPageToken as string | undefined;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const profile = await gmail.users.getProfile({
      userId: 'me', // Fetch the authenticated user's profile
    });

    const { emailAddress, historyId, messagesTotal, threadsTotal } = profile.data;

    // Fetch emails with pagination
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: limit,
      pageToken: nextPageToken ? nextPageToken : undefined,
    });

    const messages = response.data.messages || [];
    let nextPageTokenFromList = response.data.nextPageToken || null;

    // Log tokens for debugging
    console.log("Received nextPageToken from request:", nextPageToken);
    console.log("New nextPageToken from Gmail response:", nextPageTokenFromList);

    // Check if `nextPageToken` from request matches the one from Gmail response
    if (nextPageToken && nextPageToken === nextPageTokenFromList) {
      nextPageTokenFromList = null; // End of pages
    }

    // Fetch detailed email information
    const emailDetailsPromises = messages.map(async (message) => {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
      });

      // logger.info("All email messages",email)
      const senderHeader = email.data.payload?.headers?.find((header) => header.name === 'From')?.value || '';
      const messageId = email.data.payload?.headers?.find((header) => header.name === 'Message-ID')?.value || '';
      const senderEmail = extractEmailFromHeader(senderHeader);
      const senderName = extractName(senderHeader);
      // const senderProfileImage = senderEmail ? await getGravatarUrl(senderEmail) : null;
      const senderProfileImage = senderEmail ? await generateAvatar(senderEmail) : null;

      const receivedDate = email.data.internalDate ? new Date(parseInt(email.data.internalDate)).toISOString() : null;

      return {
        emails:email,
        id: email.data.id,
        messageId,
        threadId: email.data.threadId,
        subject: email.data.payload?.headers?.find((header) => header.name === 'Subject')?.value,
         senderEmail,
        senderName,
        to: email.data.payload?.headers?.find((header) => header.name === 'To')?.value,
        snippet: email.data.snippet,
        senderProfileImage,
        receivedDate,
      };
    });

    const emailDetails = await Promise.all(emailDetailsPromises);

    // Send response with pagination
    res.status(200).json({
      emailAddress, historyId, messagesTotal, threadsTotal,
      message: 'Emails fetched successfully',
      emails: emailDetails,
      pagination: {
        limit,
        prevPageToken: nextPageToken,
        nextPageToken: nextPageTokenFromList,
      },
    });
  } catch (error: any) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      message: 'Failed to fetch emails',
      error: error.message,
    });
  }
};

export const getEmailsTotal = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(400).json({ message: 'User ID is missing or invalid.' });
      return;
    }

    const accessToken = await checkAndRefreshAccessToken(userId);
    if (!accessToken) {
      res.status(401).json({ message: 'Unauthorized, no access token provided.' });
      return;
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const profile = await gmail.users.getProfile({
      userId: 'me', // Fetch the authenticated user's profile
    });

    const { emailAddress, historyId, messagesTotal, threadsTotal } = profile.data;
    // Send response with pagination
    res.status(200).json({
      emailAddress, historyId, messagesTotal, threadsTotal,
      message: 'Toatal Email messages successfully',
     
    });
  } catch (error: any) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      message: 'Failed to fetch emails',
      error: error.message,
    });
  }
};




export const sendBulkEmailController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const googleId = req.userId;
    if (!userId) {
      res.status(400).json({ message: 'User ID is missing or invalid.' });
      return;
    }

    if (!googleId) {
      res.status(400).json({ message: 'Google ID is missing or invalid.' });
      return;
    }
    const canSendEmail = await checkAndUpdateEmailCount(googleId);
    // Check if the user can send emails based on their daily limit
    if (!canSendEmail) {
      res.status(429).json({ message: 'Daily email limit reached. Please try again after 24 hours.' });
      return;
    }

    const accessToken = await checkAndRefreshAccessToken(userId);
    if (!accessToken) {
      res.status(401).json({ message: 'Unauthorized, no access token provided.' });
      return;
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const { subject, messageBody, recipients } = req.body; // recipients should be an array of emails

    if (!recipients || recipients.length === 0) {
      res.status(400).json({ message: 'Recipient list cannot be empty.' });
      return;
    }

    // Iterate through the list of recipients and send the email
    for (const recipient of recipients) {
      const email = `
        From: "Your Name" <your-email@gmail.com>
        To: ${recipient}
        Subject: ${subject}
        
        ${messageBody}
      `;

      try {
        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: Buffer.from(email).toString('base64'),
          },
        });
      } catch (error) {
        console.error(`Error sending email to ${recipient}:`, error);
      }
    }

    res.status(200).json({ message: 'Bulk emails sent successfully' });
  } catch (error: any) {
    console.error('Error sending bulk emails:', error);
    res.status(500).json({
      message: 'Failed to send bulk emails',
      error: error.message,
    });
  }
};















// export const getAllEmails = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { accessToken } = req.user || {}; // Access token exists after authentication

//     if (!accessToken) {
//       res.status(401).json({ message: 'Unauthorized, no access token provided.' });
//       return;
//     }

//     const limit = parseInt(req.query.limit as string, 10) || 10;
//     const page = parseInt(req.query.page as string, 10) || 1;

//     const oauth2Client = getGmailClient(accessToken);

//     // Get the total count of all messages in the user's Gmail (without query filter)
//     const totalResponse = await gmail.users.messages.list({
//       userId: 'me',
//       auth: oauth2Client,
//       maxResults: 500,
//       pageToken: req.query.pageToken as string || undefined
//     });

//     const totalEmails = totalResponse.data.resultSizeEstimate || 0;

//     // Calculate pagination
//     const maxResults = limit;
//     const startIndex = (page - 1) * maxResults;

//     // Fetch paginated unread email messages
//     const response = await gmail.users.messages.list({
//       userId: 'me',
//       auth: oauth2Client,
//       q: 'is:unread', // Modify as needed
//       maxResults,
//       pageToken: req.query.pageToken as string || undefined,
//     });

//     const messages = response.data.messages || [];
//     const nextPageToken = response.data.nextPageToken || null;

//     // Fetch full message details for each email ID returned
//     const emailPromises = messages.map(async (message) => {
//       const email = await gmail.users.messages.get({
//         userId: 'me',
//         id: message.id!,
//         auth: oauth2Client,
//       });

//       return email.data;
//     });

//     // Resolve all email details
//     const emailDetails = await Promise.all(emailPromises);

//     res.status(200).json({
//       message: 'Emails fetched successfully',
//       totalEmails,
//       emails: emailDetails,
//       pagination: {
//         currentPage: page,
//         limit,
//         nextPageToken,
//       },
//     });
//   } catch (error: Error | any) {
//     console.error('Error fetching emails:', error);
//     res.status(500).json({
//       message: 'Failed to fetch emails',
//       error: error.message,
//     });
//   }
// };




// Send email








export const getEmailByMessageId = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const messageId = req.params.messageId; // Getting messageId from request parameters

    if (!userId) {
      res.status(400).json({ message: 'User ID is missing or invalid.' });
      return;
    }

    if (!messageId) {
      res.status(400).json({ message: 'Message ID is required.' });
      return;
    }

    const accessToken = await checkAndRefreshAccessToken(userId);
    if (!accessToken) {
      res.status(401).json({ message: 'Unauthorized, no access token provided.' });
      return;
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Fetch the email by message ID
    const email = await gmail.users.messages.get({
      userId: 'me',  // or the user's email address
      id: messageId, // Message ID from the request parameter
    });

    const senderHeader = email.data.payload?.headers?.find((header) => header.name === 'From')?.value || '';
    const senderEmail = extractEmailFromHeader(senderHeader);
    const senderName = extractName(senderHeader);
    const senderProfileImage = senderEmail ? await getGravatarUrl(senderEmail) : null;

    const receivedDate = email.data.internalDate ? new Date(parseInt(email.data.internalDate)).toISOString() : null;

    // Respond with the detailed message info
    res.status(200).json({
      message: 'Email fetched successfully',
      email: {
        id: email.data.id,
        threadId: email.data.threadId,
        subject: email.data.payload?.headers?.find((header) => header.name === 'Subject')?.value,
        from: senderEmail,
        senderName,
        to: email.data.payload?.headers?.find((header) => header.name === 'To')?.value,
        snippet: email.data.snippet,
        senderProfileImage,
        receivedDate,
        rawPayload: email.data.payload, // Full raw email payload if needed
      },
    });
  } catch (error: any) {
    console.error('Error fetching email by message ID:', error);
    res.status(500).json({
      message: 'Failed to fetch email',
      error: error.message,
    });
  }
};







export const sendEmailController = async (req: Request, res: Response) => {
  const { to, subject, body } = req.body;
  try {
    await sendEmail(to, subject, body);
    res.status(200).send('Email sent successfully');
  } catch (err) {
    res.status(500).send('Failed to send email');
  }
};

// Delete email
export const deleteEmail = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const oauth2Client = new google.auth.OAuth2();
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    await gmail.users.messages.delete({ userId: 'me', id });
    res.status(200).send('Email deleted successfully');
  } catch (err) {
    res.status(500).send('Failed to delete email');
  }
};


