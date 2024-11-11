import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan"; // For logging requests
import helmet from "helmet"; // For securing HTTP headers
import rateLimit from "express-rate-limit"; // For limiting requests
import logger from "./config/logger";
import errorMiddleware from "./middleware/errorMiddleware";
import timeout from "connect-timeout"; // For request timeouts
import csrf from "csurf";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db";
dotenv.config();

import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import { checkDatabaseConnection } from "./utils/checkDatabaseConnection";
const app: Application = express();

// Example of session with expiration

// Connect to the database
connectDB();

app.use(cookieParser());
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);
// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false,
};

// Middleware setup
app.use(helmet()); // Security headers
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request timeout middleware (2-minute timeout)
app.use(timeout("2m"));

// Setup Morgan to log requests
app.use(
  morgan("combined", {
    stream: {
      write: (message: string) => logger.info(message.trim()), // Stream Morgan logs to Winston
    },
  }),
);

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/v1/", limiter);

// Route definitions
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/email', emailRoutes);

// Health check route
app.get("/health", async (req: Request, res: Response) => {
  try {
    // Check the database connection status
    await checkDatabaseConnection();
    res.status(200).json({ status: "UP!!, DB connection OK" });
  } catch (error: unknown) {
    // Type assertion: assume error is an instance of Error
    if (error instanceof Error) {
      res.status(500).json({ status: "DOWN", error: error.message });
    } else {
      res.status(500).json({ status: "DOWN", error: "Unknown error occurred" });
    }
  }
});


// Error handling middleware
app.use(errorMiddleware);

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
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
});



export default app;
