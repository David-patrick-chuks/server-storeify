import {Router} from "express"
import { notify , getNotifyById} from "../controllers/notifications";
 
const router = Router();

// Route to fetch all notifications for a client
router.get('/notify', notify);
router.get('/notify/:projectId', getNotifyById);

export default router;
