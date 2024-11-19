import express from 'express';
import { createProject,getCombinedAnalytics, getAllProjects, getProjectById, updateProject, deleteProject, deleteAllProjects } from '../controllers/projectController.js';
import { authenticateJWT, isAuthorized } from '../utils/authMiddleware.js';


const router = express.Router();

// Route to create a new project
router.post('/create-project', createProject);

// Route to get all projects
router.get('/all', getAllProjects);

router.get('/analytics', getCombinedAnalytics);

// Route to get a single project by ID
router.get('/:id', getProjectById);

// Route to update a project by ID
router.put('/:id', updateProject);

// Route to delete a single project by ID
router.delete('/:id', deleteProject);

// Route to delete all projects
router.delete('/all', deleteAllProjects);

export default router;
