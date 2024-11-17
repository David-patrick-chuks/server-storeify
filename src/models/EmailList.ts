import { Schema, model, Document } from 'mongoose';

export interface IEmailList extends Document {
  email: string;
  projectId: string;  // Reference to the project that captured this email
  createdAt: Date;
}

// Define your email list schema and model
const emailListSchema = new Schema<IEmailList>({
  email: {
    type: String,
    required: true,
    unique: true, // Ensures that duplicate emails are not stored
  },
  projectId: {
    type: String, // Reference the Project ID
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const EmailList = model<IEmailList>('EmailList', emailListSchema);

export default EmailList;
