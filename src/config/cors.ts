// CORS configuration
export const corsOptions = {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173", 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "CSRF-Token", "Authorization"],
    // exposedHeaders: ["CSRF-Token"], // Expose CSRF-Token header to the client
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204, // For legacy browser support
  };