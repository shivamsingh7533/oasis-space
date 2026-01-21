import { Link } from 'react-router-dom';
import { MdLocationOn } from 'react-icons/md';

export default function ListingItem({ listing }) {
  return (
    // CHANGE 1: Width thodi kam ki (sm:w-[330px] -> sm:w-[280px]) taaki card compact lage
    <div className='bg-slate-800 shadow-md hover:shadow-lg transition-shadow overflow-hidden rounded-lg w-full sm:w-[280px]'>
      <Link to={`/listing/${listing._id}`}>
        <img
          src={
            listing.imageUrls[0] ||
            'https://53.fs1.hubspotusercontent-na1.net/hub/53/hubfs/Sales_Blog/real-estate-business-compressor.jpg?width=595&height=400&name=real-estate-business-compressor.jpg'
          }
          alt='listing cover'
          // CHANGE 2: Image Height kam ki (h-[320px] -> h-[180px])
          className='h-[180px] sm:h-[180px] w-full object-cover hover:scale-105 transition-scale duration-300'
        />
        
        {/* CHANGE 3: Padding kam ki (p-3 -> p-2) */}
        <div className='p-2 flex flex-col gap-2 w-full'>
          <p className='truncate text-lg font-semibold text-white'>
            {listing.name}
          </p>
          <div className='flex items-center gap-1'>
            <MdLocationOn className='h-4 w-4 text-green-400' />
            <p className='text-sm text-slate-300 truncate w-full'>
              {listing.address}
            </p>
          </div>
          <p className='text-sm text-slate-400 line-clamp-2'>
            {listing.description}
          </p>
          <p className='text-slate-200 mt-2 font-semibold '>
            $
            {listing.offer
              ? listing.discountPrice.toLocaleString('en-US')
              : listing.regularPrice.toLocaleString('en-US')}
            {listing.type === 'rent' && ' / month'}
          </p>
          <div className='text-slate-300 flex gap-4'>
            <div className='font-bold text-xs'>
              {listing.bedrooms > 1
                ? `${listing.bedrooms} beds `
                : `${listing.bedrooms} bed `}
            </div>
            <div className='font-bold text-xs'>
              {listing.bathrooms > 1
                ? `${listing.bathrooms} baths `
                : `${listing.bathrooms} bath `}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}