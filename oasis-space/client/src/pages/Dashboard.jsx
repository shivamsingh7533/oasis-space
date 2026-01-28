import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaMoneyBillWave, FaChartLine, FaUsers, FaHome, FaTrash, FaEdit, FaUserShield, FaUserTag, FaUser, FaStar, FaRegStar } from 'react-icons/fa'; // Added FaStar and FaRegStar

export default function Dashboard() {
  const { currentUser } = useSelector((state) => state.user);
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
        fetchDashboardData();
    } else {
        setLoading(false);
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const resListings = await fetch('/api/listing/admin-listings'); 
      const dataListings = await resListings.json();
      setListings(Array.isArray(dataListings) ? dataListings : []);

      const resUsers = await fetch('/api/user/getusers');
      const dataUsers = await resUsers.json();
      setUsers(Array.isArray(dataUsers) ? dataUsers : []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); 
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (window.confirm("Are you sure?")) {
        try {
            const res = await fetch(`/api/listing/delete/${listingId}`, { method: 'DELETE' });
            if (res.ok) {
                setListings((prev) => prev.filter((item) => item._id !== listingId));
            }
        } catch (error) { console.log(error); }
    }
  };

  // --- ⭐ HANDLE FEATURED TOGGLE (NEW) ---
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
        if (data.success === false) {
            console.log(data.message);
            return;
        }
        // Update UI locally
        setListings((prev) => prev.map((item) => 
            item._id === listingId ? { ...item, featured: !currentStatus } : item
        ));
    } catch (error) {
        console.log(error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("This will permanently delete the user. Continue?")) {
        try {
            const res = await fetch(`/api/user/delete/${userId}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers((prev) => prev.filter((user) => user._id !== userId));
            }
        } catch (error) { console.log(error); }
    }
  };

  const handleSellerStatus = async (userId, status) => {
      try {
          const res = await fetch(`/api/user/verify-seller/${userId}`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ status })
          });
          
          const data = await res.json();
          
          if(res.ok) {
              setUsers(users.map(user => user._id === userId ? { ...user, sellerStatus: status } : user));
              alert(`Success: ${data.username || 'User'} is now ${status}!`);
          } else {
              alert(data.message || "Something went wrong!");
          }
      } catch (error) {
          console.log(error);
      }
  };

  const calculateFinancials = () => {
      const totalSaleValue = listings.filter(l => l.type === 'sale').reduce((acc, curr) => acc + (+curr.regularPrice || 0), 0);
      const totalRentVolume = listings.filter(l => l.type === 'rent').reduce((acc, curr) => acc + (+curr.regularPrice || 0), 0);
      const estimatedRevenue = (totalSaleValue * 0.02) + (totalRentVolume * 0.10);
      return { totalSaleValue, totalRentVolume, estimatedRevenue };
  };
  const { totalSaleValue, totalRentVolume, estimatedRevenue } = calculateFinancials();

  if (!currentUser || currentUser.role !== 'admin') return <div className='p-10 text-center text-white'>Access Denied</div>;

  return (
    <div className='min-h-screen bg-slate-900 text-slate-200 p-4 sm:p-6'>
      
      {/* HEADER & TABS */}
      <div className='max-w-7xl mx-auto mb-8'>
        <div className='flex flex-col md:flex-row justify-between items-center mb-6 gap-4'>
             <h1 className='text-3xl font-bold text-white'>Admin Dashboard</h1>
             <div className='flex bg-slate-800 p-1 rounded-lg border border-slate-700'>
                 <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Overview</button>
                 <button onClick={() => setActiveTab('listings')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'listings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Properties</button>
                 <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Users (CRM)</button>
             </div>
        </div>

        {error && (
            <div className='bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-center'>
                {error}
            </div>
        )}
      </div>

      {loading ? <div className='text-center mt-20'>Loading...</div> : (
        <div className='max-w-7xl mx-auto'>
            
            {/* --- TAB 1: OVERVIEW --- */}
            {activeTab === 'overview' && (
                <div className='flex flex-col gap-6'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        <div className='bg-green-900/40 p-6 rounded-2xl border border-green-700/50 shadow-xl'>
                             <h3 className='text-green-400 text-sm font-bold uppercase'>Est. Net Revenue</h3>
                             <p className='text-4xl font-bold text-white mt-2'>₹ {estimatedRevenue.toLocaleString('en-IN')}</p>
                        </div>
                        <div className='bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl'>
                             <h3 className='text-slate-400 text-sm font-bold uppercase'>Inventory Value</h3>
                             <p className='text-3xl font-bold text-white mt-2'>₹ {totalSaleValue.toLocaleString('en-IN')}</p>
                        </div>
                        <div className='bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl'>
                             <h3 className='text-slate-400 text-sm font-bold uppercase'>Rent Volume/Mo</h3>
                             <p className='text-3xl font-bold text-white mt-2'>₹ {totalRentVolume.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        <div className='bg-slate-800 p-4 rounded-xl border border-slate-700 text-center'>
                            <p className='text-2xl font-bold'>{users.length}</p><span className='text-xs uppercase text-slate-500'>Total Users</span>
                        </div>
                        <div className='bg-slate-800 p-4 rounded-xl border border-slate-700 text-center'>
                            <p className='text-2xl font-bold'>{listings.length}</p><span className='text-xs uppercase text-slate-500'>Properties</span>
                        </div>
                        <div className='bg-slate-800 p-4 rounded-xl border border-slate-700 text-center'>
                            <p className='text-2xl font-bold text-yellow-400'>{users.filter(u => u.sellerStatus === 'pending').length}</p><span className='text-xs uppercase text-yellow-400'>Pending Sellers</span>
                        </div>
                        <div className='bg-slate-800 p-4 rounded-xl border border-slate-700 text-center'>
                            <p className='text-2xl font-bold text-green-400'>{listings.filter(l => l.offer).length}</p><span className='text-xs uppercase text-green-400'>Active Offers</span>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB 2: LISTINGS --- */}
            {activeTab === 'listings' && (
                <div className='bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden'>
                    <table className='w-full text-left text-sm text-gray-400'>
                        <thead className='bg-slate-900 uppercase text-xs'>
                            <tr>
                                <th className='p-4 text-center'>Featured</th> {/* New Column Header */}
                                <th className='p-4'>Property</th>
                                <th className='p-4'>Type</th>
                                <th className='p-4'>Price</th>
                                <th className='p-4 text-right'>Admin Actions</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-700'>
                            {listings.map((listing) => (
                                <tr key={listing._id} className='hover:bg-slate-700/50'>
                                    {/* ⭐ Featured Toggle Button */}
                                    <td className='p-4 text-center'>
                                        <button 
                                            onClick={() => handleFeaturedToggle(listing._id, listing.featured)}
                                            className={`text-xl transition-transform hover:scale-110 ${listing.featured ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-200'}`}
                                            title='Toggle Featured'
                                        >
                                            {listing.featured ? <FaStar /> : <FaRegStar />}
                                        </button>
                                    </td>
                                    <td className='p-4 flex gap-3 items-center'>
                                        <img src={listing.imageUrls[0]} className='w-12 h-12 rounded object-cover' alt=""/>
                                        <div><p className='text-white font-bold truncate w-40'>{listing.name}</p><p className='text-xs'>{listing.address}</p></div>
                                    </td>
                                    <td className='p-4'><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${listing.type==='rent'?'bg-blue-500/20 text-blue-400':'bg-green-500/20 text-green-400'}`}>{listing.type}</span></td>
                                    <td className='p-4 text-white'>₹ {listing.regularPrice.toLocaleString('en-IN')}</td>
                                    <td className='p-4 text-right'>
                                        <div className='flex justify-end gap-3'>
                                            <Link to={`/update-listing/${listing._id}`} className='text-blue-400 hover:text-white'><FaEdit size={16}/></Link>
                                            <button onClick={() => handleDeleteListing(listing._id)} className='text-red-400 hover:text-red-200'><FaTrash size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- TAB 3: USERS (CRM - CARD LAYOUT) --- */}
            {activeTab === 'users' && (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {users.map((user) => (
                        <div key={user._id} className='bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl flex flex-col relative overflow-hidden group hover:border-slate-500 transition-all'>
                            
                            {/* TOP BADGE (ADMIN / SELLER / USER) */}
                            <div className='absolute top-4 right-4'>
                                {user.role === 'admin' ? (
                                    <span className='bg-purple-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1'>
                                        <FaUserShield /> Admin
                                    </span>
                                ) : user.sellerStatus === 'approved' ? (
                                    <span className='bg-green-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1'>
                                        <FaUserTag /> Seller
                                    </span>
                                ) : (
                                    <span className='bg-slate-600 text-slate-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1'>
                                        <FaUser /> User
                                    </span>
                                )}
                            </div>

                            {/* USER DETAILS */}
                            <div className='flex items-center gap-4 mb-4 mt-2'>
                                <img src={user.avatar} className='w-16 h-16 rounded-full object-cover border-4 border-slate-700 shadow-md' alt={user.username} />
                                <div>
                                    <h3 className='text-white font-bold text-lg truncate w-32 md:w-40'>{user.username}</h3>
                                    <p className='text-slate-400 text-xs truncate w-32 md:w-40'>{user.email}</p>
                                </div>
                            </div>

                            <div className='h-px bg-slate-700 w-full my-2'></div>

                            {/* SELLER APPROVAL ACTIONS */}
                            {user.sellerStatus === 'pending' && (
                                <div className='bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg mb-4'>
                                    <p className='text-yellow-400 text-xs font-bold mb-2 uppercase tracking-wide flex items-center gap-2'>
                                        ⚠️ Requesting Seller Access
                                    </p>
                                    <div className='flex gap-2'>
                                        <button onClick={() => handleSellerStatus(user._id, 'approved')} className='flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded transition'>
                                            Approve
                                        </button>
                                        <button onClick={() => handleSellerStatus(user._id, 'rejected')} className='flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 rounded transition'>
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* CARD FOOTER */}
                            <div className='mt-auto flex justify-between items-center pt-2'>
                                <div className='flex flex-col'>
                                     <span className='text-[10px] uppercase text-slate-500 font-bold'>Join Date</span>
                                     <span className='text-xs text-slate-300'>{new Date(user.createdAt).toLocaleDateString()}</span>
                                </div>
                                
                                {user.role !== 'admin' && (
                                    <button 
                                        onClick={() => handleDeleteUser(user._id)} 
                                        className='text-red-400 hover:text-red-100 hover:bg-red-500/20 p-2 rounded-full transition duration-300'
                                        title="Delete User"
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}
    </div>
  );
}