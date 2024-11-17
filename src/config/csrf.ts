import csrf from 'csurf';
// const csrfProtection = csrf({ cookie: true });
export const csrfProtection = csrf({
  // cookie: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'lax', // or 'strict', adjust based on your frontend-backend interaction
  },
  // cookie: {
  //   httpOnly: true, // Ensures the cookie is not accessible via JavaScript
  //   secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
  //   sameSite: 'strict', // Helps prevent CSRF attacks by allowing cookies only from the same site
  //   maxAge: 60 * 60 * 24 * 7 // Cookie expiry in seconds (e.g., 7 days)
  // },
  // ignoreMethods: ['GET', 'HEAD', 'OPTIONS'], // Methods to ignore CSRF check
});
