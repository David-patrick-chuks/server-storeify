import logger from "../config/logger.js";

// Error handling middleware
const errorMiddleware = (err, req, res, _next) => {
  if (err instanceof Error) {
    // Log the error using Winston
    logger.error(err.message);
    logger.error(err.name);

    // Check if the error is related to CSRF token validation
    if (err.message && err.message.includes("invalid csrf token")) {
      // Handle CSRF token specific error
      res.status(403).json({ message: "Invalid CSRF token. Please try again." });
      return;
    }

    // Handle other known errors here
    if (err.message && err.message.includes("Unauthorized")) {
      res.status(401).json({ message: "Unauthorized access." });
      return;
    }

    // If it's a generic error, return a server error with a specific message
    res.status(500).json({ message: "Something went wrong! Please try again later." });
    return;
  } else {
    // Fallback if the error is not an instance of Error
    logger.error("Unknown error occurred");
    res.status(500).json({ message: "Something went wrong! Please try again later." });
    return;
  }
};

// Export the middleware
export default errorMiddleware;
