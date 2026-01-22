import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ListingItem from '../components/ListingItem';
import { FaFilter } from 'react-icons/fa';

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to extract params from URL
  const getParamsFromUrl = () => {
    const urlParams = new URLSearchParams(location.search);
    return {
      searchTerm: urlParams.get('searchTerm') || '',
      type: urlParams.get('type') || 'all',
      parking: urlParams.get('parking') === 'true',
      furnished: urlParams.get('furnished') === 'true',
      offer: urlParams.get('offer') === 'true',
      sort: urlParams.get('sort') || 'created_at',
      order: urlParams.get('order') || 'desc',
    };
  };

  const [sidebardata, setSidebardata] = useState(getParamsFromUrl());
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // Mobile Filter Toggle

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    
    // Check if URL params changed to update state
    const newParams = getParamsFromUrl();
    if (JSON.stringify(newParams) !== JSON.stringify(sidebardata)) {
       // eslint-disable-next-line
       setSidebardata(newParams);
    }

    const fetchListings = async () => {
      setLoading(true);
      setShowMore(false);
      const searchQuery = urlParams.toString();
      const res = await fetch(`/api/listing/get?${searchQuery}`);
      const data = await res.json();
      
      if (data.length > 8) {
        setShowMore(true);
      } else {
        setShowMore(false);
      }
      setListings(data);
      setLoading(false);
    };

    fetchListings();
    // eslint-disable-next-line
  }, [location.search]);

  const handleChange = (e) => {
    if (e.target.id === 'all' || e.target.id === 'rent' || e.target.id === 'sale') {
      setSidebardata({ ...sidebardata, type: e.target.id });
    }

    if (e.target.id === 'searchTerm') {
      setSidebardata({ ...sidebardata, searchTerm: e.target.value });
    }

    if (e.target.id === 'parking' || e.target.id === 'furnished' || e.target.id === 'offer') {
      setSidebardata({
        ...sidebardata,
        [e.target.id]: e.target.checked || e.target.checked === 'true' ? true : false,
      });
    }
  };

  // Function to handle Sort Buttons
  const handleSortChange = (sort, order) => {
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('sort', sort);
    urlParams.set('order', order);
    const searchQuery = urlParams.toString();
    // Navigate will trigger useEffect
    navigate(`/search?${searchQuery}`);
    setSidebardata({ ...sidebardata, sort, order });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();
    urlParams.set('searchTerm', sidebardata.searchTerm);
    urlParams.set('type', sidebardata.type);
    urlParams.set('parking', sidebardata.parking);
    urlParams.set('furnished', sidebardata.furnished);
    urlParams.set('offer', sidebardata.offer);
    urlParams.set('sort', sidebardata.sort);
    urlParams.set('order', sidebardata.order);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
    setShowFilters(false); // Close mobile sidebar on search
  };

  const onShowMoreClick = async () => {
    const numberOfListings = listings.length;
    const startIndex = numberOfListings;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('startIndex', startIndex);
    const searchQuery = urlParams.toString();
    const res = await fetch(`/api/listing/get?${searchQuery}`);
    const data = await res.json();
    if (data.length < 9) {
      setShowMore(false);
    }
    setListings([...listings, ...data]);
  };

  return (
    // MAIN CONTAINER: Dark Theme (slate-900)
    <div className='flex flex-col md:flex-row min-h-screen bg-slate-900'>
      
      {/* --- SIDEBAR FILTERS --- */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-800 md:static md:z-auto md:w-80 border-r border-slate-700 shadow-xl p-6 overflow-y-auto transition-transform transform ${
          showFilters ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Mobile Header for Sidebar */}
        <div className="flex justify-between items-center md:hidden mb-6 border-b border-slate-600 pb-4">
            <h2 className='text-xl font-bold text-slate-200'>Filters</h2>
            <button onClick={() => setShowFilters(false)} className='text-slate-400 hover:text-white text-2xl font-bold'>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col gap-8'>
          {/* Search Term */}
          <div className='flex flex-col gap-2'>
            <label className='whitespace-nowrap font-semibold text-slate-300'>Search Term</label>
            <input
              type='text'
              id='searchTerm'
              placeholder='Search...'
              className='border border-slate-600 rounded-lg p-3 w-full bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 placeholder:text-slate-500'
              value={sidebardata.searchTerm}
              onChange={handleChange}
            />
          </div>

          {/* Type Filter */}
          <div className='flex flex-col gap-2'>
            <label className='font-semibold text-slate-300'>Type</label>
            <div className='flex flex-wrap gap-4 text-slate-200'>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='all' className='w-5 h-5 accent-slate-600 bg-slate-700 border-slate-500' onChange={handleChange} checked={sidebardata.type === 'all'} />
                <span>Rent & Sale</span>
              </div>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='rent' className='w-5 h-5 accent-slate-600 bg-slate-700 border-slate-500' onChange={handleChange} checked={sidebardata.type === 'rent'} />
                <span>Rent</span>
              </div>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='sale' className='w-5 h-5 accent-slate-600 bg-slate-700 border-slate-500' onChange={handleChange} checked={sidebardata.type === 'sale'} />
                <span>Sale</span>
              </div>
            </div>
          </div>

          {/* Amenities Filter */}
          <div className='flex flex-col gap-2'>
            <label className='font-semibold text-slate-300'>Amenities</label>
            <div className='flex flex-wrap gap-4 text-slate-200'>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='parking' className='w-5 h-5 accent-slate-600 bg-slate-700 border-slate-500' onChange={handleChange} checked={sidebardata.parking} />
                <span>Parking</span>
              </div>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='furnished' className='w-5 h-5 accent-slate-600 bg-slate-700 border-slate-500' onChange={handleChange} checked={sidebardata.furnished} />
                <span>Furnished</span>
              </div>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='offer' className='w-5 h-5 accent-slate-600 bg-slate-700 border-slate-500' onChange={handleChange} checked={sidebardata.offer} />
                <span>Offer</span>
              </div>
            </div>
          </div>

          <button className='bg-slate-600 text-white p-3 rounded-lg uppercase hover:bg-slate-500 shadow-md transition-all active:scale-95'>
            Apply Filters
          </button>
        </form>
      </div>

      {/* --- RIGHT SIDE: RESULTS --- */}
      <div className='flex-1 w-full'>
        
        {/* --- HEADER: Sort Tabs & Mobile Filter Button --- */}
        <div className='bg-slate-800 shadow-md p-4 sticky top-0 z-30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700'>
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
            <h1 className='text-2xl font-bold text-slate-200'>Listing Results</h1>
            
            {/* Filter Toggle Button (Mobile Only) */}
            <button 
              onClick={() => setShowFilters(true)} 
              className='md:hidden flex items-center gap-2 bg-slate-700 text-slate-200 px-4 py-2 rounded-full font-medium shadow-sm border border-slate-600 hover:bg-slate-600'
            >
              <FaFilter className='text-sm' /> Filters
            </button>
          </div>

          {/* SORT TABS (Dark Theme) */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-slate-400 hidden lg:inline">Sort By</span>
            
            <button 
              onClick={() => handleSortChange('created_at', 'desc')}
              className={`px-4 py-1.5 rounded-full transition-all border ${
                sidebardata.sort === 'created_at' 
                  ? 'bg-slate-200 text-slate-900 font-bold border-slate-200' 
                  : 'bg-slate-900 text-slate-300 border-slate-600 hover:bg-slate-700'
              }`}
            >
              Latest
            </button>
            
            <button 
              onClick={() => handleSortChange('regularPrice', 'asc')}
              className={`px-4 py-1.5 rounded-full transition-all border ${
                sidebardata.sort === 'regularPrice' && sidebardata.order === 'asc'
                  ? 'bg-slate-200 text-slate-900 font-bold border-slate-200' 
                  : 'bg-slate-900 text-slate-300 border-slate-600 hover:bg-slate-700'
              }`}
            >
              Price: Low to High
            </button>
            
            <button 
              onClick={() => handleSortChange('regularPrice', 'desc')}
              className={`px-4 py-1.5 rounded-full transition-all border ${
                sidebardata.sort === 'regularPrice' && sidebardata.order === 'desc'
                  ? 'bg-slate-200 text-slate-900 font-bold border-slate-200' 
                  : 'bg-slate-900 text-slate-300 border-slate-600 hover:bg-slate-700'
              }`}
            >
              Price: High to Low
            </button>
          </div>
        </div>

        {/* --- LISTINGS GRID --- */}
        <div className='p-6 flex flex-wrap gap-6 justify-center sm:justify-start'>
          {!loading && listings.length === 0 && (
            <p className='text-xl text-slate-400 mt-10 w-full text-center'>No listings found!</p>
          )}
          {loading && (
            <p className='text-xl text-slate-400 text-center w-full mt-10'>Loading...</p>
          )}

          {!loading &&
            listings &&
            listings.map((listing) => (
              <ListingItem key={listing._id} listing={listing} />
            ))}

          {showMore && (
            <button
              onClick={onShowMoreClick}
              className='text-green-400 hover:underline p-7 text-center w-full text-lg font-medium hover:text-green-300'
            >
              Show more listings
            </button>
          )}
        </div>
      </div>
      
      {/* Overlay for Mobile Sidebar */}
      {showFilters && (
        <div 
          onClick={() => setShowFilters(false)}
          className="fixed inset-0 bg-black bg-opacity-70 z-30 md:hidden"
        ></div>
      )}

    </div>
  );
}