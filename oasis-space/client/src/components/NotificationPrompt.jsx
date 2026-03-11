import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaBell, FaTimes } from 'react-icons/fa';

/**
 * A modern, native-app like prompt asking users to enable push notifications.
 * It only shows up if the user is logged in, the browser supports it, 
 * permission hasn't been asked/granted yet, and they haven't dismissed it this session.
 */
export default function NotificationPrompt() {
  const { currentUser } = useSelector((state) => state.user);
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only show to logged-in users
    if (!currentUser) return;

    // Check if dismissed previously
    const isDismissed = localStorage.getItem('pushPromptDismissed');
    if (isDismissed) return;

    // Check support and current permission
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      if (Notification.permission === 'default') {
        // Show after a slight delay so it doesn't interrupt the extremely fast initial paint
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser]);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pushPromptDismissed', 'true');
  };

  // Helper to convert VAPID key
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        // Fetch VAPID key
        const res = await fetch('/api/push/vapidPublicKey');
        const { publicKey } = await res.json();
        const convertedVapidKey = urlBase64ToUint8Array(publicKey);

        // Subscribe via browser
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        // Save to backend
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });

        setShowPrompt(false);
        // We don't need to set dismissed here, since permission is now 'granted', 
        // the prompt won't show anyway next time. But setting it prevents it if they clear permissions later and we don't want to bug them immediately.
        localStorage.setItem('pushPromptDismissed', 'true'); 
      } else {
        // User clicked Block or dismissed the browser prompt
        handleDismiss();
      }
    } catch (err) {
      console.log('Push subscription failed:', err);
      handleDismiss();
    }
    setLoading(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1e293b] rounded-3xl shadow-2xl border border-slate-700 w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10">
        
        {/* Header Image/Icon Section */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 flex justify-center items-center relative">
          <button 
            onClick={handleDismiss} 
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition"
          >
            <FaTimes />
          </button>
          <div className="bg-white/20 p-4 rounded-full backdrop-blur-md animate-bounce">
            <FaBell className="text-5xl text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Don't Miss Out!</h3>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            Enable push notifications to get instant alerts for property bookings, seller approvals, and important updates directly on your device.
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleEnable}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Configuring...</span>
              ) : (
                <>Allow Notifications</>
              )}
            </button>
            <button 
              onClick={handleDismiss}
              disabled={loading}
              className="w-full bg-transparent hover:bg-slate-800 text-slate-400 font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
