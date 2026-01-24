import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigation } from 'swiper/modules';
import 'swiper/css/bundle';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  FaBath,
  FaBed,
  FaChair,
  FaMapMarkerAlt,
  FaParking,
  FaShare,
  FaHeart,
  FaRegHeart,
  FaLocationArrow,
} from 'react-icons/fa';

// Leaflet Assets
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { updateUserSuccess } from '../redux/user/userSlice';
import EMICalculator from '../components/EMICalculator'; // ✅ Added Calculator Import

// Fix for Leaflet default icon
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Listing() {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [mapLoading, setMapLoading] = useState(true);

  const mapRef = useRef(null);
  const params = useParams();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/listing/get/${params.listingId}`);
        const data = await res.json();
        
        if (data.success === false) {
          setError(true);
          setLoading(false);
          return;
        }
        
        setListing(data);
        setLoading(false);

        // --- SYNC STATE ---
        if (currentUser && currentUser.savedListings && data._id) {
            const isSaved = currentUser.savedListings.some(id => id.toString() === data._id);
            setSaved(isSaved);
        }

        // --- GEOCODING (OSM) ---
        if (data.address) {
            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.address)}`);
                const geoData = await geoRes.json();
                if (geoData && geoData.length > 0) {
                    setCoordinates({ lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) });
                }
                setMapLoading(false);
            } catch (mapErr) {
                console.log("Map Fetch Error:", mapErr);
                setMapLoading(false);
            }
        }
      } catch (fetchErr) {
        console.log("Listing Fetch Error:", fetchErr);
        setError(true);
        setLoading(false);
      }
    };
    fetchListing();
  }, [params.listingId, currentUser]);

  const handleSaveListing = async () => {
    if (!currentUser) return alert("Please sign in to save listings!");
    
    setSaved((prev) => !prev); 

    try {
      const res = await fetch(`/api/user/save/${listing._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      
      if (data.success === false) {
        setSaved((prev) => !prev);
        return;
      }

      // Sync Redux Store
      let updatedSavedListings = [...(currentUser.savedListings || [])];
      if (saved) {
         updatedSavedListings = updatedSavedListings.filter(id => id !== listing._id);
      } else {
         updatedSavedListings.push(listing._id);
      }

      dispatch(updateUserSuccess({ ...currentUser, savedListings: updatedSavedListings }));

    } catch (saveErr) {
      console.log("Save Logic Error:", saveErr);
      setSaved((prev) => !prev);
    }
  };

  const handleRecenterMap = () => {
    if (mapRef.current) {
        mapRef.current.flyTo([coordinates.lat, coordinates.lng], 13);
    }
  };

  return (
    // OasisSpace Dark Theme Background
    <main className="bg-[#0b0f1a] min-h-screen text-slate-200">
      {loading && <p className='text-center py-20 text-2xl animate-pulse'>Gathering property details...</p>}
      {error && <p className='text-center py-20 text-2xl text-red-500'>Something went wrong! Please refresh.</p>}
      
      {listing && !loading && !error && (
        <div className='relative'> 
          {/* Swiper Slider */}
          <Swiper modules={[Navigation]} navigation className='listing-swiper'>
            {listing.imageUrls.map((url) => (
              <SwiperSlide key={url}>
                <div
                  className='h-[350px] sm:h-[500px]'
                  style={{
                    background: `linear-gradient(to bottom, transparent, rgba(11, 15, 26, 0.7)), url(${url}) center no-repeat`,
                    backgroundSize: 'cover',
                  }}
                ></div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Floating Actions */}
          <div className='absolute top-5 right-5 z-10 flex gap-4'>
            <div className='bg-slate-800/80 backdrop-blur-md border border-slate-700 p-3 rounded-full cursor-pointer hover:scale-110 transition-all shadow-xl'
                 onClick={() => {
                   navigator.clipboard.writeText(window.location.href);
                   setCopied(true);
                   setTimeout(() => setCopied(false), 2000);
                 }}>
              <FaShare className='text-white' />
            </div>
            
            <div onClick={handleSaveListing}
                 className='bg-slate-800/80 backdrop-blur-md border border-slate-700 p-3 rounded-full cursor-pointer hover:scale-110 transition-all shadow-xl'>
              {saved ? <FaHeart className='text-red-500 text-xl' /> : <FaRegHeart className='text-white text-xl' />}
            </div>
          </div>

          {copied && (
            <p className='fixed top-[15%] right-5 z-20 rounded-md bg-indigo-600 text-white p-2 text-xs shadow-lg'>URL Copied!</p>
          )}

          {/* Information Section */}
          <div className='max-w-4xl mx-auto p-4 flex flex-col gap-6 -mt-10 relative z-10'>
            
            {/* Header Card */}
            <div className="bg-slate-800/90 backdrop-blur-lg p-6 rounded-3xl border border-slate-700 shadow-2xl">
                <h1 className='text-3xl font-extrabold text-white mb-2'>
                  {listing.name}
                </h1>
                <p className='flex items-center gap-2 text-indigo-400 text-sm font-medium'>
                  <FaMapMarkerAlt className='text-indigo-500' />
                  {listing.address}
                </p>

                <div className="flex items-center justify-between mt-6 flex-wrap gap-4">
                    <p className='text-3xl font-bold text-white'>
                          ₹ {listing.offer ? listing.discountPrice.toLocaleString('en-IN') : listing.regularPrice.toLocaleString('en-IN')}
                          {listing.type === 'rent' && <span className='text-sm text-slate-400 font-normal'> / month</span>}
                    </p>
                    <div className='flex gap-3'>
                      <span className='bg-red-500/10 text-red-400 border border-red-500/30 px-5 py-1.5 rounded-full text-xs font-bold uppercase'>
                        {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
                      </span>
                      {listing.offer && (
                        <span className='bg-green-500/10 text-green-400 border border-green-500/30 px-5 py-1.5 rounded-full text-xs font-bold'>
                           ₹{(+listing.regularPrice - +listing.discountPrice).toLocaleString('en-IN')} OFF
                        </span>
                      )}
                    </div>
                </div>
            </div>

            {/* Quick Specs Grid */}
            <ul className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <li className='bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center gap-1'>
                  <FaBed className='text-indigo-400 text-2xl' />
                  <span className="text-white font-bold">{listing.bedrooms} Beds</span>
              </li>
              <li className='bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center gap-1'>
                  <FaBath className='text-indigo-400 text-2xl' />
                  <span className="text-white font-bold">{listing.bathrooms} Baths</span>
              </li>
              <li className='bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center gap-1'>
                  <FaParking className='text-indigo-400 text-2xl' />
                  <span className="text-white font-bold">{listing.parking ? 'Parking' : 'None'}</span>
              </li>
              <li className='bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center gap-1'>
                  <FaChair className='text-indigo-400 text-2xl' />
                  <span className="text-white font-bold">{listing.furnished ? 'Furnished' : 'No'}</span>
              </li>
            </ul>

            {/* Description Area */}
            <div className='bg-slate-800 p-7 rounded-3xl border border-slate-700 shadow-lg'>
              <h2 className='text-white font-bold text-xl mb-4'>Description</h2>
              <p className='text-slate-400 text-base leading-relaxed'>{listing.description}</p>
            </div>

            {/* ✅ EMI Calculator (Integrated here) */}
            {listing.type === 'sale' && (
              <EMICalculator price={listing.offer ? listing.discountPrice : listing.regularPrice} />
            )}

            {/* Map Area */}
            <div className='bg-slate-800 p-4 rounded-3xl border border-slate-700 shadow-lg overflow-hidden'>
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className='font-bold text-white flex items-center gap-2'><FaLocationArrow className="text-indigo-400"/> Map View</h3>
                    {!mapLoading && coordinates.lat !== 0 && (
                        <button onClick={handleRecenterMap} className="text-xs bg-slate-700 hover:bg-indigo-600 text-slate-200 py-1.5 px-4 rounded-full transition-all border border-slate-600">
                             Recenter
                        </button>
                    )}
                </div>
                
                <div className='h-[350px] w-full rounded-2xl overflow-hidden grayscale brightness-[0.7] border border-slate-700'>
                    {!mapLoading && coordinates.lat !== 0 ? (
                        <MapContainer ref={mapRef} center={[coordinates.lat, coordinates.lng]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[coordinates.lat, coordinates.lng]}><Popup>{listing.address}</Popup></Marker>
                        </MapContainer>
                    ) : (
                        <div className='h-full w-full bg-slate-900 flex items-center justify-center text-slate-500 text-sm'>
                            {mapLoading ? 'Finding location...' : 'Map not available for this address'}
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Host Button */}
            {currentUser && listing.userRef !== currentUser._id && (
               <button onClick={() => window.location.href = `mailto:support@oasisspace.com?subject=${listing.name}`} 
                       className='bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl uppercase hover:opacity-95 p-4 font-extrabold shadow-2xl tracking-widest transition-all mb-10'>
                 Message Landlord
               </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}