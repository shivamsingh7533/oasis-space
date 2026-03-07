import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination } from 'swiper/modules';
import SwiperCore from 'swiper';
import 'swiper/css/bundle';
import ListingItem from '../components/ListingItem';
import { FaSearch } from 'react-icons/fa';

// No framer-motion needed.

// (Hero image is now loaded from /home.jpg in public for LCP preloading)

export default function Home() {
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  SwiperCore.use([Navigation, Autoplay, Pagination]);

  useEffect(() => {
    const fetchAllListings = async () => {
      try {
        const featuredRes = await fetch('/api/listing/get?featured=true&limit=9');
        if (featuredRes.ok) setFeaturedListings(await featuredRes.json());

        const offerRes = await fetch('/api/listing/get?offer=true&limit=9');
        if (offerRes.ok) setOfferListings(await offerRes.json());

        const rentRes = await fetch('/api/listing/get?type=rent&limit=9');
        if (rentRes.ok) setRentListings(await rentRes.json());

        const saleRes = await fetch('/api/listing/get?type=sale&limit=9');
        if (saleRes.ok) setSaleListings(await saleRes.json());
      } catch (error) {
        console.log('Error fetching listings:', error);
      }
    };
    fetchAllListings();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('searchTerm', searchTerm);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  // Animations removed for maximum mobile performance

  return (
    <div className='bg-slate-900 min-h-screen text-slate-200'>

      {/* --- HERO SECTION --- */}
      <div className="relative w-full h-[550px] flex flex-col items-center justify-center overflow-hidden">

        {/* LCP PRIORITY IMAGE (Replaces background-image for instant loading, WebP Compressed) */}
        <img
          src="/home.webp"
          alt="Beautiful Home Exterior"
          width="1280"
          height="550"
          className="absolute inset-0 w-full h-full object-cover z-0"
          fetchpriority="high"
          decoding="async"
          loading="eager"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/60 z-10"></div>

        <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 w-full max-w-2xl mx-auto pt-16">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-4 drop-shadow-2xl leading-tight">
            Find Your Perfect
            <span className="text-[#8EA6C7] ml-3">Oasis</span>
          </h1>

          <p className="text-gray-200 text-sm sm:text-lg mb-8 font-medium drop-shadow-md">
            Discover the best properties for sale and rent in your dream location.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex items-center bg-white rounded-full shadow-2xl overflow-hidden w-full p-1 ring-4 ring-white/10"
          >
            <input
              type="text"
              id="homeSearchTerm"
              aria-label="Search address, city..."
              placeholder="Search address, city..."
              className="flex-grow px-5 py-3 text-gray-700 focus:outline-none text-sm sm:text-base bg-transparent placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              aria-label="Search"
              className="bg-[#8EA6C7] text-white px-6 py-3 rounded-full hover:bg-[#7a92b3] transition-colors flex items-center justify-center shadow-md focus:outline-none"
            >
              <FaSearch className="text-sm" />
            </button>
          </form>

        </div>
      </div>

      {/* --- FEATURED SLIDER (VIP) --- */}
      {featuredListings && featuredListings.length > 0 && (
        <div
          className='max-w-6xl mx-auto pt-10 px-4'
        >
          <div className='my-3 flex items-center gap-2 mb-5'>
            <h2 className='text-2xl font-bold text-slate-100'>Featured Properties</h2>
            <span className='text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded-full font-extrabold tracking-wider'>VIP</span>
          </div>

          <Swiper
            navigation
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            className='h-[280px] sm:h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-slate-700'
          >
            {featuredListings.map((listing) => (
              <SwiperSlide key={listing._id}>
                <div
                  className='h-full w-full relative group cursor-pointer'
                  onClick={() => navigate(`/listing/${listing._id}`)}
                >
                  {/* EXPLICT LAZY LOAD IMAGE instead of CSS Background */}
                  <img
                    src={`https://wsrv.nl/?url=${encodeURIComponent(listing.imageUrls[0])}&output=webp&w=600&q=80`}
                    alt={listing.name}
                    width="600"
                    height="400"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent z-10'></div>
                  <div className='absolute bottom-0 left-0 p-6 w-full z-20 bg-black/80 backdrop-blur-sm'>
                    <p className='text-white text-2xl font-bold truncate drop-shadow-md'>{listing.name}</p>
                    <p className='text-[#8EA6C7] font-bold text-lg'>
                      ₹ {listing.offer ? listing.discountPrice.toLocaleString('en-IN') : listing.regularPrice.toLocaleString('en-IN')}
                      {listing.type === 'rent' && <span className='text-xs text-gray-300'> / month</span>}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* --- LISTINGS SECTIONS --- */}
      <div className='max-w-6xl mx-auto p-4 flex flex-col gap-10 py-10'>

        {/* RECENT OFFERS */}
        {offerListings && offerListings.length > 0 && (
          <div>
            <div className='my-3 flex justify-between items-end'>
              <h2 className='text-xl sm:text-2xl font-semibold text-slate-200'>Recent Offers</h2>
              <Link className='text-sm text-[#8EA6C7] hover:text-[#7a92b3] hover:underline' to={'/search?offer=true'}>View All</Link>
            </div>
            <div className='flex flex-wrap gap-6'>
              {offerListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}

        {/* RENT LISTINGS */}
        {rentListings && rentListings.length > 0 && (
          <div>
            <div className='my-3 flex justify-between items-end'>
              <h2 className='text-xl sm:text-2xl font-semibold text-slate-200'>Places for Rent</h2>
              <Link className='text-sm text-[#8EA6C7] hover:text-[#7a92b3] hover:underline' to={'/search?type=rent'}>View All</Link>
            </div>
            <div className='flex flex-wrap gap-6'>
              {rentListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}

        {/* SALE LISTINGS */}
        {saleListings && saleListings.length > 0 && (
          <div>
            <div className='my-3 flex justify-between items-end'>
              <h2 className='text-xl sm:text-2xl font-semibold text-slate-200'>Places for Sale</h2>
              <Link className='text-sm text-[#8EA6C7] hover:text-[#7a92b3] hover:underline' to={'/search?type=sale'}>View All</Link>
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