import webpush from 'web-push';
import Subscription from '../models/subscription.model.js';
import { errorHandler } from '../utils/error.js';

export const subscribe = async (req, res, next) => {
  try {
    const subscription = req.body;

    // Save or update subscription — scoped by BOTH endpoint and user.
    // Prevents a logged-in user from hijacking another device's subscription.
    const newSub = await Subscription.findOneAndUpdate(
      { endpoint: subscription.endpoint, userRef: req.user.id },
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
    // Return the SAME trimmed/padded key format that index.js configures
    // for webpush.setVapidDetails, so browser subscriptions validate.
    const key = (process.env.VAPID_PUBLIC_KEY || '').trim().replace(/=+$/, '');
    if (!key) return next(errorHandler(500, 'VAPID public key is not configured'));
    res.status(200).json({ success: true, publicKey: key });
  } catch (error) {
    next(error);
  }
};
