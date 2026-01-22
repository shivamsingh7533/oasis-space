import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useSelector } from 'react-redux';
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

// Fix for default Leaflet marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

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
  
  // Map Coordinates State
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [mapLoading, setMapLoading] = useState(true);

  // Map Reference for Recenter Feature
  const mapRef = useRef(null);

  const params = useParams();
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

        // Check if saved
        if (currentUser && currentUser.savedListings && data._id) {
            if (currentUser.savedListings.includes(data._id)) {
                setSaved(true);
            }
        }

        // Geocoding Logic
        if (data.address) {
            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.address)}`);
                const geoData = await geoRes.json();
                if (geoData && geoData.length > 0) {
                    setCoordinates({ lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) });
                    setMapLoading(false);
                } else {
                    setMapLoading(false);
                }
            } catch (err) {
                console.log("Map Error:", err);
                setMapLoading(false);
            }
        }

      } catch (err) {
        console.log(err); 
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
      const res = await fetch(`/api/user/save/${currentUser._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing._id }),
      });
      const data = await res.json();
      if (data.success === false) {
        setSaved((prev) => !prev); 
      }
    } catch (err) {
      console.log(err); // FIX: Log the error to use the variable
      setSaved((prev) => !prev); 
    }
  };

  // Recenter Map Function
  const handleRecenterMap = () => {
    if (mapRef.current) {
        mapRef.current.flyTo([coordinates.lat, coordinates.lng], 13);
    }
  };

  return (
    <main>
      {loading && <p className='text-center my-7 text-2xl'>Loading...</p>}
      {error && <p className='text-center my-7 text-2xl'>Something went wrong!</p>}
      
      {listing && !loading && !error && (
        <div className='relative bg-slate-100 min-h-screen'> 
          
          {/* Image Slider */}
          <Swiper modules={[Navigation]} navigation>
            {listing.imageUrls.map((url) => (
              <SwiperSlide key={url}>
                <div
                  className='h-[300px] sm:h-[400px] md:h-[550px]'
                  style={{
                    background: `url(${url}) center no-repeat`,
                    backgroundSize: 'cover',
                  }}
                ></div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Share Button */}
          <div className='absolute top-5 right-5 z-10 border rounded-full w-12 h-12 flex justify-center items-center bg-white cursor-pointer shadow-md hover:scale-110 transition-transform'>
            <FaShare
              className='text-slate-500'
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            />
          </div>

          {/* Save Button */}
          <div 
            onClick={handleSaveListing}
            className='absolute top-20 right-5 z-10 border rounded-full w-12 h-12 flex justify-center items-center bg-white cursor-pointer shadow-md hover:scale-110 transition-transform'
            title={saved ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            {saved ? <FaHeart className='text-red-500 text-xl' /> : <FaRegHeart className='text-slate-500 text-xl' />}
          </div>

          {copied && (
            <p className='fixed top-[23%] right-[5%] z-10 rounded-md bg-slate-800 text-white p-2 shadow-lg font-semibold'>
              Link copied!
            </p>
          )}

          {/* Listing Info */}
          <div className='flex flex-col max-w-4xl mx-auto p-3 my-7 gap-4'>
            <p className='text-2xl font-bold text-slate-900'>
              {listing.name} - ₹{' '}
              {listing.offer
                ? listing.discountPrice.toLocaleString('en-IN')
                : listing.regularPrice.toLocaleString('en-IN')}
              {listing.type === 'rent' && ' / month'}
            </p>

            <p className='flex items-center gap-2 text-slate-600 text-sm font-medium'>
              <FaMapMarkerAlt className='text-green-700' />
              {listing.address}
            </p>

            <div className='flex gap-4'>
              <p className='bg-red-900 w-full max-w-[200px] text-white text-center p-1 rounded-md shadow-sm font-semibold'>
                {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
              </p>
              {listing.offer && (
                <p className='bg-green-900 w-full max-w-[200px] text-white text-center p-1 rounded-md shadow-sm font-semibold'>
                   ₹{+listing.regularPrice - +listing.discountPrice} OFF
                </p>
              )}
            </div>

            <p className='text-slate-700 leading-relaxed bg-white p-4 rounded-lg shadow-sm'>
              <span className='font-bold text-slate-900 block mb-1'>Description:</span>
              {listing.description}
            </p>

            <ul className='text-green-800 font-semibold text-sm flex flex-wrap items-center gap-4 sm:gap-6 bg-white p-4 rounded-lg shadow-sm'>
              <li className='flex items-center gap-2 whitespace-nowrap'><FaBed className='text-xl' />{listing.bedrooms} Beds</li>
              <li className='flex items-center gap-2 whitespace-nowrap'><FaBath className='text-xl' />{listing.bathrooms} Baths</li>
              <li className='flex items-center gap-2 whitespace-nowrap'><FaParking className='text-xl' />{listing.parking ? 'Parking' : 'No Parking'}</li>
              <li className='flex items-center gap-2 whitespace-nowrap'><FaChair className='text-xl' />{listing.furnished ? 'Furnished' : 'Unfurnished'}</li>
            </ul>

            {currentUser && listing.userRef !== currentUser._id && (
               <button onClick={() => window.location.href = `mailto:landlord@gmail.com?subject=${listing.name}`} className='bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 p-3 font-semibold shadow-lg mt-4'>
               Contact Landlord
             </button>
            )}

            {/* --- MAP SECTION --- */}
            <div className='bg-white p-4 rounded-lg shadow-sm mt-4 z-0'>
                <div className="flex justify-between items-center mb-3">
                    <h3 className='text-lg font-bold text-slate-900'>Location</h3>
                    {/* Recenter Button */}
                    {!mapLoading && coordinates.lat !== 0 && (
                        <button 
                            onClick={handleRecenterMap}
                            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-3 rounded flex items-center gap-1 transition-colors border border-slate-300"
                            title="Reset Map View"
                        >
                            <FaLocationArrow className="text-xs" /> Recenter
                        </button>
                    )}
                </div>
                
                {!mapLoading && coordinates.lat !== 0 ? (
                    <div className='h-[400px] w-full rounded-lg overflow-hidden border border-slate-300 z-0 relative'>
                        <MapContainer 
                            ref={mapRef}
                            center={[coordinates.lat, coordinates.lng]} 
                            zoom={13} 
                            scrollWheelZoom={false} 
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[coordinates.lat, coordinates.lng]}>
                                <Popup>{listing.address}</Popup>
                            </Marker>
                        </MapContainer>
                    </div>
                ) : (
                    <div className='h-[200px] w-full bg-slate-200 rounded-lg flex items-center justify-center text-slate-500'>
                        {mapLoading ? 'Loading Map...' : 'Location not found on map'}
                    </div>
                )}
            </div>

          </div>
        </div>
      )}
    </main>
  );
}