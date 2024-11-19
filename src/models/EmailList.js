import { Schema, model } from 'mongoose';

// Define the email list schema
const emailListSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Ensures that duplicate emails are not stored
  },
  projectId: {
    type: String, // Reference to the Project ID
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the EmailList model
const EmailList = model('EmailList', emailListSchema);

export default EmailList;
