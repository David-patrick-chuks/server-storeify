import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
  username: string;
  email: string;
  googleId?: string;
  googleTokens: string | null;
  refreshToken: string | null;
  googlePicture?: string | null;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  googleId: { type: String }, // Google ID for OAuth
  googlePicture: { type: String, default: null }, // Google profile picture URL
  googleTokens: { type: String, default: null }, // Google access token
  refreshToken: { type: String, default: null }, // Google refresh token
}, {
  timestamps: true // Automatically adds `createdAt` and `updatedAt` fields
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;
