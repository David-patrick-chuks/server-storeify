
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User';
import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import mongoose from 'mongoose';
import logger from '../config/logger';

dotenv.config(); // Make sure to load environment variables


// Seed user function
const seedUser = async () => {
  const existingUser = await User.findOne({ email: 'pd3072894@gmail.com' });
  if (existingUser) {
    logger.error('User already exists');
    return;
  }

  
  const hashedPassword = bcrypt.hashSync('12345678', 10);
  
  const newUser = new User({
    // username: '',
    email: 'pd3072894@gmail.com',
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
 
function getGravatarUrl(email : string, size : number = 80) {
    const trimmedEmail = email.trim().toLowerCase();
    const hash = crypto.createHash('sha256').update(trimmedEmail).digest('hex');
    console.log(hash);
    
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}
 
// Example usage
const email = 'pd3072894@gmail.com';
const size = 200; // Optional size parameter
const gravatarUrl = getGravatarUrl(email, size);
 
// console.log('Gravatar URL:', gravatarUrl);