import morgan from "morgan";
import logger from "./logger.js";

export const MorganSetup= morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()), // Stream Morgan logs to Winston
    },
  })