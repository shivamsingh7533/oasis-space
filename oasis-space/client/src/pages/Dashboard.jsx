import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { currentUser } = useSelector((state) => state.user);
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  
  // States for handling UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Sirf Admin hi data fetch karega
    if (currentUser && currentUser.role === 'admin') {
        fetchDashboardData();
    } else {
        setLoading(false); // Admin nahi hai to loading band
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Listings Fetch Karein
      const resListings = await fetch('/api/listing/admin-listings');
      const dataListings = await resListings.json();

      if (dataListings.success === false) {
         throw new Error(dataListings.message);
      }
      setListings(dataListings);

      // 2. Users Fetch Karein
      const resUsers = await fetch('/api/user/getusers');
      const dataUsers = await resUsers.json();
      
      if (dataUsers.success === false) {
         throw new Error(dataUsers.message);
      }
      setUsers(dataUsers);

    } catch (err) {
      console.log("Dashboard Error:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false); // Ye har haal mein chalega -> Loading Hategi hi Hategi
    }
  };

  // --- DELETE HANDLER ---
  const handleDeleteListing = async (listingId) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
        try {
            const res = await fetch(`/api/listing/delete/${listingId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                setListings((prev) => prev.filter((item) => item._id !== listingId));
                alert("Listing Deleted!");
            } else {
                alert(data.message);
            }
        } catch (error) { console.log(error); }
    }
  };

  // --- RENDER START ---
  
  // 1. Agar User Admin nahi hai
  if (!currentUser || currentUser.role !== 'admin') {
      return (
          <div className='min-h-screen flex flex-col justify-center items-center bg-slate-900 text-white'>
              <h1 className='text-3xl font-bold mb-4'>Access Denied 🚫</h1>
              <p>You must be an Admin to view this page.</p>
              <Link to='/' className='mt-5 bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700'>Go Home</Link>
          </div>
      );
  }

  return (
    <div className='min-h-screen bg-slate-900 text-slate-200 p-5'>
      
      {/* HEADER */}
      <div className='max-w-6xl mx-auto flex justify-between items-center mb-8 border-b border-slate-700 pb-4'>
        <h1 className='text-3xl font-bold text-white'>Admin Dashboard</h1>
        <Link to='/create-listing' className='bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition'>
           + Create New Listing
        </Link>
      </div>

      {/* ERROR MESSAGE (Agar Loading Fail ho jaye) */}
      {error && (
        <div className='max-w-6xl mx-auto bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg text-center mb-6'>
            <p className='font-bold'>Error: {error}</p>
            <button onClick={fetchDashboardData} className='mt-2 bg-red-600 text-white px-4 py-1 rounded text-sm hover:bg-red-700'>Retry</button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading ? (
          <div className='text-center mt-20'>
              <div className='animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto'></div>
              <p className='mt-4 text-xl'>Loading Dashboard...</p>
          </div>
      ) : (
          // MAIN CONTENT
          <div className='max-w-6xl mx-auto grid gap-8'>
              
              {/* STATS CARDS */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div className='bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg'>
                      <h3 className='text-gray-400 text-sm uppercase'>Total Users</h3>
                      <p className='text-3xl font-bold text-white mt-2'>{users.length}</p>
                  </div>
                  <div className='bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg'>
                      <h3 className='text-gray-400 text-sm uppercase'>Total Listings</h3>
                      <p className='text-3xl font-bold text-white mt-2'>{listings.length}</p>
                  </div>
                  <div className='bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg'>
                      <h3 className='text-gray-400 text-sm uppercase'>For Sale</h3>
                      <p className='text-3xl font-bold text-green-400 mt-2'>{listings.filter(l => l.type === 'sale').length}</p>
                  </div>
              </div>

              {/* RECENT LISTINGS TABLE */}
              <div className='bg-slate-800 rounded-xl border border-slate-700 overflow-hidden'>
                  <h2 className='p-5 font-bold text-xl border-b border-slate-700 bg-slate-800/50'>Recent Properties</h2>
                  
                  {listings.length === 0 ? (
                      <p className='p-10 text-center text-gray-500'>No listings found.</p>
                  ) : (
                      <div className='overflow-x-auto'>
                        <table className='w-full text-left text-sm text-gray-400'>
                            <thead className='bg-slate-900 text-gray-200 uppercase text-xs'>
                                <tr>
                                    <th className='p-4'>Image</th>
                                    <th className='p-4'>Name</th>
                                    <th className='p-4'>Type</th>
                                    <th className='p-4'>Price</th>
                                    <th className='p-4 text-right'>Action</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-700'>
                                {listings.map((listing) => (
                                    <tr key={listing._id} className='hover:bg-slate-700/50 transition'>
                                        <td className='p-4'>
                                            <img src={listing.imageUrls[0]} alt="listing" className='w-12 h-12 rounded object-cover bg-slate-600' />
                                        </td>
                                        <td className='p-4 font-medium text-white truncate max-w-[200px]'>
                                            <Link to={`/listing/${listing._id}`} className='hover:underline'>{listing.name}</Link>
                                        </td>
                                        <td className='p-4'>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${listing.type === 'rent' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {listing.type}
                                            </span>
                                        </td>
                                        <td className='p-4'>${listing.regularPrice.toLocaleString()}</td>
                                        <td className='p-4 text-right'>
                                            <button onClick={() => handleDeleteListing(listing._id)} className='text-red-400 hover:text-red-300 font-semibold'>DELETE</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
}