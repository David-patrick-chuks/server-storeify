import csurf from 'csurf';

export const csrfProtection = csurf({
    cookie: {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict', 
      maxAge: 60 * 60 * 24 * 7 
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'], 
  });
  