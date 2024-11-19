import { Schema, model } from 'mongoose';

// Define the Notification schema
const notificationSchema = new Schema({
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
const Notification = model('Notification', notificationSchema);

export default Notification;
