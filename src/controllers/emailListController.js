
import EmailList from "../models/EmailList.js";

export const getEmailList = async (req, res)  => {
  try {
    // Get the page and limit from query parameters, default to 1 for page and 50 for limit
    const page = parseInt(req.query.page ) || 1;
    const limit = parseInt(req.query.limit ) || 50;

    // Calculate the skip value (number of records to skip)
    const skip = (page - 1) * limit;

    // Retrieve the email list with pagination
    const emailList = await EmailList.find()
      .skip(skip) // Skip the first (page - 1) * limit emails
      .limit(limit) // Limit to the specified number of emails per page
      .select('email'); // Only select the email field

    // If no emails are found, return a 404 response
    if (emailList.length === 0) {
      res.status(404).json({ message: 'No emails found' });
      return;
    }

    // Convert emailList array of objects to a single string
    const emailString = emailList.map((emailDoc) => emailDoc.email).join(', ');

    // Optionally, you can also return the total count of emails to help with pagination on the front end
    const totalEmails = await EmailList.countDocuments();

    // Return the email string along with pagination info
    res.status(200).json({
      emails: emailString,
      pagination: {
        totalEmails,
        currentPage: page,
        totalPages: Math.ceil(totalEmails / limit),
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching email list:', error);
    res.status(500).json({ message: 'Error fetching email list', error });
  }
};
