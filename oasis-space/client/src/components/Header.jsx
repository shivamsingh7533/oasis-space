import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa'; // ✅ Burger Icons

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  
  // ✅ Mobile Menu State
  const [isOpen, setIsOpen] = useState(false);

  // ✅ Install Logic (Unchanged as requested)
  const [deferredPrompt, setDeferredPrompt] = useState(window.deferredPrompt || null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
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
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response: ${outcome}`);
    setDeferredPrompt(null);
    window.deferredPrompt = null;
  };

  // Toggle Mobile Menu
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className='bg-slate-900 shadow-md sticky top-0 z-50'>
      <div className='flex justify-between items-center max-w-6xl mx-auto p-3'>
        
        {/* --- LOGO --- */}
        <Link to='/'>
          <h1 className='font-bold text-sm sm:text-xl flex flex-wrap items-center'>
             <img 
               src="/icon-192.png" 
               alt="logo" 
               className="w-8 h-8 mr-2 object-cover rounded-full bg-white p-0.5" 
             />
            <span className='text-slate-200'>Oasis</span>
            <span className='text-slate-400'>Space</span>
          </h1>
        </Link>

        {/* --- DESKTOP NAVIGATION (Hidden on Mobile) --- */}
        <ul className='hidden md:flex gap-6 items-center font-medium'>
            
            {/* Install Button */}
            {deferredPrompt && (
                <button 
                  onClick={handleInstallClick}
                  className='bg-slate-700 hover:bg-slate-600 text-blue-400 border border-slate-600 px-3 py-1 rounded-lg text-sm font-semibold transition-all shadow-lg animate-pulse'
                >
                  Install App
                </button>
            )}

            <Link to='/' className='text-slate-300 hover:text-white transition-colors'>Home</Link>
            <Link to='/about' className='text-slate-300 hover:text-white transition-colors'>About</Link>

            {/* ✅ LOGIC: Admin Button vs User Button */}
            {currentUser ? (
                <>
                    {/* Admin ke liye Special Dashboard */}
                    {currentUser.role === 'admin' ? (
                        <Link to='/dashboard' className='text-green-400 hover:text-green-300 transition-colors font-bold border border-green-500/30 px-2 py-1 rounded'>
                            Admin Panel
                        </Link>
                    ) : (
                        /* Normal User ke liye Dashboard (Profile) */
                        <Link to='/profile' className='text-slate-300 hover:text-white transition-colors'>
                            My Dashboard
                        </Link>
                    )}

                    {/* Profile Image */}
                    <Link to='/profile'>
                        <img
                            className='rounded-full h-9 w-9 object-cover border-2 border-slate-600 hover:border-slate-400 transition'
                            src={currentUser.avatar}
                            alt='profile'
                        />
                    </Link>
                </>
            ) : (
                <Link to='/sign-in' className='text-slate-300 hover:text-white'>Sign in</Link>
            )}
        </ul>

        {/* --- MOBILE NAVIGATION (Burger Icon) --- */}
        <div className='md:hidden flex items-center gap-4'>
            {/* Mobile mein bhi Install Button dikhana chahiye */}
            {deferredPrompt && (
                <button 
                  onClick={handleInstallClick}
                  className='bg-slate-700 text-blue-400 border border-slate-600 px-2 py-1 rounded text-xs font-semibold'
                >
                  Install
                </button>
            )}

            <button onClick={toggleMenu} className='text-slate-200 text-2xl focus:outline-none'>
                {isOpen ? <FaTimes /> : <FaBars />}
            </button>
        </div>
      </div>

      {/* --- MOBILE MENU DROPDOWN --- */}
      {isOpen && (
        <div className='md:hidden bg-slate-800 border-t border-slate-700 absolute w-full left-0 shadow-xl flex flex-col'>
            <Link to='/' className='p-4 text-center text-slate-300 hover:bg-slate-700 border-b border-slate-700' onClick={toggleMenu}>
                Home
            </Link>
            <Link to='/about' className='p-4 text-center text-slate-300 hover:bg-slate-700 border-b border-slate-700' onClick={toggleMenu}>
                About
            </Link>

            {currentUser ? (
                <>
                    {currentUser.role === 'admin' && (
                        <Link to='/dashboard' className='p-4 text-center text-green-400 font-bold hover:bg-slate-700 border-b border-slate-700' onClick={toggleMenu}>
                            Admin Dashboard
                        </Link>
                    )}
                    
                    <Link to='/create-listing' className='p-4 text-center text-slate-300 hover:bg-slate-700 border-b border-slate-700' onClick={toggleMenu}>
                        Create Listing
                    </Link>

                    <Link to='/profile' className='p-4 text-center text-slate-300 hover:bg-slate-700 border-b border-slate-700' onClick={toggleMenu}>
                        My Profile & Dashboard
                    </Link>

                    <div className='p-4 flex justify-center bg-slate-900'>
                         <img
                            className='rounded-full h-10 w-10 object-cover border-2 border-slate-600'
                            src={currentUser.avatar}
                            alt='profile'
                        />
                    </div>
                </>
            ) : (
                <Link to='/sign-in' className='p-4 text-center text-slate-300 hover:bg-slate-700' onClick={toggleMenu}>
                    Sign In
                </Link>
            )}
        </div>
      )}
    </header>
  );
}