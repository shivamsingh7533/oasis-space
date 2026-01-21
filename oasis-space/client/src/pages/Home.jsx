import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import SwiperCore from 'swiper';
import 'swiper/css/bundle';
import ListingItem from '../components/ListingItem';
import { FaSearch } from 'react-icons/fa';

// --- INDUSTRY STANDARD IMPORT ---
// Hum assets folder se image import kar rahe hain.
// '../assets/home.jpg' ka matlab: pages folder se bahar niklo -> assets mein jao
import homeImage from '../assets/home.jpg'; 

export default function Home() {
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  SwiperCore.use([Navigation]);

  useEffect(() => {
    // Fetching logic same rahega...
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
    fetchOfferListings();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('searchTerm', searchTerm);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  return (
    <div className='bg-slate-900 min-h-screen'>
      {/* --- HERO SECTION --- */}
      {/* Background Image Logic: */}
      {/* Humne style={{ backgroundImage: ... }} use kiya hai. */}
      {/* Ye sabse safe tarika hai dynamic imports ke liye. */}
      
      <div 
        className="relative w-full h-[500px] sm:h-[700px] flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${homeImage})` }}
      >
        
        {/* Dark Overlay (Gradient for better text readability) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30 z-10"></div>
        
        {/* Content */}
        <div className="relative z-20 text-center px-4 max-w-6xl mx-auto w-full">
          
          <h1 className="text-4xl sm:text-6xl font-bold text-slate-100 mb-6 drop-shadow-2xl leading-tight">
            Find Your Perfect <span className="text-slate-400">Oasis</span>.
          </h1>
          
          <p className="text-lg sm:text-2xl text-slate-200 mb-8 drop-shadow-lg max-w-2xl mx-auto font-medium">
            Discover a wide range of properties for sale and rent in your ideal location.
          </p>
          
          {/* Search Bar */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center bg-white rounded-full shadow-2xl overflow-hidden w-full max-w-2xl mx-auto transition-transform hover:scale-[1.02] p-1 ring-4 ring-white/20"
          >
            <input
              type="text"
              placeholder="Search for location, property type..."
              className="flex-grow px-6 py-4 text-gray-700 focus:outline-none text-lg bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="bg-slate-800 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <FaSearch className="text-xl" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>
        </div>
      </div>

      {/* --- LISTINGS SECTIONS (Formatting Same) --- */}
      <div className='max-w-6xl mx-auto p-3 flex flex-col gap-8 py-10'>
        {offerListings && offerListings.length > 0 && (
          <div className=''>
            <div className='my-3'>
              <h2 className='text-2xl font-semibold text-slate-200'>Recent offers</h2>
              <Link className='text-sm text-slate-400 hover:text-slate-300 hover:underline' to={'/search?offer=true'}>Show more offers</Link>
            </div>
            <div className='flex flex-wrap gap-4'>
              {offerListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}
        {rentListings && rentListings.length > 0 && (
            <div className=''>
              <div className='my-3'>
                <h2 className='text-2xl font-semibold text-slate-200'>Recent places for rent</h2>
                <Link className='text-sm text-slate-400 hover:text-slate-300 hover:underline' to={'/search?type=rent'}>Show more places for rent</Link>
              </div>
              <div className='flex flex-wrap gap-4'>
                {rentListings.map((listing) => (
                  <ListingItem listing={listing} key={listing._id} />
                ))}
              </div>
            </div>
        )}
        {saleListings && saleListings.length > 0 && (
            <div className=''>
              <div className='my-3'>
                <h2 className='text-2xl font-semibold text-slate-200'>Recent places for sale</h2>
                <Link className='text-sm text-slate-400 hover:text-slate-300 hover:underline' to={'/search?type=sale'}>Show more places for sale</Link>
              </div>
              <div className='flex flex-wrap gap-4'>
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