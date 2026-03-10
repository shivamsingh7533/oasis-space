import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    FaBath, FaBed, FaChair, FaMapMarkerAlt, FaParking, FaShare,
    FaCalculator, FaMapMarkedAlt, FaCrosshairs, FaImage
} from 'react-icons/fa';
import Contact from '../components/Contact';
import EMICalculator from '../components/EMICalculator';
import RazorpayBtn from '../components/RazorpayBtn';

// IMPORTS FOR SLIDER
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// IMPORTS FOR MAP
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet default marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// INTERNAL COMPONENT: Recenter Button Logic
function RecenterMapBtn({ lat, lng }) {
    const map = useMap();

    const handleRecenter = () => {
        map.flyTo([lat, lng], 13, {
            animate: true,
            duration: 1.5
        });
    };

    return (
        <button
            onClick={handleRecenter}
            className="absolute top-4 right-4 z-[1000] bg-white text-slate-800 p-2 rounded-lg shadow-xl border-2 border-slate-300 hover:bg-slate-100 hover:text-blue-600 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            title="Reset Map View"
        >
            <FaCrosshairs className="text-sm" /> Recenter
        </button>
    );
}

// ✅ INTERNAL COMPONENT: Enhanced Image for Slider (Smart Loading + HD Filter)
const EnhancedSwiperImage = ({ url, index, label }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    return (
        <div className="relative h-full w-full font-sans bg-slate-800">
            {/* Loader Skeleton */}
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800 animate-pulse z-0">
                    <FaImage className="text-slate-600 text-5xl opacity-50" />
                </div>
            )}

            <img
                src={error ? 'https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_1280.jpg' : url}
                alt={`property-${index}`}
                loading={index === 0 ? "eager" : "lazy"}
                onLoad={() => setLoaded(true)}
                onError={() => { setError(true); setLoaded(true); }}
                // ✅ CHANGE: Added 'hd-image' class here
                className={`w-full h-full object-cover select-none transition-opacity duration-700 ease-in-out ${loaded ? 'opacity-100 hd-image' : 'opacity-0'}`}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>

            {/* Image Label */}
            {label && (
                <div className="absolute bottom-8 left-8 bg-black/50 backdrop-blur-md text-white px-5 py-2 rounded-xl border border-white/20 shadow-xl z-10 animate-fadeIn">
                    <p className="font-bold tracking-wider uppercase text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                        {label}
                    </p>
                </div>
            )}
        </div>
    );
};

