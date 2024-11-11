import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
  email: string;
  googleTokens: string;
  refreshToken: string;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  googleTokens: { type: String },
  refreshToken: { type: String },
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;
