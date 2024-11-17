import { connection } from "mongoose";
import logger from "../config/logger"; 

// Custom function to check database connection
export const checkDatabaseConnection = async (): Promise<void> => {
  if (connection.readyState !== 1) {
    const errorMessage = "Database connection is not healthy!";
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
};
 