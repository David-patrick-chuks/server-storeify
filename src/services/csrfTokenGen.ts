import { Response , Request } from 'express'
export const csrfTokenGen = (req : Request, res : Response) => {
    // Send CSRF token to the client
    res.json({ csrfToken: req.csrfToken() });
  }