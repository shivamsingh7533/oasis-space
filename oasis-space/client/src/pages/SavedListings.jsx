import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export default function SavedListings() {
  const { currentUser } = useSelector((state) => state.user);
  const [savedListings, setSavedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSavedListings = async () => {
      try {
        const res = await fetch(`/api/user/saved/${currentUser._id}`);
        const data = await res.json();
        if (data.success === false) {
          setError(true);
          setLoading(false);
          return;
        }
        setSavedListings(data);
        setLoading(false);
      } catch (error) {
        console.log(error); // <--- FIX: We print the error here!
        setError(true);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchSavedListings();
    }
  }, [currentUser]);

  return (
    <div className='p-3 max-w-2xl mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>
        My Saved Listings
      </h1>
      {loading && <p className='text-center my-7 text-2xl'>Loading...</p>}
      {error && <p className='text-center my-7 text-red-700'>Something went wrong!</p>}
      
      {!loading && savedListings && savedListings.length === 0 && (
        <p className='text-center text-slate-700'>No saved listings yet!</p>
      )}

      {!loading && savedListings && savedListings.length > 0 && (
        <div className='flex flex-col gap-4'>
          {savedListings.map((listing) => (
            <div
              key={listing._id}
              className='border rounded-lg p-3 flex justify-between items-center gap-4 bg-white shadow-md hover:shadow-lg transition-shadow'
            >
              <Link to={`/listing/${listing._id}`}>
                <img
                  src={listing.imageUrls[0]}
                  alt='listing cover'
                  className='h-16 w-16 object-contain rounded-lg'
                />
              </Link>
              <Link
                className='text-slate-700 font-semibold  hover:underline truncate flex-1'
                to={`/listing/${listing._id}`}
              >
                <p>{listing.name}</p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}