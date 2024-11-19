import bcrypt from "bcryptjs";
import crypto from "crypto";
import Joi from "joi";
import logger from "../config/logger.js";
import User from "../models/User.js";
import {
  createJWT,
  getAuthUrl,
  getTokens,
  refreshAccessToken,
  storeTokens,
} from "../services/googleOAuth.js";
import { sendPasswordResetEmail } from "../services/resetMailSenderByGmail.js";
import { hashPassword } from "../utils/hashing.js";

// Login Route (use your static login credentials)

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const login = async (req, res) => {
  const { error } = loginSchema.validate(req.body);

  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  const { email, password } = req.body;

  try {
    const userEmail = email.toLowerCase();
    // Find the user by email in the MongoDB database
    const user = await User.findOne({ userEmail });

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Check if the password matches
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const jwtToken = createJWT(user.email);
    // Check if user has a Google ID
    if (!user.googleId && !user.googleTokens) {
      // Send the token directly to the client as a JSON response
      logger.info("No Google ID found, using static login credentials");
      res.status(200).json({
        message: "No Google ID found, using static login credentials",
        success: true,
        jwtToken: jwtToken,
      });
      return;
    }

    logger.info("User logged in successfully because they have the Google ID");
    res.status(200).json({
      message: "Logged in successfully, Google Id exist",
      success: true,
      jwtToken: jwtToken,
    });

    return;
  } catch (error) {
    logger.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

// Google OAuth2 Callback

// Google OAuth2 Callback

export const oauth2Callback = async (req, res) => {
  const { code, error, error_description } = req.query;

  // Handle OAuth2 error
  if (error) {
    logger.error(`OAuth2 error: ${error} - ${error_description}`);
    res.redirect(
      `${process.env.CLIENT_BASE_URL}/access-denied?error=${error}&description=${error_description}`
    );
    return;
  }

  // Ensure the authorization code is provided
  if (!code) {
    res.status(400).send("No authorization code provided");
    return;
  }

  try {
    const { tokens, profile } = await getTokens(code);

    logger.info(tokens);
    logger.debug(tokens);
    logger.info(tokens.access_token);
    logger.debug(tokens.access_token);

    // Check if access token is available
    if (!tokens || !tokens.access_token) {
      logger.error("Access token not found");
      res.status(400).send("Failed to retrieve access token");
      return;
    }

    // If the token has expired, refresh it
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
      if (tokens.refresh_token) {
        const newAccessToken = await refreshAccessToken(tokens.refresh_token);
        tokens.access_token = newAccessToken;
      } else {
        logger.error("Refresh token is missing or invalid");
        res.status(400).send("Failed to refresh access token");
        return;
      }
    }

    // Ensure the profile email is available
    if (!profile || !profile.email) {
      logger.error("Email not found in Google profile");
      res.status(400).send("Failed to retrieve email from Google profile");
      return;
    }

    // Store tokens for future use
    await storeTokens(profile, tokens);
    logger.info("Authentication successful, redirecting to profile");
    res.redirect(`${process.env.CLIENT_BASE_URL}/dashboard`);
  } catch (err) {
    // Log and handle errors
    if (err instanceof Error) {
      logger.error(
        `Error during Google OAuth2 callback: ${err.message}`,
        err.stack
      );
    } else {
      logger.error("Unknown error during Google OAuth2 callback");
    }
    res.status(500).send("Failed to authenticate");
  }
};

// Redirect to Google OAuth2 for login
export const redirectToGoogleLogin = async (req, res) => {
  const authUrl = await getAuthUrl();
  if (authUrl) {
    res.redirect(authUrl);
  } else {
    res.status(500).json({ message: "Failed to generate Google OAuth2 URL" });
  }
};

// Logout function
// Logout function
export const logout = (req, res) => {
  // If you're storing the JWT in localStorage or sessionStorage, just send a message to clear it
  res.status(200).json({
    message: "Logged out successfully",
  });

  // Optionally, you can log out on the server side, but since we're not using cookies,
  // there's no session or cookie to clear server-side.
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Generate a password reset token and expiry time
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = new Date(Date.now() + 30 * 60 * 1000); // Token valid for 30 minutes
    await user.save();

    // Create the reset link
    const resetLink = `${
      process.env.CLIENT_BASE_URL
    }/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send password reset email
    await sendPasswordResetEmail(email, resetLink); // Use the email service function

    res.status(200).json({ message: "Password reset link sent successfully" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(400).json({ message: "Error sending password reset email" });
  }
};

export const resetPassword = async (req, res) => {
  const { token, email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email, resetPasswordToken: token });

    // Check if the user exists and if resetPasswordExpiry is valid
    if (
      !user ||
      (user.resetPasswordExpiry && user.resetPasswordExpiry < new Date())
    ) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    // Hash new password (make sure to use your hashing function)
    user.password = await hashPassword(newPassword); // Ensure this function is implemented
    user.resetPasswordToken = undefined; // Clear token
    user.resetPasswordExpiry = undefined; // Clear expiry
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(400).json({ message: "Error resetting password" });
  }
};
