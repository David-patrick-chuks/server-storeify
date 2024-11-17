import {Router} from "express"
import { notify } from "../controllers/notifications";
 
const router = Router();

// Route to fetch all notifications for a client
router.get('/notify', notify);

export default router;
