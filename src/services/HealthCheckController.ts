import { Response, Request } from "express";
import { checkDatabaseConnection } from "../utils/checkDatabaseConnection";

export const healthcareService = async (req: Request, res: Response) => {
    try {
        // Check the database connection status
        await checkDatabaseConnection();
        res.status(200).json({ status: "UP!!, DB connection OK" });
    } catch (error: unknown) {
        // Type assertion: assume error is an instance of Error
        if (error instanceof Error) {
            res.status(500).json({ status: "DOWN", error: error.message });
        } else {
            res.status(500).json({ status: "DOWN", error: "Unknown error occurred" });
        }
    }
}