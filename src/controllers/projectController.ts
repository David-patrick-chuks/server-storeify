import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Joi from 'joi';
import Project, { IProject } from '../models/Projects';

import { google } from 'googleapis';
import { checkAndRefreshAccessToken } from '../services/googleOAuth';
import { startOfDay, subDays, subMonths } from 'date-fns';
// Type for request with project parameters
interface ProjectRequest extends Request {
    params: {
        id: string;
    };
}

// Joi Schema for Project Validation (Client Fields)
const projectSchema = Joi.object({
    niche: Joi.string().required(),
    paymentMode: Joi.string().required(),
    description: Joi.string().required(),
    amount: Joi.number().positive().required(),
    date: Joi.date().required(), // Project creation date
    due: Joi.date().greater(Joi.ref('date')).required(), // Due date must be after the start date
    clientEmail: Joi.string().email().required(),
    action: Joi.string().valid('pending', 'canceled', 'completed').required(),
});

// Joi Schema for Partial Update Validation
const updateProjectSchema = Joi.object({
    _id: Joi.string().alphanum().length(24).optional(), 
    description: Joi.string().required(),
    niche: Joi.string().optional(),
    paymentMode: Joi.string().optional(),
    amount: Joi.number().positive().optional(),
    date: Joi.date().optional(),
    due: Joi.date().greater(Joi.ref('date')).optional(),
    clientEmail: Joi.string().email().optional(),
    action: Joi.string().valid('pending', 'canceled', 'completed').optional(),
});

// Create a new project
export const createProject = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate request body
        const { error, value } = projectSchema.validate(req.body);
        if (error) {
            res.status(400).json({ message: 'Validation error', error: error.details });
            return;
        }

        // Get creatorId from the authenticated user (assumed to be set in middleware)
        const creatorId = req.userId;

        // Add creatorId to the project data
        const projectData: IProject = {
            ...value,
            creatorId, // Include creatorId
        };

        // Create and save the project
        const project = new Project(projectData);
        await project.save();

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error creating project', error });
    }
};

/// Get all projects
export const getAllProjects = async (_req: Request, res: Response): Promise<void> => {
    try {
        const projects: IProject[] = await Project.find().select('-__v -creatorId'); // Excluding __v and creatorId
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching projects', error });
    }
};



// Get a single project by ID
export const getProjectById = async (req: ProjectRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid project ID' });
            return;
        }
        const project = await Project.findById(id).select('-__v -creatorId'); // Excluding __v and creatorId
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching project', error });
    }
};

// Update a project by ID
export const updateProject = async (req: ProjectRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid project ID' });
            return;
        }

        // Validate request body for updates
        const { error, value } = updateProjectSchema.validate(req.body);
        if (error) {
            res.status(400).json({ message: 'Validation error', error: error.details });
            return;
        }

        const updatedProject = await Project.findByIdAndUpdate(id, value, { new: true });
        if (!updatedProject) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: 'Error updating project', error });
    }
};

// Delete a single project by ID
export const deleteProject = async (req: ProjectRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid project ID' });
            return;
        }
        const deletedProject = await Project.findByIdAndDelete(id);
        if (!deletedProject) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project', error });
    }
};

// Delete all projects
export const deleteAllProjects = async (_req: Request, res: Response): Promise<void> => {
    try {
        await Project.deleteMany();
        res.status(200).json({ message: 'All projects deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting all projects', error });
    }
};



// Adjust the // Adjust the path as necessary
interface NicheAnalytics {
    completedLast7Days: number;
    completedLastMonth: number;
    completedLast6Months: number;
    completedLast12Months: number;
  }
// Combined Analytics Controller
export const getCombinedAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    // Project Analytics
    const totalProjects = await Project.countDocuments();
    const pendingProjects = await Project.countDocuments({ action: 'pending' });
    const canceledProjects = await Project.countDocuments({ action: 'canceled' });
    const completedProjects = await Project.countDocuments({ action: 'completed' });


        // Define date ranges
        const today = startOfDay(new Date());
        const last7Days = subDays(today, 7);
        const lastMonth = subMonths(today, 1);
        const last6Months = subMonths(today, 6);
        const last12Months = subMonths(today, 12);

          // Completed projects by range
    const completedLast7Days = await Project.countDocuments({
        action: 'completed',
        date: { $gte: last7Days },
      });
  
      const completedLastMonth = await Project.countDocuments({
        action: 'completed',
        date: { $gte: lastMonth },
      });
  
      const completedLast6Months = await Project.countDocuments({
        action: 'completed',
        date: { $gte: last6Months },
      });
  
      const completedLast12Months = await Project.countDocuments({
        action: 'completed',
        date: { $gte: last12Months },
      });


       // Get projects by niche and filter by the same date ranges
    const niches = ['logo', 'branding', 'website', 'web design'];
 // Declare nicheAnalytics with the correct type
 const nicheAnalytics: { [key: string]: NicheAnalytics } = {};
    for (const niche of niches) {
      nicheAnalytics[niche] = {
        completedLast7Days: await Project.countDocuments({
          niche,
          action: 'completed',
          date: { $gte: last7Days },
        }),
        completedLastMonth: await Project.countDocuments({
          niche,
          action: 'completed',
          date: { $gte: lastMonth },
        }),
        completedLast6Months: await Project.countDocuments({
          niche,
          action: 'completed',
          date: { $gte: last6Months },
        }),
        completedLast12Months: await Project.countDocuments({
          niche,
          action: 'completed',
          date: { $gte: last12Months },
        }),
      };
    }




    // Email Analytics
    let emailAnalytics = {};
    const userId = req.userId;
    
    if (userId) {

      const accessToken = await checkAndRefreshAccessToken(userId);

      if (accessToken) {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const profile = await gmail.users.getProfile({ userId: 'me' });

        const { emailAddress, historyId, messagesTotal, threadsTotal } = profile.data;
        emailAnalytics = { emailAddress, historyId, messagesTotal, threadsTotal };
      } else {
        console.warn('No access token available for email analytics.');
      }
    }

    // Response combining both Project and Email analytics
    res.status(200).json({
      projects: {
        totalProjects,
        pendingProjects,
        canceledProjects,
        completedProjects,
      },
      email: emailAnalytics,
      completedAnalytics: {
        last7Days: completedLast7Days,
        lastMonth: completedLastMonth,
        last6Months: completedLast6Months,
        last12Months: completedLast12Months,
        totalDeals: totalProjects
      },
      nicheAnalytics
    });
  } catch (error: any) {
    console.error('Error fetching combined analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};
