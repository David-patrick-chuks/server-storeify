import app from "./app";
import dotenv from "dotenv";
import logger from "./config/logger";

dotenv.config();

// Graceful shutdown function
const shutdown = (server: any) => {
  try {
    logger.info("Shutting down gracefully...");

    // Attempt to close the server
    server.close(() => {
      logger.info("Closed all connections gracefully.");
      // Optional: clean up other resources (like DB connections)
      process.exit(0); // Exit the process after everything is closed
    });

    // If server hasn't closed after 10 seconds, force shutdown
    setTimeout(() => {
      logger.error("Forcing shutdown after timeout.");
      process.exit(1); // Force exit with an error code if shutdown times out
    }, 10000);

  } catch (error: any) {
    // Handle any error that occurs during the shutdown process
    logger.error(`Error during shutdown: ${error.message}`);
    process.exit(1); // Exit with error code if shutdown fails
  }
};

// Start the HTTP server
const server = app.listen(process.env.PORT || 3000, () => {
  logger.info(`Server is running on port ${process.env.PORT || 3000}`);
});


process.on("SIGTERM", () => {
  logger.info("Received SIGTERM signal.");
  shutdown(server);
});

process.on("SIGINT", () => {
  logger.info("Received SIGINT signal.");
  shutdown(server);
});