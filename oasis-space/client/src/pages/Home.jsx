import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination } from 'swiper/modules';
import SwiperCore from 'swiper';
import 'swiper/css/bundle';
import ListingItem from '../components/ListingItem';
import { FaSearch } from 'react-icons/fa';

// --- IMAGE IMPORT ---
import homeImage from '../assets/home.jpg';

export default function Home() {
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  SwiperCore.use([Navigation, Autoplay, Pagination]);

  useEffect(() => {
    // 1. Fetch Featured Listings (VIP) 🌟
    const fetchFeaturedListings = async () => {
        try {
            const res = await fetch('/api/listing/get?featured=true&limit=4');
            const data = await res.json();
            setFeaturedListings(data);
            fetchOfferListings(); // Chain calls
        } catch (error) {
            console.log(error);
            fetchOfferListings();
        }
    };

    const fetchOfferListings = async () => {
      try {
        const res = await fetch('/api/listing/get?offer=true&limit=4');
        const data = await res.json();
        setOfferListings(data);
        fetchRentListings();
      } catch (error) {
        console.log(error);
      }
    };
    const fetchRentListings = async () => {
      try {
        const res = await fetch('/api/listing/get?type=rent&limit=4');
        const data = await res.json();
        setRentListings(data);
        fetchSaleListings();
      } catch (error) {
        console.log(error);
      }
    };
    const fetchSaleListings = async () => {
      try {
        const res = await fetch('/api/listing/get?type=sale&limit=4');
        const data = await res.json();
        setSaleListings(data);
      } catch (error) {
        console.log(error);
      }
    };
    
    // Start Fetching
    fetchFeaturedListings();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('searchTerm', searchTerm);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  return (
    <div className='bg-slate-900 min-h-screen text-slate-200'>
      {/* --- HERO SECTION --- */}
      <div
        className="relative w-full h-[450px] sm:h-[600px] flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${homeImage})` }}
      >
        
        {/* Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-black/50 to-black/10 z-10"></div>
        
        <div className="relative z-20 text-center px-4 max-w-6xl mx-auto w-full flex flex-col items-center justify-center h-full">
          
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-100 mb-4 drop-shadow-2xl leading-tight">
            Find Your Perfect <span className="text-blue-500">Oasis</span>.
          </h1>
          
          <p className="text-sm sm:text-lg text-slate-200 mb-8 drop-shadow-lg max-w-xl mx-auto font-medium">
            Discover a wide range of properties for sale and rent in your ideal location.
          </p>
          
          {/* Search Bar */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center bg-white rounded-full shadow-2xl overflow-hidden w-full max-w-lg mx-auto transition-transform hover:scale-[1.02] p-1 ring-4 ring-white/20"
          >
            <input
              type="text"
              placeholder="Search..."
              className="flex-grow px-4 py-2.5 text-gray-700 focus:outline-none text-sm sm:text-base bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold text-sm sm:text-base hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <FaSearch className="text-sm" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>
        </div>
      </div>

      {/* --- FEATURED SLIDER (VIP) 🌟 --- */}
      {featuredListings && featuredListings.length > 0 && (
        <div className='max-w-6xl mx-auto pt-10 px-3'>
             <div className='my-3'>
                <h2 className='text-2xl font-semibold text-slate-200 flex items-center gap-2'>
                    🔥 Featured Properties
                    <span className='text-xs bg-yellow-500 text-black px-2 py-0.5 rounded font-bold'>VIP</span>
                </h2>
             </div>
             {/* ✅ FIX: Responsive Height (Mobile: 260px, Tablet: 350px, Desktop: 450px) */}
             <Swiper
                navigation
                autoplay={{ delay: 3500, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                className='h-[260px] sm:h-[350px] md:h-[450px] rounded-2xl overflow-hidden shadow-2xl border border-slate-700'
             >
                {featuredListings.map((listing) => (
                    <SwiperSlide key={listing._id}>
                        <div
                            style={{
                                background: `url(${listing.imageUrls[0]}) center no-repeat`,
                                backgroundSize: 'cover',
                            }}
                            className='h-full w-full relative group'
                        >
                            <div className='absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent'></div>
                            <div className='absolute bottom-0 left-0 p-4 sm:p-6 w-full'>
                                <h3 className='text-white text-xl sm:text-2xl font-bold drop-shadow-md truncate'>{listing.name}</h3>
                                <p className='text-slate-200 font-medium text-sm sm:text-base'>
                                    ${listing.offer ? listing.discountPrice.toLocaleString() : listing.regularPrice.toLocaleString()}
                                    {listing.type === 'rent' && ' / month'}
                                </p>
                                <Link to={`/listing/${listing._id}`} className='inline-block mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded shadow-lg transition'>
                                    View Details
                                </Link>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
      )}

      {/* --- LISTINGS SECTIONS --- */}
      <div className='max-w-6xl mx-auto p-3 flex flex-col gap-8 py-10'>
        {offerListings && offerListings.length > 0 && (
          <div className=''>
            <div className='my-3'>
              <h2 className='text-xl sm:text-2xl font-semibold text-slate-200'>Recent offers</h2>
              <Link className='text-sm text-slate-400 hover:text-blue-400 hover:underline' to={'/search?offer=true'}>Show more offers</Link>
            </div>
            <div className='flex flex-wrap gap-6'>
              {offerListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}
        {rentListings && rentListings.length > 0 && (
            <div className=''>
              <div className='my-3'>
                <h2 className='text-xl sm:text-2xl font-semibold text-slate-200'>Recent places for rent</h2>
                <Link className='text-sm text-slate-400 hover:text-blue-400 hover:underline' to={'/search?type=rent'}>Show more places for rent</Link>
              </div>
              <div className='flex flex-wrap gap-6'>
                {rentListings.map((listing) => (
                  <ListingItem listing={listing} key={listing._id} />
                ))}
              </div>
            </div>
        )}
        {saleListings && saleListings.length > 0 && (
            <div className=''>
              <div className='my-3'>
                <h2 className='text-xl sm:text-2xl font-semibold text-slate-200'>Recent places for sale</h2>
                <Link className='text-sm text-slate-400 hover:text-blue-400 hover:underline' to={'/search?type=sale'}>Show more places for sale</Link>
              </div>
              <div className='flex flex-wrap gap-6'>
                {saleListings.map((listing) => (
                  <ListingItem listing={listing} key={listing._id} />
                ))}
              </div>
            </div>
        )}
      </div>
    </div>
  );
}