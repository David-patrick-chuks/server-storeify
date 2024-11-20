
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import logger from '../config/logger.js';
import User from '../models/User.js';

dotenv.config(); // Make sure to load environment variables


// Seed user function
const seedUser = async () => {
  const existingUser = await User.findOne({ email: 'marouanalkaisy@gmail.com' });
  if (existingUser) {
    logger.error('User already exists');
    return;
  }

  
  const hashedPassword = bcrypt.hashSync('12345678', 10);
  
  const newUser = new User({
    // username: '',
    email: 'marouanalkaisy@gmail.com',
    password: hashedPassword,
  });
  
  await newUser.save();
  logger.info('User seeded successfully');
};

// Run the seed function
const runSeeder = async () => {
  await connectDB();
  await seedUser();
  mongoose.connection.close(); // Close the connection after seeding
};

runSeeder();


// 1557:gk-EWp2gtvvD-m-F3YehQ-P5ctOKlwVDyPq-Jn_5JDvG3g-RzwQasviXYagaJp7X
 
function getGravatarUrl(email , size = 80) {
    const trimmedEmail = email.trim().toLowerCase();
    const hash = crypto.createHash('sha256').update(trimmedEmail).digest('hex');
    console.log(hash);
    
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}
 
// Example usage
const email = 'marouanalkaisy@gmail.com';
const size = 200; // Optional size parameter
const gravatarUrl = getGravatarUrl(email, size);
 
// console.log('Gravatar URL:', gravatarUrl);