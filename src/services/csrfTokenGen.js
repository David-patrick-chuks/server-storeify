
export const csrfTokenGen = (req , res ) => {
    // Send CSRF token to the client
    res.json({ csrfToken: req.csrfToken() });
  }