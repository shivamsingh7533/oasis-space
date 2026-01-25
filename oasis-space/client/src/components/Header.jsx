import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // PWA Install Event Listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("✅ PWA Install Event Captured!");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);
    setDeferredPrompt(null);
  };

  return (
    <header className='bg-slate-900 shadow-md sticky top-0 z-50'>
      <div className='flex justify-between items-center max-w-6xl mx-auto p-3'>
        
        {/* LOGO - Fixed to use existing icon-192.png */}
        <Link to='/'>
          <h1 className='font-bold text-sm sm:text-xl flex flex-wrap items-center'>
             <img 
               src="/icon-192.png" 
               alt="OasisSpace Logo" 
               className="w-8 h-8 mr-2 object-cover rounded-full bg-white p-0.5" 
             />
            <span className='text-slate-200'>Oasis</span>
            <span className='text-slate-400'>Space</span>
          </h1>
        </Link>

        {/* NAVIGATION & INSTALL BUTTON */}
        <ul className='flex gap-4 items-center'>
          {/* Install Button Logic */}
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className='bg-slate-700 hover:bg-slate-600 text-blue-400 border border-slate-600 px-3 py-1 rounded-lg text-sm font-semibold transition-all shadow-lg animate-pulse'
            >
              Install App
            </button>
          )}

          <Link to='/'>
            <li className='hidden sm:inline text-slate-300 hover:text-white transition-colors'>Home</li>
          </Link>
          <Link to='/about'>
            <li className='hidden sm:inline text-slate-300 hover:text-white transition-colors'>About</li>
          </Link>
          
          <Link to='/profile'>
            {currentUser ? (
              <img
                className='rounded-full h-8 w-8 object-cover border-2 border-slate-600'
                src={currentUser.avatar}
                alt='profile'
              />
            ) : (
              <li className='text-slate-300 hover:text-white'>Sign in</li>
            )}
          </Link>
        </ul>
      </div>
    </header>
  );
}