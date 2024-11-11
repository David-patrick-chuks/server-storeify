import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof Error) {
    // Log the error using Winston
    logger.error(err.stack);
  } else {
    // Fallback if the error is not an instance of Error
    logger.error("Unknown error occurred");
  }

  res.status(500).json({ message: "Something went wrong!" });
};
export default errorMiddleware;
