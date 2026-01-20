import { FaSearch, FaBars, FaTimes } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false); // Mobile Menu State
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('searchTerm', searchTerm);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');

    if (searchTermFromUrl) {
      // eslint-disable-next-line 
      setSearchTerm(searchTermFromUrl);
    }
  }, [location.search]);

  // Function to close menu when a link is clicked
  const closeMenu = () => setIsOpen(false);

  return (
    <header className='bg-slate-200 shadow-md relative z-50'>
      <div className='flex justify-between items-center max-w-6xl mx-auto p-3'>
        {/* LOGO */}
        <Link to='/'>
          <h1 className='font-bold text-sm sm:text-xl flex flex-wrap'>
            <span className='text-slate-500'>Oasis</span>
            <span className='text-slate-700'>Space</span>
          </h1>
        </Link>

        {/* SEARCH BAR */}
        <form
          onSubmit={handleSubmit}
          className='bg-slate-100 p-3 rounded-lg flex items-center w-24 sm:w-64'
        >
          <input
            type='text'
            placeholder='Search...'
            className='bg-transparent focus:outline-none w-24 sm:w-64'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button>
            <FaSearch className='text-slate-600' />
          </button>
        </form>

        {/* DESKTOP MENU (Hidden on Mobile) */}
        <ul className='hidden sm:flex gap-4 items-center'>
          <Link to='/'>
            <li className='text-slate-700 hover:underline'>Home</li>
          </Link>
          <Link to='/about'>
            <li className='text-slate-700 hover:underline'>About</li>
          </Link>
          <Link to='/saved-listings'>
            <li className='text-slate-700 hover:underline'>Wishlist</li>
          </Link>
          <Link to='/profile'>
            {currentUser ? (
              <img
                className='rounded-full h-7 w-7 object-cover'
                src={currentUser.avatar}
                alt='profile'
              />
            ) : (
              <li className=' text-slate-700 hover:underline'> Sign in</li>
            )}
          </Link>
        </ul>

        {/* MOBILE HAMBURGER ICON (Visible ONLY on Mobile) */}
        <div className='sm:hidden cursor-pointer' onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FaTimes className='text-slate-700 text-xl' /> : <FaBars className='text-slate-700 text-xl' />}
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {/* This only shows up when isOpen is true */}
      {isOpen && (
        <div className='sm:hidden bg-slate-200 absolute top-full left-0 w-full shadow-lg border-t border-slate-300 flex flex-col items-center gap-5 p-5 transition-all duration-300 ease-in-out'>
          <Link to='/' onClick={closeMenu}>
            <li className='list-none text-slate-700 text-lg hover:text-slate-900 font-semibold'>Home</li>
          </Link>
          <Link to='/about' onClick={closeMenu}>
            <li className='list-none text-slate-700 text-lg hover:text-slate-900 font-semibold'>About</li>
          </Link>
          <Link to='/saved-listings' onClick={closeMenu}>
            <li className='list-none text-slate-700 text-lg hover:text-slate-900 font-semibold'>Wishlist</li>
          </Link>
          <Link to='/create-listing' onClick={closeMenu}>
            <li className='list-none text-slate-700 text-lg hover:text-slate-900 font-semibold'>Create Listing</li>
          </Link>
          <Link to='/profile' onClick={closeMenu}>
            {currentUser ? (
              <div className='flex items-center gap-2 bg-slate-100 p-2 rounded-lg px-4'>
                <img
                  className='rounded-full h-8 w-8 object-cover'
                  src={currentUser.avatar}
                  alt='profile'
                />
                <span className='font-semibold text-slate-700'>Profile</span>
              </div>
            ) : (
              <li className='list-none text-slate-700 text-lg hover:text-slate-900 font-semibold'>Sign in</li>
            )}
          </Link>
        </div>
      )}
    </header>
  );
}