import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../config/logger.js";

// Middleware to check if the user is authorized based on JWT
export const authenticateJWT = (req, res, next) => {
  // Extract the JWT token from the Authorization header (Bearer token)
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "No token provided. Unauthorized access." });
  }

  // Verify the JWT token
  jwt.verify(token, process.env.JWT_SECRET || "", async (err, decoded) => {
    if (err) {
      logger.error("Error verifying JWT:", err);
      return res.status(401).json({ message: "Unauthorized access" , err});
    }

    // Attach the decoded user data to the request object
    if (decoded && decoded.email) {
      req.userEmail = decoded.email;
      req.userId = decoded.email; // Attach email to the request (matching JWT payload key)
      req.user = decoded; // Attach the full decoded user payload for further use

      // Check if the user exists in the MongoDB database based on the email
      const foundUser = await User.findOne({ email: decoded.email });

      if (!foundUser) {
        return res
          .status(403)
          .json({ message: "Access denied. Unauthorized user." });
      }
    } else {
      return res.status(401).json({ message: "Invalid token structure" });
    }

    // Continue to the next middleware
    next();
  });
};

export const isAuthorized = async (req, res, next) => {
  try {
    const user = req.user; // `user` is now attached to the request object

    // Ensure that the user object and email are present
    if (!user?.email) {
      return res
        .status(400)
        .json({ message: "User email missing in the request." });
    }

    // Check if the user email matches the allowed email (e.g., Chutek@gmail.com)
    if (user.email !== "pd3072894@gmail.com") {
      return res
        .status(403)
        .json({ message: "Access denied. Unauthorized email." });
    }

    // If user is authorized, continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error in isAuthorized middleware:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
