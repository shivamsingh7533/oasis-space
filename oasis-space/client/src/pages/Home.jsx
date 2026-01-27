import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination } from 'swiper/modules';
import SwiperCore from 'swiper';
import 'swiper/css/bundle';
import ListingItem from '../components/ListingItem';
import { FaSearch } from 'react-icons/fa';

// 🔥 FORCE FIX: ESLint ko ignore karne ke liye ye comment joda hai
// eslint-disable-next-line
import { motion } from 'framer-motion'; 

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
    const fetchFeaturedListings = async () => {
        try {
            const res = await fetch('/api/listing/get?featured=true&limit=4');
            const data = await res.json();
            setFeaturedListings(data);
            fetchOfferListings();
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
    
    fetchFeaturedListings();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('searchTerm', searchTerm);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className='bg-slate-900 min-h-screen text-slate-200'>
      
      {/* --- HERO SECTION --- */}
      <div
        className="relative w-full h-[550px] flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${homeImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10"></div>
        
        <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-20 flex flex-col items-center justify-center text-center px-4 w-full max-w-2xl mx-auto pt-16"
        >
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
              placeholder="Search address, city..."
              className="flex-grow px-5 py-3 text-gray-700 focus:outline-none text-sm sm:text-base bg-transparent placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="bg-[#8EA6C7] text-white px-6 py-3 rounded-full hover:bg-[#7a92b3] transition-colors flex items-center justify-center shadow-md"
            >
              <FaSearch className="text-sm" />
            </button>
          </form>

        </motion.div>
      </div>

      {/* --- FEATURED SLIDER (VIP) --- */}
      {featuredListings && featuredListings.length > 0 && (
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
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
                            style={{
                                background: `url(${listing.imageUrls[0]}) center no-repeat`,
                                backgroundSize: 'cover',
                            }}
                            className='h-full w-full relative group cursor-pointer'
                            onClick={() => navigate(`/listing/${listing._id}`)}
                        >
                            <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent'></div>
                            <div className='absolute bottom-0 left-0 p-6 w-full'>
                                <h3 className='text-white text-2xl font-bold truncate drop-shadow-md'>{listing.name}</h3>
                                <p className='text-[#8EA6C7] font-bold text-lg'>
                                    ₹ {listing.offer ? listing.discountPrice.toLocaleString('en-IN') : listing.regularPrice.toLocaleString('en-IN')}
                                    {listing.type === 'rent' && <span className='text-xs text-gray-300'> / month</span>}
                                </p>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </motion.div>
      )}

      {/* --- LISTINGS SECTIONS --- */}
      <div className='max-w-6xl mx-auto p-4 flex flex-col gap-10 py-10'>
        
        {offerListings && offerListings.length > 0 && (
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <div className='my-3 flex justify-between items-end'>
              <h2 className='text-xl sm:text-2xl font-semibold text-slate-200'>Recent Offers</h2>
              <Link className='text-sm text-[#8EA6C7] hover:text-[#7a92b3] hover:underline' to={'/search?offer=true'}>View All</Link>
            </div>
            <div className='flex flex-wrap gap-6'>
              {offerListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </motion.div>
        )}

        {rentListings && rentListings.length > 0 && (
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className='my-3 flex justify-between items-end'>
                <h2 className='text-xl sm:text-2xl font-semibold text-slate-200'>Places for Rent</h2>
                <Link className='text-sm text-[#8EA6C7] hover:text-[#7a92b3] hover:underline' to={'/search?type=rent'}>View All</Link>
              </div>
              <div className='flex flex-wrap gap-6'>
                {rentListings.map((listing) => (
                  <ListingItem listing={listing} key={listing._id} />
                ))}
              </div>
            </motion.div>
        )}

        {saleListings && saleListings.length > 0 && (
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className='my-3 flex justify-between items-end'>
                <h2 className='text-xl sm:text-2xl font-semibold text-slate-200'>Places for Sale</h2>
                <Link className='text-sm text-[#8EA6C7] hover:text-[#7a92b3] hover:underline' to={'/search?type=sale'}>View All</Link>
              </div>
              <div className='flex flex-wrap gap-6'>
                {saleListings.map((listing) => (
                  <ListingItem listing={listing} key={listing._id} />
                ))}
              </div>
            </motion.div>
        )}
      </div>
    </div>
  );
}