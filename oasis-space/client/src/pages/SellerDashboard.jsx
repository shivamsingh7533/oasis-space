import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  FaHome, FaEye, FaCheckCircle, FaEdit, 
  FaTrash, FaPlus, FaTag, FaRupeeSign, FaStar, FaRegStar, FaChartPie 
} from 'react-icons/fa';

export default function SellerDashboard() {
  const { currentUser } = useSelector((state) => state.user);
  const [stats, setStats] = useState({
    totalListings: 0, rentListings: 0, saleListings: 0, offerListings: 0,
    totalViews: 0, activeListings: 0, soldCount: 0, rentedCount: 0, totalRevenue: 0
  });
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(`/api/user/dashboard/${currentUser._id}`);
        
        // Handle Session Timeout (401)
        if (res.status === 401) {
            setLoading(false);
            return; // Data won't load, Profile component will handle logout
        }

        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setListings(data.listings);
        }
        setLoading(false);
      } catch (error) {
        console.log("Dashboard fetch error:", error);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [currentUser._id]);

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      const res = await fetch(`/api/listing/delete/${listingId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success === false) return;
      setListings((prev) => prev.filter((listing) => listing._id !== listingId));
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleFeaturedToggle = async (listingId, currentStatus) => {
    try {
        const res = await fetch(`/api/listing/update/${listingId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                featured: !currentStatus,
                userRef: currentUser._id 
            }),
        });
        const data = await res.json();
        if (data.success === false) return;
        setListings((prev) => prev.map((item) => 
            item._id === listingId ? { ...item, featured: !currentStatus } : item
        ));
    } catch (error) {
        console.log(error);
    }
  };

  const handleStatusChange = async (listingId, newStatus) => {
    try {
        const res = await fetch(`/api/listing/update/${listingId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, userRef: currentUser._id }),
        });
        const data = await res.json();
        if (data.success === false) return;
        setListings((prev) => prev.map((item) => 
            item._id === listingId ? { ...item, status: newStatus } : item
        ));
        window.location.reload(); 
    } catch (error) {
        console.log(error);
    }
  };

  if (loading) return (
    <div className='flex justify-center items-center h-screen bg-slate-900'>
      <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
    </div>
  );

  return (
    <div className='p-6 max-w-7xl mx-auto min-h-screen bg-slate-900 text-slate-200'>
      
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
        <div>
          <h1 className='text-3xl font-bold'>Seller <span className='text-blue-500'>Dashboard</span></h1>
          <p className='text-slate-400 text-sm'>Financial Overview & Property Management</p>
        </div>
        <Link to='/create-listing' className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-blue-900/20'>
          <FaPlus /> Add New Property
        </Link>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10'>
        <div className='bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg'>
          <div className='flex justify-between items-start'>
            <div className='p-3 bg-green-500/10 text-green-400 rounded-lg'><FaRupeeSign className='text-xl' /></div>
            <span className='text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded'>Finance</span>
          </div>
          <p className='text-slate-400 text-sm mt-4 font-medium'>Total Revenue Generated</p>
          <h3 className='text-3xl font-bold mt-1 text-white'>₹{(stats.totalRevenue || 0).toLocaleString()}</h3>
        </div>

        <div className='bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg'>
          <div className='p-3 bg-blue-500/10 text-blue-400 rounded-lg w-fit'><FaChartPie className='text-xl' /></div>
          <p className='text-slate-400 text-sm mt-4 font-medium'>Deals Closed</p>
          <div className='flex items-baseline gap-2 mt-1'>
             <h3 className='text-3xl font-bold'>{stats.soldCount + stats.rentedCount}</h3>
             <span className='text-xs text-slate-500'>({stats.soldCount} Sold, {stats.rentedCount} Rented)</span>
          </div>
        </div>

        <div className='bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg'>
          <div className='p-3 bg-orange-500/10 text-orange-400 rounded-lg w-fit'><FaHome className='text-xl' /></div>
          <p className='text-slate-400 text-sm mt-4 font-medium'>Active Inventory</p>
          <h3 className='text-3xl font-bold mt-1'>{stats.activeListings} <span className='text-sm text-slate-500 font-normal'>/ {stats.totalListings} Total</span></h3>
        </div>

        <div className='bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg'>
          <div className='p-3 bg-purple-500/10 text-purple-400 rounded-lg w-fit'><FaEye className='text-xl' /></div>
          <p className='text-slate-400 text-sm mt-4 font-medium'>Total Property Views</p>
          <h3 className='text-3xl font-bold mt-1'>{stats.totalViews.toLocaleString()}</h3>
        </div>
      </div>

      <div className='bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl'>
        <div className='p-6 border-b border-slate-700 bg-slate-800/50'>
          <h2 className='text-xl font-bold flex items-center gap-2'>
            <FaCheckCircle className='text-blue-500' /> Property Management Center
          </h2>
        </div>
        
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider'>
                <th className='p-5 font-bold text-center'>Featured</th>
                <th className='p-5 font-bold'>Property Details</th>
                <th className='p-5 font-bold'>Status (Action)</th>
                <th className='p-5 font-bold'>Price / Value</th>
                <th className='p-5 font-bold'>Listed On</th>
                <th className='p-5 font-bold text-center'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-700/50'>
              {listings.length > 0 ? listings.map((listing) => (
                <tr key={listing._id} className='hover:bg-slate-700/20 transition-all'>
                  <td className='p-5 text-center'>
                    <button onClick={() => handleFeaturedToggle(listing._id, listing.featured)} className={`text-2xl transition-transform hover:scale-110 ${listing.featured ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-200'}`} title='Toggle Featured'>
                        {listing.featured ? <FaStar /> : <FaRegStar />}
                    </button>
                  </td>
                  <td className='p-5'>
                    <div className='flex items-center gap-4'>
                      <div className='relative'>
                        <img src={listing.imageUrls[0]} alt="" className='w-14 h-14 rounded-xl object-cover bg-slate-700 border border-slate-600' />
                        {listing.offer && <div className='absolute -top-2 -right-2 bg-purple-600 text-[8px] font-bold px-1.5 py-0.5 rounded-md'>OFFER</div>}
                      </div>
                      <div>
                        <Link to={`/listing/${listing._id}`} className='font-bold text-white hover:text-blue-400 transition-colors truncate w-48 block'>{listing.name}</Link>
                        <p className='text-xs text-slate-500 truncate w-40'>{listing.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className='p-5'>
                    <select value={listing.status || 'available'} onChange={(e) => handleStatusChange(listing._id, e.target.value)} className={`text-xs font-bold uppercase px-2 py-1.5 rounded-lg border bg-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${listing.status === 'sold' ? 'text-green-500 border-green-500/50' : listing.status === 'rented' ? 'text-orange-500 border-orange-500/50' : 'text-blue-400 border-blue-500/50'}`}>
                        <option value="available">Available</option>
                        <option value="sold">Mark as Sold</option>
                        <option value="rented">Mark as Rented</option>
                    </select>
                  </td>
                  <td className='p-5'>
                    <p className='font-bold text-white'>₹{listing.regularPrice.toLocaleString()}</p>
                    {listing.type === 'rent' && <p className='text-[10px] text-slate-500'>per month</p>}
                  </td>
                  <td className='p-5 text-sm text-slate-400 font-medium'>
                    {new Date(listing.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className='p-5'>
                    <div className='flex justify-center gap-2'>
                      <Link to={`/update-listing/${listing._id}`} className='p-2.5 bg-slate-700 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-sm' title='Edit'>
                        <FaEdit />
                      </Link>
                      <button onClick={() => handleDeleteListing(listing._id)} className='p-2.5 bg-slate-700 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm' title='Delete'>
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className='p-20 text-center'>
                    <div className='flex flex-col items-center gap-3'>
                      <div className='p-4 bg-slate-700/50 rounded-full text-slate-500'><FaHome className='text-4xl' /></div>
                      <p className='text-slate-400 font-medium'>No properties listed yet.</p>
                      <Link to='/create-listing' className='text-blue-400 hover:underline text-sm font-bold'>Click here to add your first property</Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}