import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import cookieParser from 'cookie-parser';

import { corsOptions } from "./config/cors.js";
import { connectDB } from "./config/db.js";
import { MorganSetup } from "./config/morganSetup.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import { limiter } from "./middleware/limiter.js";
import authRoutes from "./routes/auth.js";
import emailRoutes from "./routes/emails.js";
import userRoutes from "./routes/userRoutes.js";
import notifyRoute from "./routes/notifyRoute.js";
import AiAgent from "./routes/AiAgent.js";
import projectRoutes from "./routes/projectRoutes.js";
import { healthcareService } from "./services/HealthCheckController.js";
import { catchAll404Request } from "./utils/catchAll404Request.js";
import { globalError } from "./utils/globalErrorHandler.js";
// import "./cron/cronJobs.js";

dotenv.config();

const app = express();

// Security-related headers
app.use(helmet());

// Middleware for parsing cookies and body
app.use(cookieParser());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "1kb" })); // Parse URL-encoded data

// Set trust proxy for secure cookies in production
app.set("trust proxy", true);

// Enable CORS with custom options
app.use(cors(corsOptions));

// Connect to the database
connectDB();

// Logging setup using Morgan
app.use(MorganSetup);

// Rate limiting middleware applied to all routes under "/api/v1/"
app.use("/api/v1/", limiter);

// Main API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/email", emailRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/ai", AiAgent);
app.use("/api/v1/bell", notifyRoute);

// Health check route for monitoring the status of the API
app.get("/health", healthcareService);

// Catch-all handler for undefined routes (404)
app.use(catchAll404Request);

// Error handling middleware (to handle uncaught errors)
app.use(errorMiddleware);

// Global error handler for centralized error logging and response
app.use(globalError);

export default app;




// import { csrfTokenGen } from "./services/csrfTokenGen.js";
// import { csrfProtection } from "./config/csrf.js";

// csrf protection for any req expect GET
// app.use(csrfProtection);

// generate csrf token for any req expect GET
// app.get('/api/v1/csrf-token',csrfTokenGen);

// // Route definitions
// app.use('/api/v1/auth', csrfProtection, authRoutes);
// app.use('/api/v1/email',csrfProtection,  emailRoutes);
// app.use('/api/v1/user',csrfProtection,  userRoutes);
// app.use('/api/v1/projects',csrfProtection,  projectRoutes);
// app.use('/api/v1/ai',csrfProtection, AiAgent);
// app.use('/api/v1/bell',csrfProtection, notifyRoute);

// // generate csrf token for any req expect GET
// app.get('/api/v1/csrf-token',csrfProtection,csrfTokenGen);

