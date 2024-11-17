import { Request, Response } from "express";
import EmailList from "../models/EmailList";

export const getEmailList = async (_req: Request, res: Response): Promise<void> => {
    try {
      // Retrieve all emails from the EmailList collection
      const emailList = await EmailList.find();
  
      // If no emails are found, return a 404 response
      if (emailList.length === 0) {
        res.status(404).json({ message: 'No emails found' });
        return;
      }
  
      // Return the email list as the response
      res.status(200).json(emailList);
    } catch (error) {
      console.error('Error fetching email list:', error);
      res.status(500).json({ message: 'Error fetching email list', error });
    }
  };