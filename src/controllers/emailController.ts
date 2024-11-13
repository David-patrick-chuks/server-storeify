import { Request, Response } from 'express';
import { sendEmail } from '../services/googleOAuth';
import { google } from 'googleapis';

// Fetch emails (Read)
// Setup Gmail API
const gmail = google.gmail('v1');

// Function to get authenticated Gmail API client
const getGmailClient = (accessToken: string) => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
};

// Controller to fetch all emails from the authenticated Gmail account
export const getAllEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure that the user has been authenticated and has a valid access token
    const { accessToken } = req.user || {} // Access token now exists on req.user after authentication

    if (!accessToken) {
      res.status(401).json({ message: 'Unauthorized, no access token provided.' })
      return
    }

    // Create the authenticated Gmail API client
    const oauth2Client = getGmailClient(accessToken);

    // Fetch the email messages from Gmail using the `list` method
    const response = await gmail.users.messages.list({
      userId: 'me', // 'me' refers to the authenticated user
      auth: oauth2Client,
      q: 'is:unread', // You can modify this query to fetch different emails (e.g., unread messages)
    });

    const messages = response.data.messages || [];

    // Fetch full message details for each email ID returned
    const emailPromises = messages.map(async (message) => {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        auth: oauth2Client,
      });

      return email.data;
    });

    // Resolve all email details
    const emailDetails = await Promise.all(emailPromises);

    // Respond with the list of email details
    res.status(200).json({
      message: 'Emails fetched successfully',
      emails: emailDetails,
    })
    return
  } catch (error: Error | any) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      message: 'Failed to fetch emails',
      error: error.message,
    })
    return
  }
};



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
