import { Request, Response } from 'express';
import { checkAndRefreshAccessToken, sendEmail } from '../services/googleOAuth';
import { google, gmail_v1 } from 'googleapis';
import logger from '../config/logger';
import sharp from 'sharp';

// Helper function to generate a random color in hex format
// Helper function to generate a random muted color (pastel-like)
const getRandomMutedColor = (): string => {
  // Generate random values for Hue (0 to 360), Saturation (40% to 60%), and Lightness (60% to 80%)
  const hue = Math.floor(Math.random() * 360); // Random color hue
  const saturation = Math.floor(Math.random() * 21) + 40; // Saturation between 40% and 60%
  const lightness = Math.floor(Math.random() * 21) + 60; // Lightness between 60% and 80%

  // Convert HSL to hex
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
// Function to generate the avatar
const generateAvatar = async (email: string, size: number = 100): Promise<string> => {
  // Extract the first letter of the email (before '@')
  const initial = email.trim().toLowerCase().split('@')[0].charAt(0).toUpperCase();

  // Generate a random background color
  const bgColor = getRandomMutedColor();

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
import { AiTextToHtmlFormater } from '../services/aiEmailFomater';

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
      try {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
        });

        const senderHeader = email.data.payload?.headers?.find((header) => header.name === 'From')?.value || '';
        const messageId = email.data.payload?.headers?.find((header) => header.name === 'Message-ID')?.value || '';
        const senderEmail = extractEmailFromHeader(senderHeader);
        const senderName = extractName(senderHeader);
        const senderProfileImage = senderEmail ? await generateAvatar(senderEmail) : null;

        const receivedDate = email.data.internalDate ? new Date(parseInt(email.data.internalDate)).toISOString() : null;
        const isUnread = email.data.labelIds?.includes('UNREAD') ?? false;
        const isSentByMe = email.data.labelIds?.includes('SENT') ?? false;
        const replyReceiverHeader = email.data.payload?.headers?.find((header) => header.name === 'To')?.value || '';
        const replyProfileImage = replyReceiverHeader ? await generateAvatar(replyReceiverHeader) : null;

        return {
          emails: email,
          id: email.data.id,
          messageId,
          threadId: email.data.threadId,
          subject: email.data.payload?.headers?.find((header) => header.name === 'Subject')?.value,
          senderEmail: isSentByMe ? replyReceiverHeader : senderEmail,
          senderName: isSentByMe ? "You replied to:" : senderName,
          to: email.data.payload?.headers?.find((header) => header.name === 'To')?.value,
          snippet: email.data.snippet,
          senderProfileImage: isSentByMe ? replyProfileImage : senderProfileImage,
          receivedDate,
          isUnread,
        };
      } catch (error) {
        console.error(`Error fetching email with ID ${message.id}:`, error);
        return null; // Handle errors gracefully
      }
    });

    const emailDetails = (await Promise.all(emailDetailsPromises)).filter((email) => email !== null);
    // Send response with pagination
    res.status(200).json({
      emailAddress,
      historyId,
      messagesTotal,
      threadsTotal,
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

    if (!userId || !googleId) {
      res.status(400).json({ message: 'User ID or Google ID is missing or invalid.' });
      return;
    }

    const canSendEmail = await checkAndUpdateEmailCount(googleId);

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
    const { subject, messageBody, recipients } = req.body;

    const profile = await gmail.users.getProfile({
      userId: 'me', // Fetch the authenticated user's profile
    });
    const emailBodyHtml = await AiTextToHtmlFormater(messageBody)
    const { emailAddress } = profile.data;

    if (!recipients || recipients.length === 0) {
      res.status(400).json({ message: 'Recipient list cannot be empty.' });
      return;
    }

    const emailSendingPromises = recipients.map(async (recipient: any) => {
      const emailLines = [
        `From: ${emailAddress}`,
        `To: ${recipient}`,
        'Content-type: text/html; charset=UTF-8',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        emailBodyHtml,
        ''
      ];

      const email = emailLines.join('\r\n').trim();
      const base64Email = Buffer.from(email).toString('base64');

      try {
        console.log(`Sending email to ${recipient}`);
        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: base64Email,
          },
        });
        console.log(`Email sent to ${recipient}`);
      } catch (error) {
        console.error(`Error sending email to ${recipient}:`, error);
        throw new Error(`Error sending email to ${recipient}`);
      }
    });

    // Wait for all email sending tasks to complete
    await Promise.all(emailSendingPromises);

    // After all emails are sent, respond
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





const decodeBase64 = (base64urlString: string): string => {
  let base64String = base64urlString
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const padding = base64String.length % 4;
  if (padding) {
    base64String += '='.repeat(4 - padding);
  }

  return Buffer.from(base64String, 'base64').toString('utf-8');
};

const cleanEmailContent = (rawContent: string): string => {
  let cleanedContent = decodeBase64(rawContent);

  // Clean unwanted characters
  cleanedContent = cleanedContent.replace(/â/g, "'");  // example of cleaning unwanted characters
  cleanedContent = cleanedContent.replace(/â/g, "“").replace(/â/g, "”");
  cleanedContent = cleanedContent.replace(/â/g, ""); // Remove other unwanted characters

  // Optionally, process the <a> tags if you want to modify them
  cleanedContent = cleanedContent.replace(/<a\s+(?![^>]*target=)/g, '<a target="_blank" ');

  return cleanedContent;
};


