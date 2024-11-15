import { Request, Response } from 'express';
import { checkAndRefreshAccessToken, sendEmail } from '../services/googleOAuth';
import { google } from 'googleapis';
import logger from '../config/logger';

import crypto from 'crypto';

const getGravatarUrl = (email: string, size: number = 100): string => {
  const hash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
};

// Function to extract email address from the 'From' field, e.g., "Medium Daily Digest <noreply@medium.com>"
const extractEmailFromHeader = (headerValue: string): string | null => {
  const emailMatch = headerValue.match(/<(.+?)>/); // Regular expression to match the email inside '<>'
  return emailMatch ? emailMatch[1] : null; // Return the email address if found, otherwise null
};

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
      const senderEmail = extractEmailFromHeader(senderHeader);
      const senderProfileImage = senderEmail ? await getGravatarUrl(senderEmail) : null;

      const receivedDate = email.data.internalDate ? new Date(parseInt(email.data.internalDate)).toISOString() : null;

      return {
        emails:email,
        id: email.data.id,
        threadId: email.data.threadId,
        subject: email.data.payload?.headers?.find((header) => header.name === 'Subject')?.value,
        from: senderEmail,
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
