import { createLogger, format, transports } from "winston";
// Optional: for log rotation
import 'winston-daily-rotate-file'; 

// Define log levels and their corresponding colors
const logLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        debug: 'blue',
    },
};

const logger = createLogger({
    levels: logLevels.levels,
    format: format.combine(
        format.timestamp(),
        format.colorize(), // Adds color based on log level
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`; // Custom log message format
        })
    ),
    transports: [
        new transports.Console({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', // Set logging level dynamically
            format: format.combine(
                format.colorize(),
                format.simple()
            ),
        }), // Log to console
        new transports.DailyRotateFile({
            filename: "logs/%DATE%-combined.log",
            datePattern: "YYYY-MM-DD",
            level: "info",
            maxFiles: "14d", // Keep logs for the last 14 days
            maxSize: "20m", // Maximum log file size before rotation (20MB)
            zippedArchive: true, // Compress old log files
            format: format.combine(format.timestamp(), format.json()),
        }), // Daily rotating log file for general info
        new transports.DailyRotateFile({
            filename: "logs/%DATE%-error.log",
            datePattern: "YYYY-MM-DD",
            level: "error",
            maxFiles: "14d", // Keep logs for the last 14 days
            maxSize: "20m", // Maximum log file size before rotation (20MB)
            zippedArchive: true, // Compress old log files
            format: format.combine(format.timestamp(), format.json()),
        }), // Daily rotating error log
        new transports.DailyRotateFile({
            filename: "logs/%DATE%-debug.log",
            datePattern: "YYYY-MM-DD",
            level: "debug",
            maxFiles: "14d", // Keep logs for the last 14 days
            maxSize: "20m", // Maximum log file size before rotation (20MB)
            zippedArchive: true, // Compress old log files
            format: format.combine(format.timestamp(), format.json()),
        }), // Daily rotating debug log
    ],
});

// Catch unhandled promise rejections
process.on("unhandledRejection", (error: Error) => {
    logger.error(`Unhandled Rejection: ${error.message || error}`);
    // Exit process (optional)
    process.exit(1);
});

// Catch uncaught exceptions
process.on("uncaughtException", (error: Error) => {
    logger.error(`Uncaught Exception: ${error.message || error}`);
    // Exit process (optional)
    process.exit(1);
});

// Catch warnings (optional)
process.on("warning", (warning: Error) => {
    logger.warn(`Warning: ${warning.message || warning}`);
});

export default logger;
