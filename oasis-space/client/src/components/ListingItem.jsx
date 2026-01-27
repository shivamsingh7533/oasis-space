import { Link } from 'react-router-dom';
import { MdLocationOn } from 'react-icons/md';
import { FaBed, FaBath, FaHeart, FaRegHeart } from 'react-icons/fa';
import { useState } from 'react'; // ✅ FIX: 'useEffect' hata diya
import { useSelector } from 'react-redux';

export default function ListingItem({ listing }) {
  const { currentUser } = useSelector((state) => state.user);
  const [isSaved, setIsSaved] = useState(false);

  const handleWishlist = async (e) => {
    e.preventDefault(); // Prevent Link navigation
    if (!currentUser) return alert("Please Login to Wishlist!");

    try {
        const res = await fetch(`/api/user/save/${listing._id}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        // ✅ FIX: 'data' variable hata diya kyunki use nahi ho raha tha
        await res.json(); 
        
        if(res.ok) {
            setIsSaved(!isSaved); // Toggle UI
        }
    } catch (error) {
        console.log(error);
    }
  };

  return (
    <div className='bg-slate-800 shadow-md hover:shadow-2xl hover:scale-[1.02] transition-all overflow-hidden rounded-2xl w-full sm:w-[330px] border border-slate-700 group relative'>
      <Link to={`/listing/${listing._id}`}>
        <div className='relative overflow-hidden'>
            <img
                src={listing.imageUrls[0] || 'https://via.placeholder.com/500'}
                alt='listing cover'
                className='h-[320px] sm:h-[220px] w-full object-cover group-hover:scale-110 transition-transform duration-500'
            />
            {/* Type Badge */}
            <div className='absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider border border-slate-600 shadow-lg'>
                 {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
            </div>
            {/* Offer Badge */}
            {listing.offer && (
                <div className='absolute top-3 right-12 bg-green-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase shadow-lg'>
                    Offer
                </div>
            )}
            
            {/* ❤️ WISHLIST BUTTON ❤️ */}
            <div 
                onClick={handleWishlist}
                className='absolute top-3 right-3 bg-white p-1.5 rounded-full shadow-lg cursor-pointer hover:bg-gray-100 transition z-10'
            >
                {isSaved ? <FaHeart className='text-red-500 text-sm' /> : <FaRegHeart className='text-gray-500 text-sm' />}
            </div>
        </div>

        <div className='p-4 flex flex-col gap-2 w-full'>
          <p className='truncate text-xl font-bold text-white group-hover:text-indigo-400 transition-colors'>
            {listing.name}
          </p>
          
          <div className='flex items-center gap-1.5'>
            <MdLocationOn className='h-5 w-5 text-indigo-500' />
            <p className='text-sm text-slate-400 truncate w-full font-medium'>
              {listing.address}
            </p>
          </div>

          <p className='text-sm text-slate-500 line-clamp-2 mt-1'>
            {listing.description}
          </p>

          <p className='text-slate-200 mt-3 text-2xl font-extrabold flex items-center'>
            ₹ {listing.offer
              ? listing.discountPrice.toLocaleString('en-IN')
              : listing.regularPrice.toLocaleString('en-IN')}
            {listing.type === 'rent' && <span className='text-sm font-medium text-slate-500 ml-1'> / month</span>}
          </p>

          <div className="h-px bg-slate-700 my-2"></div>

          <div className='text-slate-400 flex gap-6 text-sm font-bold'>
            <div className='flex items-center gap-2'>
              <FaBed className="text-lg text-indigo-500"/>
              {listing.bedrooms > 1 ? `${listing.bedrooms} Beds` : `${listing.bedrooms} Bed`}
            </div>
            <div className='flex items-center gap-2'>
              <FaBath className="text-lg text-indigo-500"/>
              {listing.bathrooms > 1 ? `${listing.bathrooms} Baths` : `${listing.bathrooms} Bath`}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}