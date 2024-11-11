import { connection } from "mongoose"; // Mongoose connection object
import logger from "../config/logger"; // Assuming you have a logger configured

// Custom function to check database connection
export const checkDatabaseConnection = async (): Promise<void> => {
  if (connection.readyState !== 1) {
    const errorMessage = "Database connection is not healthy!";
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
};
