import {Router} from "express"
import { notify , getNotifyById} from "../controllers/notifications.js";
import { authenticateJWT } from "../utils/authMiddleware.js";
 
const router = Router();

// Route to fetch all notifications for a client
router.get('/notify', authenticateJWT, notify);
router.get('/notify/:projectId',authenticateJWT, getNotifyById);

export default router;
