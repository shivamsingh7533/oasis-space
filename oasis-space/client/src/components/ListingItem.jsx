import { Link } from 'react-router-dom';
import { MdLocationOn, MdStar } from 'react-icons/md'; // Star Icon added
import { useSelector } from 'react-redux';
import { useState } from 'react';
import AuthModal from './AuthModal';

export default function ListingItem({ listing }) {
  const { currentUser } = useSelector((state) => state.user);
  const [showModal, setShowModal] = useState(false);

  const handleCardClick = (e) => {
    if (!currentUser) {
      e.preventDefault();
      setShowModal(true);
    }
  };

  return (
    <>
      <div className='bg-slate-800 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden rounded-xl w-full sm:w-[280px] border border-slate-700 group relative'>
        
        <Link 
          to={`/listing/${listing._id}`} 
          onClick={handleCardClick}
        >
          {/* --- 1. FEATURED BADGE (VIP) 🌟 --- */}
          {listing.featured && (
            <div className='absolute top-2 left-2 z-10 bg-yellow-500 text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow-md flex items-center gap-1 uppercase tracking-wider'>
                <MdStar className='text-sm' /> Featured
            </div>
          )}

          {/* --- 2. OFFER BADGE (Savings) 💰 --- */}
          {listing.offer && (
             <div className='absolute top-2 right-2 z-10 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase'>
                Save ${(+listing.regularPrice - +listing.discountPrice).toLocaleString()}
             </div>
          )}

          <img
            src={
              listing.imageUrls[0] ||
              'https://53.fs1.hubspotusercontent-na1.net/hub/53/hubfs/Sales_Blog/real-estate-business-compressor.jpg?width=595&height=400&name=real-estate-business-compressor.jpg'
            }
            alt='listing cover'
            className='h-[180px] sm:h-[180px] w-full object-cover group-hover:scale-105 transition-scale duration-300'
          />
          
          <div className='p-3 flex flex-col gap-2 w-full'>
            <p className='truncate text-lg font-semibold text-slate-100 group-hover:text-blue-400 transition-colors'>
              {listing.name}
            </p>
            
            <div className='flex items-center gap-1'>
              <MdLocationOn className='h-4 w-4 text-green-400' />
              <p className='text-sm text-slate-400 truncate w-full'>
                {listing.address}
              </p>
            </div>
            
            <p className='text-sm text-slate-400 line-clamp-2'>
              {listing.description}
            </p>
            
            <p className='text-slate-200 mt-2 font-semibold flex items-center gap-1'>
              <span className='text-lg'>
                  $
                  {listing.offer
                    ? listing.discountPrice.toLocaleString('en-US')
                    : listing.regularPrice.toLocaleString('en-US')}
              </span>
              <span className='text-xs text-slate-400 font-normal'>
                  {listing.type === 'rent' && ' / month'}
              </span>
            </p>
            
            <div className='text-slate-300 flex gap-4 mt-1 border-t border-slate-700 pt-2'>
              <div className='font-bold text-xs flex items-center gap-1'>
                🛏️ {listing.bedrooms > 1
                  ? `${listing.bedrooms} Beds `
                  : `${listing.bedrooms} Bed `}
              </div>
              <div className='font-bold text-xs flex items-center gap-1'>
                🛁 {listing.bathrooms > 1
                  ? `${listing.bathrooms} Baths `
                  : `${listing.bathrooms} Bath `}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}