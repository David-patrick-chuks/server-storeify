import { NextFunction, Request, Response } from "express";
import logger from "../config/logger";


export const globalError = (err: Error, req: Request, res: Response, _next: NextFunction) => {
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
}