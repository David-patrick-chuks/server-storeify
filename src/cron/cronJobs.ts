// services/cronJobs.ts
import cron from 'node-cron';  // Adjust the import path as needed
import nodemailer from 'nodemailer';
import Project from '../models/Projects';
import Notification from '../models/Notification';
import logger from "../config/logger";
import User from '../models/User';

// Set up the cron job to run every hour
cron.schedule('0 * * * *', async () => {
    try {

        logger.info('Cron job started');  // Log to confirm the cron job has started
        const now = new Date();
        const twoDaysBefore = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours ahead

        // Find projects with a due date less than 48 hours away
        const projects = await Project.find({
            due: { $lte: twoDaysBefore },
            action: 'pending', // Add any other conditions if necessary
        });

        if (projects.length > 0) {
            // Fetch admin email from environment variable
            const email = process.env.ADMIN_EMAIL;

            if (email) {
                const admin = await User.findOne({ email });
                if (!admin) {
                    logger.error('Admin email not found.');
                    return
                }
                // Iterate through each project
                for (const project of projects) {
                    // Check if a notification for this project already exists
                    const existingNotification = await Notification.findOne({
                        projectId: project._id,
                        isRead: false,  // Optional: You can add additional filters here, if necessary
                    });

                    if (!existingNotification) {
                        // If no notification exists, send email to admin and save notification

                        // Send reminder email to admin
                        if (admin.notify === true) {
                            await sendReminderEmail(email, project);
                        }

                        // Save a notification to the database
                        await saveNotification(project.clientEmail, project);  // Save notification for the client
                    }
                }
            } else {
                logger.error('Admin email not found.');
            }
        }
    } catch (error) {
        logger.error('Error checking projects:', error);
    }
});


// Email function to notify yourself (monitoring) and the client
async function sendReminderEmail(clientEmail: string, project: any) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',  // Gmail service
        auth: {
            user: process.env.EMAIL_USER, // Email from .env
            pass: process.env.EMAIL_PASS, // Email password or app-specific password
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,  // Your email address
        to: 'your-email@gmail.com',    // Send to yourself for monitoring (or to the client)
        subject: `Project Reminder: "${project.niche}" due soon`,
        html: `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                color: #333;
                background-color: #f4f4f4;
                padding: 20px;
              }
              .email-container {
                background-color: #ffffff;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                background-color: #481570;
                padding: 15px;
                border-radius: 8px;
                color: white;
                font-size: 18px;
              }
              .content {
                margin-top: 20px;
              }
              .content h2 {
                color: #333;
              }
              .content p {
                font-size: 16px;
                line-height: 1.6;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 14px;
                color: #888;
              }
              .button {
                background-color: #481570;
                color: white;
                text-decoration: none;
                padding: 10px 20px;
                border-radius: 5px;
                display: inline-block;
                font-weight: bold;
              }
              .button:hover {
                background-color: #481990;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>Project Reminder</h1>
              </div>
              <div class="content">
                <h2>Hello,</h2>
                <p>This is a reminder that the project <strong>"${project.niche}"</strong> is due soon, in less than 48 hours!</p>
                <p><strong>Client:</strong> ${clientEmail}</p>
                <p><strong>Description:</strong> ${project.description}</p>
                <p><strong>Due Date:</strong> ${project.due}</p>
                <p>Kindly review the project details and ensure everything is on track.</p>
                <a href="#" class="button">Review Project</a>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Storeify. All Rights Reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Reminder email sent to ${clientEmail}.`);
    } catch (error) {
        logger.error('Error sending email:', error);
    }
}



// Function to save notification to the database
async function saveNotification(clientEmail: string, project: any) {
    try {
        const notification = new Notification({
            projectId: project._id,  // Project reference
            clientEmail: clientEmail,
            snippet: ` Hello!, Your client ${clientEmail} project will be due in the next 48 Hours`,
            message: `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .modal-container {
                background-color: #fff;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 500px;
                margin: auto;
              }
              .header {
                text-align: center;
                background-color: #481570;  /* Brand color */
                padding: 15px;
                border-radius: 8px;
                color: white;
                font-size: 18px;
              }
              .content {
                margin-top: 20px;
              }
              .content p {
                font-size: 16px;
                line-height: 1.6;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 14px;
                color: #888;
              }
              .button {
                background-color: #481570;  /* Brand color */
                color: white;
                text-decoration: none;
                padding: 10px 20px;
                border-radius: 5px;
                display: inline-block;
                font-weight: bold;
                margin-top: 15px;
              }
              .button:hover {
                background-color: #7c1f8b;  /* Slightly darker shade for hover */
              }
            </style>
          </head>
          <body>
            <div class="modal-container">
              <div class="header">
                <h1>Project Due Reminder</h1>
              </div>
              <div class="content">
                <p><strong>Reminder:</strong></p>
                <p>Dear Admin,</p>
                <p>This is a reminder that the project <strong>"${project.niche}"</strong> for client <strong>${clientEmail}</strong> is due in less than 48 hours. Please review the project details and ensure everything is progressing as planned.</p>
                <p><strong>Project Description:</strong> ${project.description}</p>
                <p><strong>Due Date:</strong> ${project.due}</p>
                <p>Kindly ensure any pending actions are addressed promptly to ensure timely delivery.</p>
              </div>
              <div class="footer">
                <p>Best regards,</p>
                <p>Your Company Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
            isRead: false,
            createdAt: new Date(),
        });

        await notification.save();
        logger.info('Notification saved to the database.');
    } catch (error) {
        logger.error('Error saving notification:', error);
    }
}



