
import logger from "../config/logger.js";

export const catchAll404Request =(req, res) => {
    logger.warn(`404 error: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      message: "Not Found",
      error: `Cannot ${req.method} ${req.originalUrl}`,
    });
  }