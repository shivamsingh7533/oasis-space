import { useState, useEffect } from 'react';
import { FaBell, FaBellSlash } from 'react-icons/fa';

// Helper to convert VAPID key to Uint8Array required by PushManager
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.log('Error checking push subscription:', err);
    }
  };

  const subscribePush = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // 1. Fetch public VAPID key from backend
      const res = await fetch('/api/push/vapidPublicKey');
      const { publicKey } = await res.json();
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);

      // 2. Browser native push subscription request
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // 3. Save subscription config to backend DB
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      setIsSubscribed(true);
      alert('Push notifications enabled successfully! 🎉');
    } catch (err) {
      console.log('Push subscription failed:', err);
      if (Notification.permission === 'denied') {
        alert('Notifications are blocked by your browser. Please allow them in your browser site settings.');
      } else {
        alert('Failed to enable push notifications.');
      }
    }
    setLoading(false);
  };

  const unsubscribePush = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        
        // Remove from our backend
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        
        // Remove from browser
        await subscription.unsubscribe();
        setIsSubscribed(false);
      }
    } catch (err) {
      console.log('Error unsubscribing:', err);
    }
    setLoading(false);
  };

  if (!isSupported) return null;

  return (
    <button 
      onClick={isSubscribed ? unsubscribePush : subscribePush}
      disabled={loading}
      className={`w-full p-3 hover:bg-slate-700 flex items-center justify-between transition border-b border-slate-700/50 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className='flex items-center gap-3'>
        <span className={isSubscribed ? 'text-green-400' : 'text-slate-400'}>
          {isSubscribed ? <FaBell /> : <FaBellSlash />}
        </span>
        <span className='text-sm font-medium'>
          {isSubscribed ? 'Push Notifications Active' : 'Enable Push Notifications'}
        </span>
      </div>
      {loading && <span className="text-xs text-slate-400 animate-pulse">Wait...</span>}
    </button>
  );
}
