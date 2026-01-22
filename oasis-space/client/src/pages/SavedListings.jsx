import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'; // Added useDispatch
import { Link } from 'react-router-dom';
import { FaTrashAlt, FaMapMarkerAlt, FaBed, FaBath } from 'react-icons/fa';
import { updateUserSuccess } from '../redux/user/userSlice'; // Action to sync Redux

export default function SavedListings() {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [savedListings, setSavedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSavedListings = async () => {
      try {
        setLoading(true);
        setError(false);
        
        if (!currentUser?._id) return;

        const res = await fetch(`/api/user/saved/${currentUser._id}`);
        const data = await res.json();
        
        if (data.success === false) {
          setError(true);
          setLoading(false);
          return;
        }
        
        setSavedListings(data);
        setLoading(false);
      } catch (err) {
        console.log(err);
        setError(true);
        setLoading(false);
      }
    };

    fetchSavedListings();
  }, [currentUser?._id]);

  // --- UPDATED REMOVE HANDLER (With Redux Sync) ---
  const handleRemoveListing = async (listingId) => {
    try {
      const res = await fetch(`/api/user/save/${listingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      
      if (data.success === false) {
        console.log(data.message);
        return;
      }

      // 1. SYNC REDUX: Remove ID from currentUser's savedListings
      // This ensures the Heart icon on the Listing page becomes white automatically
      const updatedList = currentUser.savedListings.filter((id) => id !== listingId);
      dispatch(
        updateUserSuccess({
          ...currentUser,
          savedListings: updatedList,
        })
      );

      // 2. UPDATE UI: Remove the card from the local state
      setSavedListings((prev) => prev.filter((listing) => listing._id !== listingId));
      
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className='min-h-screen bg-slate-900'>
      <div className='max-w-6xl mx-auto p-4 flex flex-col gap-8 py-10'>
        
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 p-6 rounded-2xl shadow-lg text-center">
             <h1 className='text-3xl font-bold text-white'>My Wishlist</h1>
             <p className="text-indigo-100 mt-2">Your saved properties for later.</p>
        </div>

        {loading && <p className='text-center text-xl text-slate-300 animate-pulse'>Loading your favorites...</p>}
        
        {/* --- ERROR UI --- */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 p-4 rounded-xl text-center">
            <p className='text-red-200'>Error fetching listings! Please try again later.</p>
          </div>
        )}
        
        {!loading && !error && savedListings.length === 0 && (
            <div className='text-center mt-10 p-10 bg-slate-800 rounded-2xl border border-slate-700'>
                <p className='text-xl text-slate-400'>You haven't saved any listings yet.</p>
                <Link to={'/search'} className='text-indigo-400 hover:text-indigo-300 hover:underline mt-4 inline-block font-semibold transition-colors'>
                    Browse Properties
                </Link>
            </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {!loading && !error && savedListings.length > 0 && savedListings.map((listing) => (
            
            <div key={listing._id} className='bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-slate-600 transition-all duration-300 flex flex-col group'>
                
                <Link to={`/listing/${listing._id}`} className='relative h-[220px] overflow-hidden block'>
                    <img
                        src={listing.imageUrls[0] || "https://53.fs1.hubspotusercontent-na1.net/hub/53/hubfs/Sales_Blog/real-estate-business-compressor.jpg?width=595&height=400&name=real-estate-business-compressor.jpg"}
                        alt='listing cover'
                        className='h-full w-full object-cover group-hover:scale-110 transition-transform duration-500'
                    />
                    <div className='absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md uppercase font-bold tracking-wide border border-slate-600'>
                        {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
                    </div>
                </Link>

                <div className='p-5 flex flex-col flex-1 gap-3'>
                    <Link to={`/listing/${listing._id}`}>
                        <h3 className='text-xl font-bold text-slate-100 truncate hover:text-indigo-400 transition-colors'>
                            {listing.name}
                        </h3>
                    </Link>
                    
                    <div className='flex items-center gap-2'>
                        <FaMapMarkerAlt className='h-4 w-4 text-green-500' />
                        <p className='text-sm text-slate-400 truncate w-full'>{listing.address}</p>
                    </div>

                    <p className='text-sm text-slate-500 line-clamp-2 leading-relaxed'>
                        {listing.description}
                    </p>

                    <div className='flex items-center gap-4 text-slate-300 text-sm mt-1'>
                        <div className="flex items-center gap-1.5 bg-slate-700/50 px-2 py-1 rounded-md">
                            <FaBed className="text-indigo-400"/> 
                            <span className="font-semibold">{listing.bedrooms}</span> Beds
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-700/50 px-2 py-1 rounded-md">
                            <FaBath className="text-indigo-400"/> 
                            <span className="font-semibold">{listing.bathrooms}</span> Baths
                        </div>
                    </div>

                    <div className='flex justify-between items-center mt-auto pt-4 border-t border-slate-700'>
                        <p className='text-white font-bold text-lg'>
                            ₹{listing.offer ? listing.discountPrice.toLocaleString('en-IN') : listing.regularPrice.toLocaleString('en-IN')}
                            {listing.type === 'rent' && <span className='text-xs font-normal text-slate-400 ml-1'>/ month</span>}
                        </p>
                        
                        <button 
                            onClick={() => handleRemoveListing(listing._id)}
                            className='flex items-center gap-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium border border-red-500/20 hover:border-red-500'
                        >
                            <FaTrashAlt className='text-xs' /> Remove
                        </button>
                    </div>
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
}