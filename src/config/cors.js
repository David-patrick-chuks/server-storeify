// CORS configuration
export const corsOptions = {
    origin: [process.env.CORS_ORIGIN || "https://storeify-management.vercel.app", "https://admin.storeify.co"], 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "CSRF-Token", "Authorization"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204, 
  };