import webpush from 'web-push';
import Subscription from '../models/subscription.model.js';
import { errorHandler } from '../utils/error.js';

export const subscribe = async (req, res, next) => {
  try {
    const subscription = req.body;

    // Save or update subscription in database
    const newSub = await Subscription.findOneAndUpdate(
      { endpoint: subscription.endpoint }, // find by endpoint to avoid duplicates
      {
        userRef: req.user.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      { upsert: true, new: true }
    );

    // Send a welcome notification on successful subscription
    const payload = JSON.stringify({
      title: 'Notifications Enabled 🎉',
      body: 'You will now receive alerts for important updates!',
    });

    try {
      await webpush.sendNotification(subscription, payload);
    } catch (err) {
      console.log('Error sending welcome push notification:', err);
      // Don't fail the whole request if sending welcome push fails, as the subscription is still saved.
    }

    res.status(201).json({ success: true, message: 'Subscribed to push notifications' });
  } catch (error) {
    next(error);
  }
};

export const unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    await Subscription.findOneAndDelete({ endpoint, userRef: req.user.id });
    res.status(200).json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (error) {
    next(error);
  }
};

export const getVapidPublicKey = (req, res, next) => {
  try {
    res.status(200).json({ success: true, publicKey: process.env.VAPID_PUBLIC_KEY });
  } catch (error) {
    next(error);
  }
};
