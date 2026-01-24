import { Link } from 'react-router-dom';
import { MdLocationOn } from 'react-icons/md';
import { FaBed, FaBath } from 'react-icons/fa';

export default function ListingItem({ listing }) {
  return (
    <div className='bg-slate-800 shadow-md hover:shadow-2xl hover:scale-[1.02] transition-all overflow-hidden rounded-2xl w-full sm:w-[330px] border border-slate-700 group'>
      <Link to={`/listing/${listing._id}`}>
        <div className='relative overflow-hidden'>
            <img
                src={
                listing.imageUrls[0] ||
                'https://53.fs1.hubspotusercontent-na1.net/hub/53/hubfs/Sales_Blog/real-estate-business-compressor.jpg?width=595&height=400&name=real-estate-business-compressor.jpg'
                }
                alt='listing cover'
                className='h-[320px] sm:h-[220px] w-full object-cover group-hover:scale-110 transition-transform duration-500'
            />
            {/* Type Badge */}
            <div className='absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider border border-slate-600 shadow-lg'>
                 {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
            </div>
            {/* Offer Badge (if applicable) */}
            {listing.offer && (
                <div className='absolute top-3 right-3 bg-green-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase shadow-lg'>
                    Offer
                </div>
            )}
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
            {/* ✅ CHANGED: Currency to ₹ and Format to Indian System */}
            ₹ {listing.offer
              ? listing.discountPrice.toLocaleString('en-IN')
              : listing.regularPrice.toLocaleString('en-IN')}
            {listing.type === 'rent' && <span className='text-sm font-medium text-slate-500 ml-1'> / month</span>}
          </p>

          {/* Divider */}
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