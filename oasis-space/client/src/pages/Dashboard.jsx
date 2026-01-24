import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaHome, FaUsers, FaBuilding, FaChartPie, FaBell, FaTrash, FaTimes, FaStar, FaEdit } from 'react-icons/fa';
// --- 1. RECHARTS IMPORTS (ResponsiveContainer hataya gaya hai) 📊 ---
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// --- SIDEBAR COMPONENT ---
const Sidebar = ({ activeTab, setActiveTab, pendingRequests }) => (
  <div className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col hidden md:flex">
    <div className="p-6 flex items-center gap-2 border-b border-slate-800">
      <span className="text-2xl">🛡️</span>
      <h1 className="text-xl font-bold text-white tracking-wide">AdminPanel</h1>
    </div>
    
    <nav className="flex-1 p-4 space-y-2">
      <button 
        onClick={() => setActiveTab('overview')} 
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
      >
          <FaChartPie /> Overview
      </button>
      <button 
        onClick={() => setActiveTab('users')} 
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
      >
          <div className="relative">
            <FaUsers /> 
            {/* SIDEBAR NOTIFICATION BADGE */}
            {pendingRequests > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] w-5 h-5 rounded-full flex items-center justify-center text-white font-bold animate-pulse">{pendingRequests}</span>}
          </div> 
          Users
      </button>
      <button 
        onClick={() => setActiveTab('listings')} 
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'listings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
      >
          <FaBuilding /> Listings
      </button>
    </nav>

    <div className="p-4 border-t border-slate-800">
       <Link to='/' className="flex items-center gap-3 text-slate-400 hover:text-white transition px-4 py-2">
          <FaHome /> Go to Website
       </Link>
    </div>
  </div>
);

