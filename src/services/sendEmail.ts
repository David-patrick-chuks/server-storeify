import { google } from 'googleapis';

// Gmail service to send email
export const sendEmail = async (
  gmail: any,
  userId: string,
  subject: string,
  body: string,
  recipient: string
): Promise<boolean> => {
  try {
    const rawMessage = createRawMessage(userId, recipient, subject, body);
    const message = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log('Email sent to', recipient);
    return true;
  } catch (error) {
    console.error('Error sending email to', recipient, error);
    return false;
  }
};

// Helper function to encode message in base64
const createRawMessage = (from: string, to: string, subject: string, messageBody: string): string => {
  const str = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    messageBody,
  ].join('\n');
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};


