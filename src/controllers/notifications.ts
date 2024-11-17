// routes/notifications.ts
import { Request, Response,  } from 'express';
import Notification from '../models/Notification';


export const notify = async (req : Request, res : Response):Promise<void> => {
    const { clientEmail } = req.query;
  
    try {
      const notifications = await Notification.find({ clientEmail })
        .sort({ createdAt: -1 }) // Sort by most recent
        .exec();
  
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }