import express from "express";
import {
  createProject,
  getCombinedAnalytics,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  deleteAllProjects,
} from "../controllers/projectController.js";
import { authenticateJWT, isAuthorized } from "../utils/authMiddleware.js";

const router = express.Router();

// Route to create a new project
router.post("/create-project", authenticateJWT, createProject);

// Route to get all projects
router.get("/all", authenticateJWT, getAllProjects);

router.get("/analytics", authenticateJWT, getCombinedAnalytics);

// Route to get a single project by ID
router.get("/:id", authenticateJWT, getProjectById);

// Route to update a project by ID
router.put("/:id", authenticateJWT, updateProject);

// Route to delete a single project by ID
router.delete("/:id", authenticateJWT, deleteProject);

// Route to delete all projects
router.delete("/all", authenticateJWT, deleteAllProjects);

export default router;
