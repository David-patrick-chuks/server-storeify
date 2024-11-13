import timeout from "connect-timeout"; 
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { Application } from "express";
import helmet from "helmet"; 
import { corsOptions } from "./config/cors";
// import { csrfProtection } from "./config/csrf";
import { connectDB } from "./config/db";
import { MorganSetup } from "./config/morganSetup";
import errorMiddleware from "./middleware/errorMiddleware";
import { limiter } from "./middleware/limiter";
import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import userRoutes from './routes/userRoutes';
import { healthcareService } from "./services/HealthCheckController";
import { csrfTokenGen } from "./services/csrfTokenGen";
import { catchAll404Request } from "./utils/catchAll404Request";
import { globalError } from "./utils/globalErrorHandler";
// import xss from 'express-xss-sanitizer'

dotenv.config();

const app: Application = express();

// Connect to the database
connectDB();

// csrf protection for any req expect GET
// app.use(csrfProtection);

// Middleware setup
app.use(helmet()); // Security headers
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit:'1kb' }));
app.use(cookieParser());
/// req sanitizer
// app.use(xss());
// Request timeout middleware (2-minute timeout)
app.use(timeout("2m"));

// Setup Morgan to log requests and
// Stream Morgan logs to Winston
app.use(MorganSetup);



//Main Route path with limiting middleware =====//
app.use("/api/v1/", limiter);

// Route definitions
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/email', emailRoutes);
app.use('/api/v1/user', userRoutes);


// generate csrf token for any req expect GET
app.get('/api/v1/csrf-token',csrfTokenGen );

// Health check route
app.get("/health", healthcareService);

// Catch-all 404 handler for undefined routes
app.use(catchAll404Request);

// Error handling middleware
app.use(errorMiddleware);

// Global error handler
app.use(globalError);


export default app;
