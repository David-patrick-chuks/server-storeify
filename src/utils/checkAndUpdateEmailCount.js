import User from "../models/User.js";

export const checkAndUpdateEmailCount = async (email) => {
    const user = await User.findOne({ email: email })
  if (!user) {
    throw new Error('User not found');
  }

  const currentDate = new Date();
  const lastEmailSentDate = user.lastEmailSentDate || new Date();

  // Check if 24 hours have passed since the last email was sent
  const timeDiff = currentDate.getTime() - lastEmailSentDate.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60); // Convert milliseconds to hours

  // Reset email count if 24 hours have passed
  if (hoursDiff >= 24) {
    user.emailCountToday = 0;
    user.lastEmailSentDate = currentDate;
  }

  // Check if the user has exceeded the daily limit (e.g., 500 emails)
  if (user.emailCountToday >= 500) {
    return false; // Prevent sending email
  }

  // Increment email count and update the last sent date
  user.emailCountToday += 1;
  user.lastEmailSentDate = currentDate;

  // Save the updated user record
  await user.save();
  return true;
};
