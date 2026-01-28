import { Link } from 'react-router-dom';
import { MdLocationOn } from 'react-icons/md';
import { FaBed, FaBath, FaHeart, FaRegHeart } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserSuccess } from '../redux/user/userSlice';

export default function ListingItem({ listing }) {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // Redux se check karein ki property saved hai ya nahi
  const isSaved = currentUser?.savedListings?.includes(listing._id);

  const handleWishlist = async (e) => {
    e.preventDefault(); // Prevent Link navigation
    if (!currentUser) return alert("Please Login to Wishlist!");

    try {
        const res = await fetch(`/api/user/save/${listing._id}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        // ✅ FIX: 'const data =' hata diya.
        // Hum bas wait kar rahe hain request poori hone ka.
        await res.json(); 
        
        if(res.ok) {
            // Update Redux directly
            let updatedSavedListings;
            
            if (isSaved) {
                updatedSavedListings = currentUser.savedListings.filter(id => id !== listing._id);
            } else {
                updatedSavedListings = [...currentUser.savedListings, listing._id];
            }

            dispatch(updateUserSuccess({
                ...currentUser,
                savedListings: updatedSavedListings
            }));
        }
    } catch (error) {
        console.log(error);
    }
  };

  return (
    <div className='bg-slate-800 border border-slate-700 shadow-md hover:shadow-2xl transition-all overflow-hidden rounded-2xl w-full sm:w-[300px] group relative'>
      <Link to={`/listing/${listing._id}`}>
        
        {/* IMAGE SECTION */}
        <div className='relative overflow-hidden h-[180px]'>
          <img
            src={listing.imageUrls[0] || 'https://via.placeholder.com/500'}
            alt='listing cover'
            className='h-full w-full object-cover group-hover:scale-110 transition-transform duration-500'
          />
          
          <div className='absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-slate-600 shadow-sm'>
             {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
          </div>

          {listing.offer && (
            <div className='absolute top-3 left-20 bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm'>
               Offer
            </div>
          )}

          {/* ❤️ WISHLIST BUTTON */}
          <div 
             onClick={handleWishlist}
             className='absolute top-3 right-3 bg-white/90 p-1.5 rounded-full shadow-lg cursor-pointer hover:bg-white transition z-10'
          >
             {isSaved ? <FaHeart className='text-red-500 text-sm' /> : <FaRegHeart className='text-gray-500 text-sm' />}
          </div>
        </div>

        {/* CONTENT SECTION */}
        <div className='p-4 flex flex-col gap-2 w-full'>
          
          <h3 className='truncate text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors'>
            {listing.name}
          </h3>
          
          <div className='flex items-center gap-1.5'>
            <MdLocationOn className='h-4 w-4 text-green-500' />
            <p className='text-xs text-slate-400 truncate w-full font-medium'>
              {listing.address}
            </p>
          </div>
          
          <p className='text-xs text-slate-500 line-clamp-2 leading-relaxed'>
            {listing.description}
          </p>
          
          <div className='flex items-center justify-between mt-1'>
              <p className='text-white font-bold text-lg'>
                ₹ {listing.offer 
                    ? listing.discountPrice.toLocaleString('en-IN') 
                    : listing.regularPrice.toLocaleString('en-IN')}
                {listing.type === 'rent' && <span className='text-xs font-normal text-slate-400'> / mo</span>}
              </p>
          </div>

          <div className='flex gap-4 text-slate-400 text-xs mt-1 border-t border-slate-700/50 pt-3'>
             <div className='flex items-center gap-1.5'>
                <FaBed className="text-blue-500"/> 
                <span className="font-bold text-slate-300">{listing.bedrooms} Beds</span>
             </div>
             <div className='flex items-center gap-1.5'>
                <FaBath className="text-blue-500"/> 
                <span className="font-bold text-slate-300">{listing.bathrooms} Baths</span>
             </div>
          </div>

        </div>
      </Link>
    </div>
  );
}