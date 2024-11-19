
import logger from "../config/logger.js";


export const globalError  = (err, req, res, _next) => {
    if (process.env.NODE_ENV === "development") {
        // In development, show full error details
        logger.error(err.stack);
        res.status(500).json({
            message: err.message || "Internal Server Error",
            stack: err.stack,
        });
    } else {
        // In production, don't show detailed error stack
        logger.error(err.stack);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}