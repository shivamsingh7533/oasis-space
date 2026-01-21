import { FaBars, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState } from 'react';

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    // DARK THEME HEADER (bg-slate-900)
    <header className='bg-slate-900 shadow-md relative z-50'>
      <div className='flex justify-between items-center max-w-6xl mx-auto p-3'>
        
        {/* LOGO SECTION - UPDATED */}
        <Link to='/' className='flex items-center gap-2'>
          {/* Logo Image - 'rounded-full' class added here */}
          <img 
            src='/logo.png' // Make sure 'logo.png' is inside 'client/public' folder
            alt='logo' 
            // Added 'rounded-full' to make it circular
            className='rounded-full h-7 w-7 sm:h-9 sm:w-9 object-contain' 
          />
          <h1 className='font-bold text-sm sm:text-xl flex flex-wrap'>
            <span className='text-slate-300'>Oasis</span>
            <span className='text-slate-100'>Space</span>
          </h1>
        </Link>

        {/* --- SEARCH BAR REMOVED FROM HERE --- */}

        {/* DESKTOP MENU */}
        <ul className='hidden sm:flex gap-4 items-center'>
          <Link to='/'>
            <li className='text-slate-300 hover:text-white hover:underline transition-colors'>Home</li>
          </Link>
          <Link to='/about'>
            <li className='text-slate-300 hover:text-white hover:underline transition-colors'>About</li>
          </Link>
          <Link to='/saved-listings'>
            <li className='text-slate-300 hover:text-white hover:underline transition-colors'>Wishlist</li>
          </Link>
          <Link to='/profile'>
            {currentUser ? (
              <img
                className='rounded-full h-7 w-7 object-cover border-2 border-slate-500'
                src={currentUser.avatar}
                alt='profile'
              />
            ) : (
              <li className='text-slate-300 hover:text-white hover:underline transition-colors'> Sign in</li>
            )}
          </Link>
        </ul>

        {/* MOBILE HAMBURGER ICON */}
        <div className='sm:hidden cursor-pointer' onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FaTimes className='text-white text-xl' /> : <FaBars className='text-white text-xl' />}
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN (Dark Theme) */}
      {isOpen && (
        <div className='sm:hidden bg-slate-900 absolute top-full left-0 w-full shadow-lg border-t border-slate-700 flex flex-col items-center gap-5 p-5 transition-all duration-300 ease-in-out'>
          <Link to='/' onClick={closeMenu}>
            <li className='list-none text-slate-300 text-lg hover:text-white font-semibold'>Home</li>
          </Link>
          <Link to='/about' onClick={closeMenu}>
            <li className='list-none text-slate-300 text-lg hover:text-white font-semibold'>About</li>
          </Link>
          <Link to='/saved-listings' onClick={closeMenu}>
            <li className='list-none text-slate-300 text-lg hover:text-white font-semibold'>Wishlist</li>
          </Link>
          <Link to='/create-listing' onClick={closeMenu}>
            <li className='list-none text-slate-300 text-lg hover:text-white font-semibold'>Create Listing</li>
          </Link>
          <Link to='/profile' onClick={closeMenu}>
            {currentUser ? (
              <div className='flex items-center gap-2 bg-slate-800 p-2 rounded-lg px-4 border border-slate-700'>
                <img
                  className='rounded-full h-8 w-8 object-cover'
                  src={currentUser.avatar}
                  alt='profile'
                />
                <span className='font-semibold text-slate-200'>Profile</span>
              </div>
            ) : (
              <li className='list-none text-slate-300 text-lg hover:text-white font-semibold'>Sign in</li>
            )}
          </Link>
        </div>
      )}
    </header>
  );
}