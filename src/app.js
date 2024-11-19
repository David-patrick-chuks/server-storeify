import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
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
import { csrfTokenGen } from "./services/csrfTokenGen.js";
import { catchAll404Request } from "./utils/catchAll404Request.js";
import { globalError } from "./utils/globalErrorHandler.js";
import { csrfProtection } from "./config/csrf.js";
import "./cron/cronJobs.js";
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();

app.set("trust proxy", true);

// Connect to the database
connectDB();
app.use(cookieParser());
// csrf protection for any req expect GET
// app.use(csrfProtection);

// Middleware setup
app.use(helmet()); // Security headers
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "1kb" }));
app.use(cookieParser());

// Stream Morgan logs to Winston
app.use(MorganSetup);

//Main Route path with limiting middleware =====//
app.use("/api/v1/", limiter);

// Route definitions
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/email", emailRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/ai", AiAgent);
app.use("/api/v1/bell", notifyRoute);

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

// Health check route
app.get("/health", healthcareService);

// Catch-all 404 handler for undefined routes
app.use(catchAll404Request);

// Error handling middleware
app.use(errorMiddleware);

// Global error handler
app.use(globalError);

export default app;