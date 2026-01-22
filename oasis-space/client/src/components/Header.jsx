import { FaBars, FaTimes, FaSignOutAlt, FaTimesCircle, FaHome, FaInfoCircle, FaHeart, FaPlusCircle, FaUser } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect, useRef } from 'react';
import { 
  deleteUserFailure, deleteUserSuccess, signOutUserStart 
} from '../redux/user/userSlice';

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const [isOpen, setIsOpen] = useState(false); // Mobile Menu State
  const [profileOpen, setProfileOpen] = useState(false); // Desktop Popup State
  const profileRef = useRef(); 
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const closeMenu = () => setIsOpen(false);

  // --- SIGN OUT FUNCTION ---
  const handleSignOut = async () => {
    try {
      dispatch(signOutUserStart());
      const res = await fetch('/api/auth/signout');
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
      setProfileOpen(false);
      navigate('/sign-in');
    } catch (err) {
      dispatch(deleteUserFailure(err.message));
    }
  };

  // --- CLICK OUTSIDE TO CLOSE DESKTOP POPUP ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileRef]);

  // Disable scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  return (
    <header className='bg-slate-900 shadow-md relative z-50'>
      <div className='flex justify-between items-center max-w-6xl mx-auto p-3'>
        
        {/* LOGO SECTION */}
        <Link to='/' className='flex items-center gap-2'>
          <img 
            src='/logo.png' 
            alt='logo' 
            className='rounded-full h-7 w-7 sm:h-9 sm:w-9 object-contain' 
          />
          <h1 className='font-bold text-sm sm:text-xl flex flex-wrap'>
            <span className='text-slate-300'>Oasis</span>
            <span className='text-slate-100'>Space</span>
          </h1>
        </Link>

        {/* DESKTOP MENU (Hidden on Mobile) */}
        <ul className='hidden sm:flex gap-4 items-center'>
          <Link to='/'><li className='text-slate-300 hover:text-white hover:underline transition-colors'>Home</li></Link>
          <Link to='/about'><li className='text-slate-300 hover:text-white hover:underline transition-colors'>About</li></Link>
          <Link to='/saved-listings'><li className='text-slate-300 hover:text-white hover:underline transition-colors'>Wishlist</li></Link>

          {/* DESKTOP PROFILE POPUP */}
          <div className='relative' ref={profileRef}>
            {currentUser ? (
              <img
                onClick={() => setProfileOpen(!profileOpen)}
                className='rounded-full h-8 w-8 object-cover border-2 border-slate-500 cursor-pointer hover:opacity-90 transition-opacity'
                src={currentUser.avatar}
                alt='profile'
              />
            ) : (
              <Link to='/sign-in'>
                <li className='text-slate-300 hover:text-white hover:underline transition-colors list-none'> Sign in</li>
              </Link>
            )}

            {/* Desktop Popup UI */}
            {profileOpen && currentUser && (
              <div className='absolute right-0 top-12 mt-2 w-80 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden z-[100]'>
                <div className='flex justify-between items-center px-4 py-2 border-b border-slate-700/50'>
                  <span className='text-xs text-slate-400 truncate max-w-[200px]'>{currentUser.email}</span>
                  <FaTimesCircle className='text-slate-400 hover:text-slate-200 cursor-pointer' onClick={() => setProfileOpen(false)} />
                </div>
                <div className='flex flex-col items-center p-6 gap-3'>
                  <div className='relative'>
                     <img src={currentUser.avatar} alt="avatar" className='h-20 w-20 rounded-full object-cover border-4 border-slate-700' />
                  </div>
                  <h2 className='text-xl text-slate-100 font-normal'>Hi, {currentUser.username}!</h2>
                  <Link to='/profile' onClick={() => setProfileOpen(false)} className='mt-2 border border-slate-500 text-slate-300 hover:bg-slate-700 hover:text-white rounded-full py-2 px-6 text-sm font-medium transition-all'>
                    Manage your Account
                  </Link>
                </div>
                <div className='bg-slate-900/50 p-3 flex justify-center border-t border-slate-700'>
                  <button onClick={handleSignOut} className='flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 transition-colors'>
                    <FaSignOutAlt /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </ul>

        {/* MOBILE HAMBURGER ICON */}
        <div className='sm:hidden cursor-pointer z-50' onClick={() => setIsOpen(!isOpen)}>
           {!isOpen && <FaBars className='text-white text-xl' />}
        </div>
      </div>

      {/* --- NEW SIDE DRAWER MOBILE MENU --- */}
      
      {/* 1. Transparent Overlay (Detects click outside) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity" 
          onClick={closeMenu}
        ></div>
      )}

      {/* 2. Sliding Drawer */}
      <div className={`fixed top-0 right-0 h-full w-[75%] sm:w-[50%] bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-700 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Drawer Header (Close Button) */}
        <div className='flex justify-between items-center p-5 border-b border-slate-700'>
          <span className='text-slate-100 font-bold text-lg'>Menu</span>
          <FaTimes className='text-slate-300 text-2xl cursor-pointer hover:text-white' onClick={closeMenu} />
        </div>

        {/* Drawer Content (Sections) */}
        <div className='flex flex-col p-2 overflow-y-auto h-full pb-20'>
          
          {/* Section 1: Main Navigation */}
          <div className='flex flex-col py-2 border-b border-slate-700'>
            <Link to='/' onClick={closeMenu} className='flex items-center gap-3 p-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all'>
              <FaHome className="text-lg" /> <span className='font-medium'>Home</span>
            </Link>
            <Link to='/about' onClick={closeMenu} className='flex items-center gap-3 p-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all'>
              <FaInfoCircle className="text-lg" /> <span className='font-medium'>About</span>
            </Link>
            <Link to='/saved-listings' onClick={closeMenu} className='flex items-center gap-3 p-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all'>
              <FaHeart className="text-lg" /> <span className='font-medium'>Wishlist</span>
            </Link>
          </div>

          {/* Section 2: Actions */}
          <div className='flex flex-col py-2 border-b border-slate-700'>
            <Link to='/create-listing' onClick={closeMenu} className='flex items-center gap-3 p-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all'>
               <FaPlusCircle className="text-lg" /> <span className='font-medium'>Create Listing</span>
            </Link>
          </div>

          {/* Section 3: Profile / Auth */}
          <div className='flex flex-col py-2'>
            {currentUser ? (
              <>
                <Link to='/profile' onClick={closeMenu} className='flex items-center gap-3 p-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all'>
                   <img className='rounded-full h-6 w-6 object-cover border border-slate-500' src={currentUser.avatar} alt='profile' />
                   <span className='font-medium'>Profile</span>
                </Link>
                <button onClick={() => { handleSignOut(); closeMenu(); }} className='flex items-center gap-3 p-3 text-red-400 hover:bg-slate-800 rounded-lg transition-all text-left w-full'>
                   <FaSignOutAlt className="text-lg" /> <span className='font-medium'>Sign Out</span>
                </button>
              </>
            ) : (
              <Link to='/sign-in' onClick={closeMenu} className='flex items-center gap-3 p-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all'>
                 <FaUser className="text-lg" /> <span className='font-medium'>Sign In</span>
              </Link>
            )}
          </div>

        </div>
      </div>

    </header>
  );
}