export default function Dashboard() {
  const { currentUser } = useSelector((state) => state.user);
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); 
  const [selectedUser, setSelectedUser] = useState(null);

  // --- DATA FETCHING (WITH AUTO-REFRESH) 🔄 ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Listings
        const resListings = await fetch('/api/listing/admin-listings');
        const dataListings = await resListings.json();
        if (dataListings.success !== false) setListings(dataListings);

        // Fetch Users (Admin Only)
        if (currentUser.role === 'admin') {
          const resUsers = await fetch('/api/user/getusers');
          const dataUsers = await resUsers.json();
          if (dataUsers.success !== false) setUsers(dataUsers);
        }
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchData(); // 1. Turant Load karein
    
    // 2. Har 10 Second mein refresh karein (Polling)
    const interval = setInterval(fetchData, 10000); 

    return () => clearInterval(interval); // Cleanup
  }, [currentUser.role]);

  // --- ACTIONS ---
  const handleListingDelete = async (listingId) => {
    if (window.confirm('Delete this listing permanently?')) {
      try {
        const res = await fetch(`/api/listing/delete/${listingId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success === false) return console.log(data.message);
        setListings((prev) => prev.filter((item) => item._id !== listingId));
      } catch (error) { console.log(error.message); }
    }
  };

  const handleUserDelete = async (userId, e) => {
    e.stopPropagation();
    if (window.confirm('WARNING: User and their listings will be deleted!')) {
      try {
        const res = await fetch(`/api/user/delete/${userId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success === false) return console.log(data.message);
        setUsers((prev) => prev.filter((user) => user._id !== userId));
        setListings((prev) => prev.filter((item) => item.userRef !== userId));
        if (selectedUser && selectedUser._id === userId) setSelectedUser(null);
      } catch (error) { console.log(error); }
    }
  };

  const handleSellerStatus = async (userId, status, e) => {
    e.stopPropagation();
    try {
        const res = await fetch(`/api/user/verify-seller/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (data.success === false) return alert(data.message);
        
        // Optimistic Update (Turant UI change karein)
        setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, sellerStatus: status } : u));
    } catch (error) { console.log(error); }
  };

  const handleListingFeature = async (listingId) => {
    try {
        const res = await fetch(`/api/listing/feature/${listingId}`, { method: 'POST' });
        const data = await res.json();
        if (data.success === false) return console.log(data.message);
        setListings((prev) => prev.map((item) => 
            item._id === listingId ? { ...item, featured: !item.featured } : item
        ));
    } catch (error) { console.log(error); }
  };

  // --- 2. STATS & CHART DATA PREPARATION 📊 ---
  const totalSale = listings.filter(l => l.type === 'sale').length;
  const totalRent = listings.filter(l => l.type === 'rent').length;
  const pendingRequests = users.filter(u => u.sellerStatus === 'pending').length;

  // Pie Chart Data (Rent vs Sale)
  const pieData = [
    { name: 'Rent', value: totalRent },
    { name: 'Sale', value: totalSale },
  ];
  const PIE_COLORS = ['#3B82F6', '#10B981']; // Blue for Rent, Green for Sale

  // Bar Chart Data (User Status)
  const barData = [
    { name: 'Regular', value: users.filter(u => !u.sellerStatus || u.sellerStatus === 'regular').length },
    { name: 'Pending', value: pendingRequests },
    { name: 'Sellers', value: users.filter(u => u.sellerStatus === 'approved').length },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} pendingRequests={pendingRequests} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* TOP HEADER */}
        <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center z-10">
            <h2 className="text-lg font-semibold text-slate-200 capitalize">{activeTab} Dashboard</h2>
            <div className="flex items-center gap-4">
                {/* BELL ICON NOTIFICATION */}
                <div className="relative cursor-pointer hover:bg-slate-800 p-2 rounded-full transition" onClick={() => setActiveTab('users')}>
                    <FaBell className="text-slate-400 text-xl" />
                    {pendingRequests > 0 && <span className="absolute top-1 right-1 bg-red-500 w-3 h-3 rounded-full border-2 border-slate-900 animate-pulse"></span>}
                </div>
                {/* PROFILE LINK */}
                <Link to='/profile'>
                    <img src={currentUser.avatar} alt="admin" className="w-9 h-9 rounded-full border border-slate-600 hover:border-blue-500 transition cursor-pointer object-cover" />
                </Link>
            </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-950 to-slate-900">
            
            {loading ? <p className="text-center animate-pulse mt-10">Loading Data...</p> : (
                <>
                {/* --- TAB: OVERVIEW --- */}
                {activeTab === 'overview' && (
                    <div className="animate-fade-in-up">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg group">
                                <h3 className="text-slate-400 text-sm font-bold uppercase">Total Users</h3>
                                <p className="text-3xl font-bold mt-2">{users.length}</p>
                            </div>
                            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg group">
                                <h3 className="text-slate-400 text-sm font-bold uppercase">Total Properties</h3>
                                <p className="text-3xl font-bold mt-2">{listings.length}</p>
                            </div>
                            {/* Pending Requests Card */}
                            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg group relative overflow-hidden">
                                <div className={`absolute right-0 top-0 w-24 h-24 rounded-full blur-2xl transition ${pendingRequests > 0 ? 'bg-red-500/20' : 'bg-slate-500/10'}`}></div>
                                <h3 className="text-slate-400 text-sm font-bold uppercase">Pending Requests</h3>
                                <p className={`text-3xl font-bold mt-2 ${pendingRequests > 0 ? 'text-red-400' : 'text-slate-200'}`}>{pendingRequests}</p>
                            </div>
                            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg group">
                                <h3 className="text-slate-400 text-sm font-bold uppercase">Featured</h3>
                                <p className="text-3xl font-bold mt-2 text-yellow-400">{listings.filter(l => l.featured).length}</p>
                            </div>
                        </div>

                        {/* 2. CHARTS SECTION 📊 */}
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
                            
                            {/* PIE CHART: Rent vs Sale */}
                            <div className='bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col items-center justify-center overflow-x-auto'>
                                <h3 className="text-slate-200 text-lg font-bold mb-4 self-start">Property Distribution</h3>
                                
                                {/* ✅ FIX: Fixed Size Chart (No ResponsiveContainer) */}
                                <PieChart width={320} height={300}>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                    <Legend />
                                </PieChart>
                            </div>

                            {/* BAR CHART: User Roles */}
                            <div className='bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col items-center justify-center overflow-x-auto'>
                                <h3 className="text-slate-200 text-lg font-bold mb-4 self-start">User Statistics</h3>
                                
                                {/* ✅ FIX: Fixed Size Chart (No ResponsiveContainer) */}
                                <BarChart width={350} height={300} data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} cursor={{fill: '#334155', opacity: 0.4}} />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={50} />
                                </BarChart>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: USERS --- */}
                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up">
                        {users.map((user) => (
                            <div key={user._id} onClick={() => setSelectedUser(user)} className={`bg-slate-800 rounded-xl border overflow-hidden hover:border-blue-500/50 transition cursor-pointer group relative ${user.sellerStatus === 'pending' ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : 'border-slate-700'}`}>
                                <div className="h-24 bg-gradient-to-r from-slate-700 to-slate-800"></div>
                                <div className="px-5 pb-5">
                                    <div className="relative -mt-10 mb-3">
                                        <img src={user.avatar} className="w-20 h-20 rounded-full border-4 border-slate-800 object-cover" />
                                        {user.sellerStatus === 'pending' && <span className="absolute bottom-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">Request</span>}
                                        {user.sellerStatus === 'approved' && <span className="absolute bottom-0 right-0 bg-green-500 text-black text-[10px] font-bold px-1 rounded-full">✓</span>}
                                    </div>
                                    <h3 className="font-bold text-lg truncate">{user.username}</h3>
                                    <p className="text-slate-400 text-xs truncate mb-4">{user.email}</p>
                                    
                                    {user.sellerStatus === 'pending' ? (
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={(e) => handleSellerStatus(user._id, 'approved', e)} className="flex-1 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white py-1.5 rounded-lg text-xs font-bold transition">Accept</button>
                                            <button onClick={(e) => handleSellerStatus(user._id, 'rejected', e)} className="flex-1 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white py-1.5 rounded-lg text-xs font-bold transition">Reject</button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                                                {listings.filter(l => l.userRef === user._id).length} Listings
                                            </span>
                                            {user.role !== 'admin' && (
                                                <button onClick={(e) => handleUserDelete(user._id, e)} className="text-slate-500 hover:text-red-500 p-1"><FaTrash /></button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- TAB: LISTINGS --- */}
                {activeTab === 'listings' && (
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden animate-fade-in-up">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900 text-slate-200 uppercase text-xs font-bold">
                                <tr>
                                    <th className="p-4">Property</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Price</th>
                                    <th className="p-4 text-center">Featured</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {listings.map((listing) => (
                                    <tr key={listing._id} className="hover:bg-slate-700/50 transition">
                                        <td className="p-4 flex items-center gap-3">
                                            <img src={listing.imageUrls[0]} className="w-10 h-10 rounded object-cover bg-slate-700" />
                                            <span className="font-medium text-white truncate max-w-[150px]">{listing.name}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${listing.type === 'rent' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                {listing.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-white font-mono">
                                            ${listing.offer ? listing.discountPrice.toLocaleString() : listing.regularPrice.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => handleListingFeature(listing._id)} className="text-lg transition hover:scale-125 focus:outline-none">
                                                {listing.featured ? <FaStar className="text-yellow-400 drop-shadow-glow" /> : <FaStar className="text-slate-600 hover:text-yellow-500" />}
                                            </button>
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-3">
                                            <Link to={`/update-listing/${listing._id}`} className="text-blue-400 hover:bg-blue-500/20 p-2 rounded transition"><FaEdit /></Link>
                                            <button onClick={() => handleListingDelete(listing._id)} className="text-red-400 hover:bg-red-500/20 p-2 rounded transition"><FaTrash /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                </>
            )}
        </main>
      </div>

      {/* --- MODAL --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedUser(null)}></div>
             <div className="bg-slate-800 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col relative z-10 animate-zoomIn text-white">
                <div className="p-5 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src={selectedUser.avatar} className="w-10 h-10 rounded-full" />
                        <div>
                            <h3 className="font-bold">{selectedUser.username}</h3>
                            <p className="text-xs text-slate-400">Viewing Listings</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white"><FaTimes /></button>
                </div>
                <div className="p-6 overflow-y-auto bg-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                     {listings.filter(l => l.userRef === selectedUser._id).map(l => (
                         <div key={l._id} className="bg-slate-700 rounded-xl overflow-hidden group border border-slate-600">
                             <img src={l.imageUrls[0]} className="h-32 w-full object-cover group-hover:scale-105 transition" />
                             <div className="p-3">
                                 <h4 className="font-bold truncate text-sm">{l.name}</h4>
                                 <div className="flex gap-2 mt-2">
                                    <button onClick={() => handleListingDelete(l._id)} className="flex-1 bg-red-500/20 text-red-400 text-xs py-1 rounded hover:bg-red-500 hover:text-white transition">Delete</button>
                                    <Link to={`/update-listing/${l._id}`} className="flex-1 bg-blue-500/20 text-blue-400 text-xs py-1 rounded hover:bg-blue-500 hover:text-white transition text-center">Edit</Link>
                                 </div>
                             </div>
                         </div>
                     ))}
                     {listings.filter(l => l.userRef === selectedUser._id).length === 0 && <p className="col-span-full text-center text-slate-500">No properties found.</p>}
                </div>
             </div>
        </div>
      )}
    </div>
  );
}