import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
  username?: string | null;
  email: string;
  password: string;
  googleId?: string;
  googleTokens: string | null;
  refreshToken: string | null;
  googlePicture?: string | null;
  tokenExpiryDate?: number | null;
  emailCountToday: number; // Track the number of emails sent today
  lastEmailSentDate: Date; // Track the timestamp of the last email sent
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    googleId: { type: String },
    googlePicture: { type: String, default: null },
    googleTokens: { type: String, default: null },
    refreshToken: { type: String, default: null },
    tokenExpiryDate: { type: Number, default: null },
    emailCountToday: { type: Number, default: 0 }, // New field
    lastEmailSentDate: { type: Date, default: new Date() }, // New field
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>('User', userSchema);

export default User;
