import { Schema, model, Document } from 'mongoose';

export interface INotification extends Document {
  projectId: string;  // Project ID
  clientEmail: string; // Client's email
  message: string;     // Notification message
  snippet: string;     // Notification message
  isRead: boolean;     // Track if the client has read the notification
  createdAt: Date;     // Date the notification was created
}

// Define the Notification schema
const notificationSchema = new Schema<INotification>({
  projectId: {
    type: String,
    ref: 'Project',  // Reference to the Project model
    required: true,
  },
  clientEmail: {
    type: String,
    required: true,
  },
  snippet: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the Notification model
const Notification = model<INotification>('Notification', notificationSchema);

export default Notification;
