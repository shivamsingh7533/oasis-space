import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
// ✅ ADDED: FaChartLine for Seller Dashboard Icon
import { FaBars, FaTimes, FaUserShield, FaHeart, FaChartLine } from 'react-icons/fa'; 
import Profile from '../pages/Profile'; 

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [showProfile, setShowProfile] = useState(false);     

  const [deferredPrompt, setDeferredPrompt] = useState(window.deferredPrompt || null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPrompt = e;
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
    console.log(`User install choice: ${outcome}`); 
    setDeferredPrompt(null);
    window.deferredPrompt = null;
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <header className='bg-slate-900 shadow-md sticky top-0 z-40'>
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

          {/* --- DESKTOP NAVIGATION --- */}
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

              {currentUser ? (
                  <>
                      {/* Wishlist Link */}
                      <Link to='/saved-listings' className='text-slate-300 hover:text-pink-500 transition-colors flex items-center gap-1' title="My Wishlist">
                          <FaHeart className='text-lg' /> <span className='hidden lg:inline text-sm'>Wishlist</span>
                      </Link>

                      {/* 🔥 NEW: Seller Dashboard Button (Only for Approved Sellers) */}
                      {currentUser.sellerStatus === 'approved' && (
                        <Link 
                            to='/seller-dashboard' 
                            className='flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md transition-all'
                        >
                            <FaChartLine /> Seller Panel
                        </Link>
                      )}

                      {/* Admin Panel Button */}
                      {currentUser.role === 'admin' && (
                        <Link 
                            to='/dashboard' 
                            className='flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md transition-all'
                        >
                            <FaUserShield /> Admin Panel
                        </Link>
                      )}

                      {/* Profile Trigger (Opens Pop-up) */}
                      <div className='relative cursor-pointer' onClick={() => setShowProfile(true)}>
                          <img
                              className='rounded-full h-9 w-9 object-cover border-2 border-slate-600 hover:border-slate-400 transition'
                              src={currentUser.avatar}
                              alt='profile'
                          />
                      </div>
                  </>
              ) : (
                  <Link to='/sign-in' className='text-slate-300 hover:text-white'>Sign in</Link>
              )}
          </ul>

          {/* --- MOBILE BURGER ICON --- */}
          <div className='md:hidden flex items-center gap-4'>
              {deferredPrompt && (
                  <button 
                    onClick={handleInstallClick}
                    className='bg-slate-700 text-blue-400 border border-slate-600 px-2 py-1 rounded text-xs font-semibold'
                  >
                    Install
                  </button>
              )}

              <button onClick={toggleSidebar} className='text-slate-200 text-2xl focus:outline-none p-1'>
                  <FaBars />
              </button>
          </div>
        </div>
      </header>

      {/* --- 📱 MOBILE SIDEBAR --- */}
      <div 
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={toggleSidebar}
      ></div>

      <div className={`fixed top-0 right-0 h-full w-64 bg-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          <div className='flex justify-between items-center p-4 border-b border-slate-700'>
              <span className='text-lg font-bold text-slate-200'>Menu</span>
              <button onClick={toggleSidebar} className='text-slate-400 hover:text-white text-2xl'>
                  <FaTimes />
              </button>
          </div>

          <div className='flex flex-col p-4 gap-4'>
              {/* Mobile Admin Link */}
              {currentUser && currentUser.role === 'admin' && (
                  <Link to='/dashboard' className='bg-green-600 text-white font-bold text-lg p-3 rounded-lg text-center shadow-lg mb-2 flex items-center justify-center gap-2' onClick={toggleSidebar}>
                      <FaUserShield /> Admin Dashboard
                  </Link>
              )}

              {/* 🔥 Mobile Seller Link */}
              {currentUser && currentUser.sellerStatus === 'approved' && (
                  <Link to='/seller-dashboard' className='bg-blue-600 text-white font-bold text-lg p-3 rounded-lg text-center shadow-lg mb-2 flex items-center justify-center gap-2' onClick={toggleSidebar}>
                      <FaChartLine /> Seller Dashboard
                  </Link>
              )}

              <Link to='/' className='text-slate-300 hover:text-white text-lg font-medium p-2 hover:bg-slate-700 rounded transition' onClick={toggleSidebar}>
                  Home
              </Link>
              <Link to='/about' className='text-slate-300 hover:text-white text-lg font-medium p-2 hover:bg-slate-700 rounded transition' onClick={toggleSidebar}>
                  About
              </Link>

              {currentUser ? (
                  <>  
                      {/* Mobile Wishlist */}
                      <Link to='/saved-listings' className='text-pink-400 hover:text-pink-300 text-lg font-medium p-2 hover:bg-slate-700 rounded transition flex items-center gap-2' onClick={toggleSidebar}>
                          <FaHeart /> My Wishlist
                      </Link>

                      <Link to='/create-listing' className='text-slate-300 hover:text-white text-lg font-medium p-2 hover:bg-slate-700 rounded transition' onClick={toggleSidebar}>
                          Create Listing
                      </Link>

                      {/* Profile Trigger */}
                      <div 
                        className='flex items-center gap-3 p-2 hover:bg-slate-700 rounded transition cursor-pointer mt-4 border-t border-slate-700 pt-4'
                        onClick={() => {
                            toggleSidebar();
                            setShowProfile(true);
                        }}
                      >
                          <img
                              className='rounded-full h-10 w-10 object-cover border-2 border-slate-600'
                              src={currentUser.avatar}
                              alt='profile'
                          />
                          <div>
                              <p className='text-white font-bold text-sm'>{currentUser.username}</p>
                              <p className='text-slate-400 text-xs'>View Profile</p>
                          </div>
                      </div>
                  </>
              ) : (
                  <Link to='/sign-in' className='bg-slate-700 text-center text-white p-3 rounded-lg mt-4 hover:bg-slate-600 transition font-bold' onClick={toggleSidebar}>
                      Sign In
                  </Link>
              )}
          </div>
      </div>

      {showProfile && <Profile onClose={() => setShowProfile(false)} />}
    </>
  );
}