function extractEmailBody(parts: any[]): string {
  let emailBody = '';

  // Helper function to recursively traverse parts
  const traverseParts = (partsArray: any[]): string => {
    for (const part of partsArray) {
      if (part.mimeType === 'multipart/alternative' && part.parts) {
        // If we find a 'multipart/alternative', we recursively check its nested parts
        const nestedBody = traverseParts(part.parts);
        if (nestedBody) return nestedBody; // If a valid body is found, return it
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        // Prefer plain text if available
        return cleanEmailContent(part.body.data);
      } else if (part.mimeType === 'text/plain' && part.body?.data) {
        // Fallback to HTML content if plain text is not found
        emailBody = cleanEmailContent(part.body.data);
      }
    }
    return emailBody;
  };

  // Start traversing from the top-level parts array
  return traverseParts(parts);
}


export const getEmailByMessageId = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const messageId = req.params.messageId;

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
      userId: 'me',
      id: messageId,
    });

    const senderHeader = email.data.payload?.headers?.find((header) => header.name === 'From')?.value || '';
    const senderEmail = extractEmailFromHeader(senderHeader);
    const senderName = extractName(senderHeader);
    const senderProfileImage = senderEmail ? await getGravatarUrl(senderEmail) : null;
    const receivedDate = email.data.internalDate ? new Date(parseInt(email.data.internalDate)).toISOString() : null;

    // Mark the email as read by removing the "UNREAD" label
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });

    // Extract and decode the email body
    const parts = email.data.payload?.parts || [];
    const emailBody = extractEmailBody(parts);

    // Respond with the cleaned email content
    res.status(200).json({
      message: 'Email fetched and marked as read successfully',
      emailData: email,
      email: {
        id: email.data.id,
        threadId: email.data.threadId,
        subject: email.data.payload?.headers?.find((header) => header.name === 'Subject')?.value || '',
        from: senderEmail,
        senderName,
        to: email.data.payload?.headers?.find((header) => header.name === 'To')?.value || '',
        snippet: email.data.snippet,
        senderProfileImage,
        receivedDate,
        body: emailBody || 'No content available', // Ensure body is a string
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


export const deleteEmail = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Validate if 'id' parameter is provided
  if (!id) {
    res.status(400).json({ message: 'Email ID is required.' });
    return
  }

  try {
    const userId = req.userId; // Assuming the userId is set via a middleware (e.g., auth middleware)

    // Validate if userId exists
    if (!userId) {
      res.status(400).json({ message: 'User ID is missing or invalid.' });
      return
    }

    // Get and validate the access token
    const accessToken = await checkAndRefreshAccessToken(userId);
    if (!accessToken) {
      res.status(401).json({ message: 'Unauthorized, no access token provided.' });
      return
    }

    console.log('Access Token:', accessToken); // Log the token to ensure it's valid

    // Set up OAuth2 client with credentials
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Attempt to delete the email
    await gmail.users.threads.trash({ userId: 'me', id });
    res.status(200).json({
      message: 'Email deleted successfully',
    });
    return

  } catch (err: any) {
    // Log the full error for debugging
    console.error('Error deleting email:', err);

    // If error contains response data, handle Google API specific errors
    if (err.response) {
      console.error('Google API error:', err.response.data);
      res.status(500).json({
        message: 'Failed to delete email',
        error: err.response.data.error,
      });
      return
    }

    // General error handling
    res.status(500).json({
      message: 'Failed to delete email',
      error: err.message || err,
    });
    return
  }
};


const createReplyMessage = (
  to: string,
  fromName: string,
  replyText: string,
  subject: string,
  threadId: string
): string => {
  const message = [
    `From: "Me" <me@example.com>`, // Replace with your sender email
    `To: ${to}`,
    `Subject: Re: ${subject}`,
    `In-Reply-To: <${threadId}>`,
    `References: <${threadId}>`,
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
    '',
    replyText,
  ].join('\n');

  // Base64 encode the message
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};


export const replyToEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const messageId = req.params.messageId;
    const { replyText } = req.body; // The text of the reply

    if (!userId) {
      res.status(400).json({ message: 'User ID is missing or invalid.' });
      return;
    }

    if (!messageId) {
      res.status(400).json({ message: 'Message ID is required.' });
      return;
    }

    if (!replyText || replyText.trim() === '') {
      res.status(400).json({ message: 'Reply text is required.' });
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

    // Fetch the original email to get the thread ID and sender email
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
    });

    const senderHeader = email.data.payload?.headers?.find((header) => header.name === 'From')?.value || '';
    const senderEmail = extractEmailFromHeader(senderHeader);
    const senderName = extractName(senderHeader);

    if (!senderEmail) {
      res.status(400).json({ message: 'Sender email not found.' });
      return;
    }

    const threadId = email.data.threadId;

    if (!threadId) {
      res.status(400).json({ message: 'ThreadId not found.' });
      return;
    }
    const subject = email.data.payload?.headers?.find((header) => header.name === 'Subject')?.value || '';


    // Create the reply message
    const replyMessage = createReplyMessage(senderEmail, senderName, replyText, subject, threadId);

    // Send the reply
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: replyMessage,
      },
    });

    res.status(200).json({
      message: 'Reply sent successfully',
      response,
    });
  } catch (error: any) {
    console.error('Error replying to email:', error);
    res.status(500).json({
      message: 'Failed to send reply',
      error: error.message,
    });
  }
};