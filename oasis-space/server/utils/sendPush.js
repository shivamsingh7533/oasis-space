import webpush from 'web-push';
import Subscription from '../models/subscription.model.js';

/**
 * Sends a push notification to a specific user.
 * @param {String} userId - The MongoDB ObjectId of the user.
 * @param {Object} payload - The notification payload (e.g. { title: '...', body: '...' }).
 */
export const sendPushNotification = async (userId, payload) => {
  try {
    const subscriptions = await Subscription.find({ userRef: userId });
    
    if (!subscriptions || subscriptions.length === 0) {
      return; // No active subscriptions for this user
    }

    const payloadString = JSON.stringify(payload);

    // Send push to all registered devices for this user
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payloadString
          );
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription has expired or is no longer valid, remove it
            console.log('Push subscription expired, removing from DB:', sub.endpoint);
            await Subscription.findByIdAndDelete(sub._id);
          } else {
            console.error('Error sending push notification to endpoint:', sub.endpoint, err);
          }
        }
      })
    );
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
};
