import mongoose from 'mongoose';
const { connection } = mongoose;
import logger from '../config/logger.js';

// Custom function to check database connection
export const checkDatabaseConnection = async () => {
  if (connection.readyState !== 1) {
    const errorMessage = 'Database connection is not healthy!';
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
};
