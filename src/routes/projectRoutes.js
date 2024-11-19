import express from 'express';
import { createProject,getCombinedAnalytics, getAllProjects, getProjectById, updateProject, deleteProject, deleteAllProjects } from '../controllers/projectController.js';
import { authenticateJWT, isAuthorized } from '../utils/authMiddleware.js';


const router = express.Router();

// Route to create a new project
router.post('/create-project', authenticateJWT, isAuthorized, createProject);

// Route to get all projects
router.get('/all', authenticateJWT, isAuthorized, getAllProjects);

router.get('/analytics', authenticateJWT, isAuthorized, getCombinedAnalytics);

// Route to get a single project by ID
router.get('/:id', authenticateJWT, isAuthorized, getProjectById);

// Route to update a project by ID
router.put('/:id', authenticateJWT, isAuthorized, updateProject);

// Route to delete a single project by ID
router.delete('/:id', authenticateJWT, isAuthorized, deleteProject);

// Route to delete all projects
router.delete('/all', authenticateJWT, isAuthorized, deleteAllProjects);

export default router;
