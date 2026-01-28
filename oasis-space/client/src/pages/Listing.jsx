import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FaBath, FaBed, FaChair, FaMapMarkerAlt, FaParking, FaShare, 
  FaCalculator, FaMapMarkedAlt
} from 'react-icons/fa';
import Contact from '../components/Contact';
import EMICalculator from '../components/EMICalculator'; // ✅ Make sure file exists

// ✅ IMPORTS FOR REAL TOUCH SLIDER (Swiper JS)
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Listing() {
  const { listingId } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState(false);
  
  // ✅ NEW: State for EMI Calculator & Map
  const [showEMI, setShowEMI] = useState(false);
  const [showMap, setShowMap] = useState(false); 

  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/listing/get/${listingId}`);
        const data = await res.json();
        if (data.success === false) {
          setError(true);
          setLoading(false);
          return;
        }
        setListing(data);
        setLoading(false);
        setError(false);
      } catch (error) {
        console.log(error); // ✅ Log error to satisfy ESLint
        setError(true);
        setLoading(false);
      }
    };
    fetchListing();
  }, [listingId]);

  return (
    <main className='bg-slate-900 min-h-screen text-slate-200 pb-10'>
      {loading && <p className='text-center my-7 text-2xl'>Loading...</p>}
      {error && (
        <p className='text-center my-7 text-2xl text-red-500'>Something went wrong!</p>
      )}
      
      {listing && !loading && !error && (
        <div className='max-w-6xl mx-auto px-4 pt-6'>
          
          {/* ✅ REAL TOUCH CAROUSEL SLIDER */}
          <div className='relative w-full h-[300px] sm:h-[450px] bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 group'>
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={0}
              slidesPerView={1}
              navigation={{ clickable: true }}
              pagination={{ clickable: true, dynamicBullets: true }}
              loop={true}
              className="h-full w-full rounded-3xl"
            >
              {listing.imageUrls.map((url, index) => (
                <SwiperSlide key={index}>
                   <div className="relative h-full w-full font-sans">
                      <img 
                          src={url} 
                          alt={`property-${index}`} 
                          className='w-full h-full object-cover select-none'
                      />
                       <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none"></div>
                   </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className='absolute top-4 right-4 z-20 border rounded-full w-10 h-10 flex justify-center items-center bg-slate-800/80 cursor-pointer hover:bg-slate-700 transition-all shadow-md'
                onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                }}
            >
                <FaShare className='text-slate-200' />
            </div>
            {copied && (
                <p className='absolute top-16 right-4 z-20 rounded-md bg-green-600 text-white p-2 text-xs font-bold shadow-lg animate-bounce'>
                Link Copied!
                </p>
            )}
          </div>

          <div className='flex flex-col md:flex-row gap-8 mt-8'>
            
            {/* LEFT SIDE: Info */}
            <div className='flex-1'>
                {/* Badges */}
                <div className='flex items-center gap-4 mb-2'>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${listing.type === 'rent' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                        For {listing.type === 'rent' ? 'Rent' : 'Sale'}
                    </span>
                    {listing.offer && (
                        <span className='px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-blue-500/20 text-blue-400'>
                            Special Offer
                        </span>
                    )}
                </div>

                <h1 className='text-3xl font-bold mb-2 text-white'>
                    {listing.name}
                </h1>
                
                <p className='flex items-center gap-2 text-slate-400 text-sm mb-6'>
                    <FaMapMarkerAlt className='text-green-500' />
                    {listing.address}
                </p>

                {/* Price */}
                <div className='flex items-center gap-4 mb-6'>
                    <p className='text-3xl font-bold text-blue-400'>
                        ₹{' '}
                        {listing.offer
                        ? listing.discountPrice.toLocaleString('en-IN')
                        : listing.regularPrice.toLocaleString('en-IN')}
                        {listing.type === 'rent' && <span className='text-lg text-slate-500 font-normal'> / month</span>}
                    </p>
                    {listing.offer && (
                        <p className='text-slate-500 line-through text-lg'>
                            ₹{listing.regularPrice.toLocaleString('en-IN')}
                        </p>
                    )}
                </div>

                {/* ✅ DISTINCT ACTION BUTTONS (Map & Mortgage) */}
                <div className='flex flex-wrap gap-4 mb-6'>
                    {/* Button 1: Location Map */}
                    <button 
                        onClick={() => setShowMap(!showMap)}
                        className='flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg'
                    >
                        <FaMapMarkedAlt />
                        {showMap ? 'Hide Map' : 'View on Map'}
                    </button>

                    {/* Button 2: EMI Calculator */}
                    <button 
                        onClick={() => setShowEMI(!showEMI)}
                        className='flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg'
                    >
                        <FaCalculator />
                        {showEMI ? 'Hide Calculator' : 'Calculate EMI'}
                    </button>
                </div>

                {/* EMI CALCULATOR SECTION */}
                {showEMI && (
                    <div className="mb-6 animate-fadeIn">
                        <EMICalculator price={listing.offer ? listing.discountPrice : listing.regularPrice} />
                    </div>
                )}

                {/* MAP SECTION (Placeholder logic - replace with Leaflet component if you have it) */}
                {showMap && (
                    <div className="bg-slate-800 p-4 rounded-2xl mb-6 border border-slate-700 h-[300px] flex items-center justify-center">
                         {/* Yahan apna Leaflet Map Component daalein */}
                         <p className="text-slate-400">Map will be displayed here (Leaflet Integration)</p>
                    </div>
                )}

                {/* Description */}
                <div className='bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm mb-6'>
                    <p className='text-slate-300 leading-relaxed'>
                        <span className='font-bold text-white block mb-2'>Description</span>
                        {listing.description}
                    </p>
                </div>

                {/* Features */}
                <ul className='grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-semibold text-slate-300'>
                    <li className='flex items-center gap-2 bg-slate-800 p-3 rounded-xl border border-slate-700'>
                        <FaBed className='text-blue-500 text-lg' />
                        {listing.bedrooms > 1 ? `${listing.bedrooms} Beds` : `${listing.bedrooms} Bed`}
                    </li>
                    <li className='flex items-center gap-2 bg-slate-800 p-3 rounded-xl border border-slate-700'>
                        <FaBath className='text-blue-500 text-lg' />
                        {listing.bathrooms > 1 ? `${listing.bathrooms} Baths` : `${listing.bathrooms} Bath`}
                    </li>
                    <li className='flex items-center gap-2 bg-slate-800 p-3 rounded-xl border border-slate-700'>
                        <FaParking className='text-blue-500 text-lg' />
                        {listing.parking ? 'Parking Spot' : 'No Parking'}
                    </li>
                    <li className='flex items-center gap-2 bg-slate-800 p-3 rounded-xl border border-slate-700'>
                        <FaChair className='text-blue-500 text-lg' />
                        {listing.furnished ? 'Furnished' : 'Unfurnished'}
                    </li>
                </ul>
            </div>

            {/* RIGHT SIDE: Contact Box */}
            <div className='md:w-[350px]'>
                <div className='bg-slate-800 p-6 rounded-2xl border border-slate-700 sticky top-24 shadow-xl'>
                    <h3 className='text-xl font-bold mb-4 text-white border-b border-slate-700 pb-3'>Owner Details</h3>
                    
                    {currentUser && listing.userRef !== currentUser._id && !contact && (
                        <button
                        onClick={() => setContact(true)}
                        className='bg-blue-600 hover:bg-blue-700 text-white rounded-xl uppercase hover:opacity-95 p-3 w-full font-bold transition-all shadow-lg shadow-blue-900/20'
                        >
                        Contact Landlord
                        </button>
                    )}
                    
                    {contact && <Contact listing={listing} />}
                    
                    {!currentUser && (
                         <p className='text-sm text-red-400 mt-2 text-center bg-red-500/10 p-2 rounded-lg'>
                            Please Login to contact the owner.
                         </p>
                    )}

                    {listing.userRef === currentUser?._id && (
                        <p className='text-sm text-green-400 mt-2 text-center bg-green-500/10 p-2 rounded-lg font-bold'>
                            You own this property.
                        </p>
                    )}
                </div>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}