// CORS configuration
export const corsOptions = {
  origin: [process.env.CORS_ORIGIN, "https://storeify-management.vercel.app"], // Allow multiple origins if needed
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "CSRF-Token",
    "Access-Control-Allow-Credentials",
  ],
  exposedHeaders: ["Authorization", "Set-Cookie"],
  credentials: true, // Allow cookies to be sent
  preflightContinue: false,
  optionsSuccessStatus: 204, // For legacy browsers (IE11, etc.)
};
