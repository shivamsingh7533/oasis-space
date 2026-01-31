import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { FaBars, FaTimes, FaUserShield, FaHeart, FaChartLine, FaBell, FaTrash } from 'react-icons/fa'; // ✅ Added FaTrash
import Profile from '../pages/Profile'; 

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [showProfile, setShowProfile] = useState(false);     

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  
  // Calculate unread messages
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const [deferredPrompt, setDeferredPrompt] = useState(window.deferredPrompt || null);

  // 1. PWA Install Logic
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

  // 2. Notification Fetch Logic (Polling)
  useEffect(() => {
    if(currentUser) {
       const fetchNotifs = async () => {
           try {
               const res = await fetch('/api/notification');
               const data = await res.json();
               if(Array.isArray(data)) setNotifications(data);
           } catch (error) { console.log(error); }
       };
       fetchNotifs(); // Initial Call
       
       const interval = setInterval(fetchNotifs, 10000); // Check every 10s
       return () => clearInterval(interval);
    }
 }, [currentUser]);

 // 3. Mark Notifications as Read
 const handleRead = async () => {
     setShowNotif(!showNotif); // Toggle Dropdown
     if (unreadCount > 0) {
         try {
            await fetch('/api/notification/read', { method: 'POST' });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
         } catch (error) { console.log(error); }
     }
 };

 // ✅ 4. CLEAR ALL NOTIFICATIONS (New Function)
 const handleClear = async (e) => {
     if(e) e.stopPropagation(); // Stop dropdown from closing instantly
     if(!window.confirm("Clear all notifications?")) return;

     try {
         const res = await fetch('/api/notification/clear', { method: 'DELETE' });
         if(res.ok) {
             setNotifications([]); // UI Clean
         }
     } catch (error) { console.log(error); }
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

                      {/* Seller Dashboard Button */}
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

                      {/* NOTIFICATION BELL */}
                      <div className="relative cursor-pointer" onClick={handleRead}>
                        <div className="relative">
                            <FaBell className="text-xl text-slate-300 hover:text-white transition mt-1" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse shadow-sm">
                                    {unreadCount}
                                </span>
                            )}
                        </div>

                        {/* DROPDOWN MENU */}
                        {showNotif && (
                            <div className="absolute right-0 top-10 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                                <div className="p-3 bg-slate-900 border-b border-slate-700 font-bold text-slate-200 flex justify-between items-center">
                                    <span>Notifications</span>
                                    <div className="flex gap-3">
                                        {/* ✅ Clear All Button */}
                                        {notifications.length > 0 && (
                                            <span className="text-xs text-red-400 cursor-pointer hover:text-red-300 flex items-center gap-1" onClick={handleClear}>
                                                <FaTrash /> Clear
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-400 cursor-pointer hover:text-white" onClick={(e) => { e.stopPropagation(); setShowNotif(false); }}>Close</span>
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <p className="p-6 text-center text-slate-500 text-sm">No new notifications</p>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div key={notif._id} className={`p-3 border-b border-slate-700/50 text-sm hover:bg-slate-700 transition ${notif.isRead ? 'text-slate-400' : 'bg-slate-700/30 text-white font-semibold'}`}>
                                                <p>{notif.message}</p>
                                                <p className="text-[10px] text-slate-500 mt-1 text-right">
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                      </div>

                      {/* Profile Trigger */}
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
              {currentUser && (
                  <div className="relative cursor-pointer" onClick={() => setIsSidebarOpen(true)}>
                       <FaBell className="text-xl text-slate-200" />
                       {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-3 h-3 flex items-center justify-center rounded-full">
                                {unreadCount}
                            </span>
                       )}
                  </div>
              )}

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

      <div className={`fixed top-0 right-0 h-full w-64 bg-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
          
          <div className='flex justify-between items-center p-4 border-b border-slate-700'>
              <span className='text-lg font-bold text-slate-200'>Menu</span>
              <button onClick={toggleSidebar} className='text-slate-400 hover:text-white text-2xl'>
                  <FaTimes />
              </button>
          </div>

          <div className='flex flex-col p-4 gap-4'>
              {currentUser && currentUser.role === 'admin' && (
                  <Link to='/dashboard' className='bg-green-600 text-white font-bold text-lg p-3 rounded-lg text-center shadow-lg mb-2 flex items-center justify-center gap-2' onClick={toggleSidebar}>
                      <FaUserShield /> Admin Dashboard
                  </Link>
              )}

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
                      <Link to='/saved-listings' className='text-pink-400 hover:text-pink-300 text-lg font-medium p-2 hover:bg-slate-700 rounded transition flex items-center gap-2' onClick={toggleSidebar}>
                          <FaHeart /> My Wishlist
                      </Link>

                      {/* ✅ Mobile Notifications Section */}
                      <div className="border-t border-slate-700 pt-4 mt-2">
                          <div className="flex justify-between items-center mb-2 px-2">
                              <p className="text-slate-400 text-sm uppercase font-bold flex items-center gap-2">
                                  <FaBell /> Notifications ({unreadCount})
                              </p>
                              {/* ✅ Mobile Clear Button */}
                              {notifications.length > 0 && (
                                  <button onClick={handleClear} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                      <FaTrash /> Clear All
                                  </button>
                              )}
                          </div>
                          
                          <div className="max-h-40 overflow-y-auto bg-slate-900 rounded-lg p-2">
                              {notifications.length === 0 ? (
                                  <p className="text-slate-500 text-xs text-center">No notifications</p>
                              ) : (
                                  notifications.slice(0, 5).map((notif) => (
                                      <div key={notif._id} className={`text-xs p-2 mb-1 rounded ${notif.isRead ? 'text-slate-500' : 'bg-slate-800 text-white border border-slate-700'}`}>
                                          {notif.message}
                                      </div>
                                  ))
                              )}
                          </div>
                          {notifications.length > 0 && (
                              <button onClick={handleRead} className="text-blue-400 text-xs mt-2 px-2 hover:underline">
                                  Mark all as read
                              </button>
                          )}
                      </div>

                      <Link to='/create-listing' className='text-slate-300 hover:text-white text-lg font-medium p-2 hover:bg-slate-700 rounded transition mt-2' onClick={toggleSidebar}>
                          Create Listing
                      </Link>

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