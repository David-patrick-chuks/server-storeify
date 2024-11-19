
import logger from '../config/logger.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';


export const notify = async (req, res)  => {
    const email = req.userId;


    try {
        const user = await User.findOne({ email });
        if (!user) {
            logger.error('Admin email not found.');
            return
        }
        const notifications = await Notification.find()
            .sort({ createdAt: -1 }) // Sort by most recent
            .exec();

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
}

export const getNotifyById = async (req, res)  => {
    try {
        const { projectId } = req.params;
        if (!projectId) {
            res.status(400).json({ message: 'Invalid project ID' });
            return;
        }

        const notification = await Notification.findById(projectId)

        // Excluding __v and creatorId
        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }
        const notificationData = await Notification.findByIdAndUpdate(notification._id, { isRead: true }, { new: true });
        res.status(200).json(notificationData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching Notification', error });
    }
};

