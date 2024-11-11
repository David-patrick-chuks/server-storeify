import { Request, Response } from 'express';
import { sendEmail } from '../services/googleOAuth';
import { google } from 'googleapis';

// Fetch emails (Read)
export const getEmails = async (req: Request, res: Response) => {
  const oauth2Client = new google.auth.OAuth2();
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    const response = await gmail.users.messages.list({ userId: 'me' });
    res.json(response.data);
  } catch (err) {
    res.status(500).send('Failed to fetch emails');
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
