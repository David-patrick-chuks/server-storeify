
import bcrypt from 'bcryptjs';
import User from '../models/User';
import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import mongoose from 'mongoose';
import logger from '../config/logger';

dotenv.config(); // Make sure to load environment variables


// Seed user function
const seedUser = async () => {
  const existingUser = await User.findOne({ email: 'Chutek@gmail.com' });
  if (existingUser) {
    logger.error('User already exists');
    return;
  }

  
  const hashedPassword = bcrypt.hashSync('5686qwerty', 10);
  
  const newUser = new User({
    username: 'Chutek Telogines',
    email: 'Chutek@gmail.com',
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

// runSeeder();


