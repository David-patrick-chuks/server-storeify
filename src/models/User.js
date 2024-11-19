import mongoose, { Schema } from 'mongoose';

// Define the user schema
const userSchema = new Schema({
  resetPasswordToken: { type: String },
  resetPasswordExpiry: { type: Date },
  notify: { type: Boolean, default: true },
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
  timestamps: true, // Adds createdAt and updatedAt fields automatically
});

// Create the User model
const User = mongoose.model('User', userSchema);

export default User;
