// CORS configuration
export const corsOptions = {
    origin: process.env.CORS_ORIGIN || "https://storeify-management.vercel.app", 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204, 
  };