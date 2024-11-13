import rateLimit from "express-rate-limit";

export const limiter =rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Rate limit exceeded. Please retry after 1669048687",
  });
  