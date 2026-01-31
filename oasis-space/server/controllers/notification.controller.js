import Notification from '../models/notification.model.js';
import { errorHandler } from '../utils/error.js';

// 1. Get all notifications for the user
export const getNotifications = async (req, res, next) => {
  try {
    const notifs = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 }); // Latest notification pehle aayega
    res.status(200).json(notifs);
  } catch (error) {
    next(error);
  }
};

// 2. Mark notifications as read
export const markRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json("Notifications marked as read");
  } catch (error) {
    next(error);
  }
};