export default function Listing() {
    const { listingId } = useParams();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [copied, setCopied] = useState(false);
    const [contact, setContact] = useState(false);

    const [showEMI, setShowEMI] = useState(false);
    const [showMap, setShowMap] = useState(false);

    // Slider state for thumbnails
    const [swiperInstance, setSwiperInstance] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);

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
                console.log(error);
                setError(true);
                setLoading(false);
            }
        };
        fetchListing();
    }, [listingId]);

    // DEFINE COORDINATES
    const lat = listing?.geolocation?.lat || 20.5937;
    const lng = listing?.geolocation?.lng || 78.9629;

    return (
        <main className='bg-slate-900 min-h-screen text-slate-200 pb-10'>
            {loading && <p className='text-center my-7 text-2xl'>Loading...</p>}
            {error && (
                <p className='text-center my-7 text-2xl text-red-500'>Something went wrong!</p>
            )}

            {listing && !loading && !error && (
                <div className='max-w-6xl mx-auto px-4 pt-6'>

                    {/* Main Content Layout container */}
                    <div className='flex flex-col lg:flex-row gap-8 mt-6'>

                        {/* LEFT SIDE: Image Gallery (60%) */}
                        <div className="lg:w-3/5 w-full">
                            <div className='relative w-full h-[300px] sm:h-[400px] md:h-[500px] z-10'>
                                <Swiper
                                    modules={[Navigation, Pagination]}
                                    navigation={{ clickable: true }}
                                    pagination={{ clickable: true, dynamicBullets: true }}
                                    loop={true}
                                    onSwiper={setSwiperInstance}
                                    onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
                                    className="h-full w-full rounded-3xl shadow-lg border border-slate-700/50"
                                >
                                    {listing.imageUrls.map((url, index) => (
                                        <SwiperSlide key={index}>
                                            <EnhancedSwiperImage
                                                url={url}
                                                index={index}
                                                label={listing.imageLabels ? listing.imageLabels[index] : null}
                                            />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>

                                {/* Share Button */}
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

                            {/* THUMBNAIL GALLERY (like e-commerce sites) */}
                            {listing.imageUrls.length > 1 && (
                                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 custom-scrollbar">
                                    {listing.imageUrls.map((url, index) => (
                                        <div
                                            key={index}
                                            onClick={() => swiperInstance?.slideToLoop(index)}
                                            className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${activeIndex === index
                                                    ? 'border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] opacity-100 scale-105'
                                                    : 'border-transparent opacity-50 hover:opacity-100 hover:scale-95 bg-slate-800'
                                                }`}
                                        >
                                            <img src={url} alt={`thumbnail-${index}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* MAP SECTION moved under image gallery on desktop */}
                            {showMap && (
                                <div className="h-[400px] w-full bg-slate-800 rounded-2xl mt-6 overflow-hidden border border-slate-700 shadow-xl z-10 relative">
                                    <MapContainer
                                        center={[lat, lng]}
                                        zoom={13}
                                        scrollWheelZoom={false}
                                        className="h-full w-full"
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        {listing.geolocation?.lat && listing.geolocation?.lng && (
                                            <Marker position={[lat, lng]}>
                                                <Popup>
                                                    <div className='text-slate-900 font-bold'>
                                                        {listing.name} <br />
                                                        <span className='font-normal text-xs'>{listing.address}</span>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        )}
                                        <RecenterMapBtn lat={lat} lng={lng} />
                                    </MapContainer>
                                </div>
                            )}

                        </div>

                        {/* RIGHT SIDE: Details & Contact (40%) */}
                        <div className="lg:w-2/5 w-full flex flex-col gap-6">

                            <div className='bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 shadow-md'>
                                <div className='flex items-center gap-3 mb-4'>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${listing.type === 'rent' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                                        For {listing.type === 'rent' ? 'Rent' : 'Sale'}
                                    </span>
                                    {listing.offer && (
                                        <span className='px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-blue-500/20 text-blue-400 border border-blue-500/30'>
                                            Special Offer
                                        </span>
                                    )}
                                </div>

                                <h1 className='text-3xl lg:text-4xl font-extrabold mb-2 text-white leading-tight'>
                                    {listing.name}
                                </h1>

                                <p className='flex items-center gap-2 text-slate-400 text-sm mb-6'>
                                    <FaMapMarkerAlt className='text-green-500' />
                                    {listing.address}
                                </p>

                                <div className='flex items-end gap-3 mb-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50'>
                                    <p className='text-4xl font-black text-blue-400'>
                                        ₹{' '}
                                        {listing.offer
                                            ? listing.discountPrice.toLocaleString('en-IN')
                                            : listing.regularPrice.toLocaleString('en-IN')}
                                        {listing.type === 'rent' && <span className='text-lg text-slate-500 font-normal'> / month</span>}
                                    </p>
                                    {listing.offer && (
                                        <p className='text-slate-500 line-through text-lg font-semibold mb-1'>
                                            ₹{listing.regularPrice.toLocaleString('en-IN')}
                                        </p>
                                    )}
                                </div>

                                <ul className='grid grid-cols-2 gap-3 text-sm font-semibold text-slate-300 mb-6'>
                                    <li className='flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-700/50'>
                                        <div className="bg-blue-500/10 p-2 rounded-lg"><FaBed className='text-blue-500 text-lg' /></div>
                                        {listing.bedrooms > 1 ? `${listing.bedrooms} Beds` : `${listing.bedrooms} Bed`}
                                    </li>
                                    <li className='flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-700/50'>
                                        <div className="bg-blue-500/10 p-2 rounded-lg"><FaBath className='text-blue-500 text-lg' /></div>
                                        {listing.bathrooms > 1 ? `${listing.bathrooms} Baths` : `${listing.bathrooms} Bath`}
                                    </li>
                                    <li className='flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-700/50'>
                                        <div className="bg-blue-500/10 p-2 rounded-lg"><FaParking className='text-blue-500 text-lg' /></div>
                                        {listing.parking ? 'Parking' : 'No Parking'}
                                    </li>
                                    <li className='flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-700/50'>
                                        <div className="bg-blue-500/10 p-2 rounded-lg"><FaChair className='text-blue-500 text-lg' /></div>
                                        {listing.furnished ? 'Furnished' : 'Unfurnished'}
                                    </li>
                                </ul>

                                {/* ACTION BUTTONS */}
                                <div className='flex flex-wrap gap-3 mb-2'>
                                    <button
                                        onClick={() => setShowMap(!showMap)}
                                        className='flex-1 flex justify-center items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-xl font-bold transition-all border border-slate-600 hover:border-slate-500'
                                    >
                                        <FaMapMarkedAlt />
                                        {showMap ? 'Hide Map' : 'View Map'}
                                    </button>

                                    {listing.type === 'sale' && (
                                        <button
                                            onClick={() => setShowEMI(!showEMI)}
                                            className='flex-1 flex justify-center items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-xl font-bold transition-all border border-slate-600 hover:border-slate-500'
                                        >
                                            <FaCalculator />
                                            {showEMI ? 'Hide EMI' : 'EMI Calc'}
                                        </button>
                                    )}
                                </div>

                                {currentUser && listing.userRef !== currentUser._id && (
                                    <div className="mt-3">
                                        <RazorpayBtn
                                            listing={listing}
                                            btnText="Book Now (₹500)"
                                            customStyle="w-full justify-center flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/30 border border-indigo-500/50"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* EMI CALCULATOR */}
                            {showEMI && listing.type === 'sale' && (
                                <div className="animate-fadeIn">
                                    <EMICalculator price={listing.offer ? listing.discountPrice : listing.regularPrice} />
                                </div>
                            )}

                            {/* DESCRIPTION */}
                            <div className='bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 shadow-md'>
                                <span className='font-bold text-lg text-white block mb-3 border-b border-slate-700/50 pb-2'>Description</span>
                                <p className='text-slate-300 leading-relaxed text-sm'>
                                    {listing.description}
                                </p>
                            </div>

                            {/* CONTACT CARD */}
                            <div className='bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 shadow-md sticky top-24'>
                                <h3 className='text-lg font-bold mb-4 text-white border-b border-slate-700/50 pb-2'>Contact Owner</h3>

                                {currentUser && listing.userRef !== currentUser._id && !contact && (
                                    <button
                                        onClick={() => setContact(true)}
                                        className='bg-green-600 hover:bg-green-500 text-white rounded-xl uppercase p-3 w-full font-bold transition-all shadow-lg shadow-green-900/20 border border-green-500/50'
                                    >
                                        Send Message
                                    </button>
                                )}

                                {contact && <Contact listing={listing} />}

                                {!currentUser && (
                                    <p className='text-sm text-red-400 mt-2 text-center bg-red-500/10 p-3 rounded-xl border border-red-500/20'>
                                        Please Login to contact the owner.
                                    </p>
                                )}

                                {listing.userRef === currentUser?._id && (
                                    <p className='text-sm text-blue-400 mt-2 text-center bg-blue-500/10 p-3 rounded-xl font-bold border border-blue-500/20'>
                                        You are the owner of this property.
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