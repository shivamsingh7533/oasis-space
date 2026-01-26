import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  
  // ✅ FIX: State ko shuru mein hi Global Variable se initialize kar diya
  // Isse useEffect mein setState karne ki zaroorat nahi padegi
  const [deferredPrompt, setDeferredPrompt] = useState(window.deferredPrompt || null);

  useEffect(() => {
    // Sirf naye events ke liye listener lagao
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Global variable bhi update rakho
      window.deferredPrompt = e;
      console.log("✅ Header: Captured new install event.");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.deferredPrompt;
    
    if (!promptEvent) return;

    // Prompt dikhao
    promptEvent.prompt();

    // User ka response wait karo
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response: ${outcome}`);

    // Button hata do (State clean)
    setDeferredPrompt(null);
    window.deferredPrompt = null;
  };

  return (
    <header className='bg-slate-900 shadow-md sticky top-0 z-50'>
      <div className='flex justify-between items-center max-w-6xl mx-auto p-3'>
        
        {/* LOGO LINK */}
        <Link to='/'>
          <h1 className='font-bold text-sm sm:text-xl flex flex-wrap items-center'>
             {/* Using icon-192.png explicitly */}
             <img 
               src="/icon-192.png" 
               alt="logo" 
               className="w-8 h-8 mr-2 object-cover rounded-full bg-white p-0.5" 
             />
            <span className='text-slate-200'>Oasis</span>
            <span className='text-slate-400'>Space</span>
          </h1>
        </Link>

        {/* NAVIGATION MENUS */}
        <ul className='flex gap-4 items-center'>
          
          {/* ✅ INSTALL BUTTON */}
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