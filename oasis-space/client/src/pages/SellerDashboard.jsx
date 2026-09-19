import { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FaHome, FaEye, FaCheckCircle, FaEdit,
  FaTrash, FaPlus, FaTag, FaRupeeSign, FaStar, FaRegStar, FaChartPie, FaChartLine, FaBuilding, FaClock, FaCreditCard
} from 'react-icons/fa';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatPrice } from '../utils/currencyFormatter';
import RazorpayBtn from '../components/RazorpayBtn';
import { getListingFee } from '../utils/fees';

export default function SellerDashboard() {
  const { currentUser } = useSelector((state) => state.user);
  const { currency, rates } = useSelector((state) => state.currency);
  const [stats, setStats] = useState({
    totalListings: 0, activeListings: 0, pendingListings: 0,
    rentListings: 0, saleListings: 0, offerListings: 0,
    soldCount: 0, rentedCount: 0, bookingsCount: 0, bookingsValue: 0
  });
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingListing, setPayingListing] = useState(null);
  const tableRef = useRef(null);

  const fetchDashboardData = useCallback(async () => {
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
  }, [currentUser._id]);

  useEffect(() => {
    // Loading state is only set async after the fetch settles; no cascading renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleListingPaid = async () => {
    setPayingListing(null);
    await fetchDashboardData();
  };

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
      const res = await fetch(`/api/listing/status/${listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success === false) return;
      setListings((prev) => prev.map((item) =>
        item._id === listingId ? { ...item, status: newStatus } : item
      ));
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
    <div className='p-6 max-w-7xl mx-auto min-h-screen' style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
        <div>
          <h1 className='text-3xl font-bold'>Seller <span className='text-blue-500'>Dashboard</span></h1>
          <p className='text-slate-400 text-sm'>Financial Overview & Property Management</p>
        </div>
        <Link to='/create-listing' className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-blue-900/20'>
          <FaPlus /> Add New Property
        </Link>
      </div>

      {/* --- SELLER SUBSCRIPTION PACK STATUS & TOP-UP CARD --- */}
      {(() => {
        const sub = currentUser?.sellerSubscription;
        const isActive = sub && sub.status === 'active' && sub.endDate && new Date(sub.endDate) > new Date();
        const remaining = isActive ? Math.max(0, (sub.totalQuota || 0) - (sub.usedQuota || 0)) : 0;
        const total = sub?.totalQuota || 0;
        const percent = total > 0 ? Math.min(100, Math.round(((sub?.usedQuota || 0) / total) * 100)) : 0;

        return (
          <div className='p-6 rounded-2xl border shadow-xl mb-8 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/40 border-indigo-500/30'>
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-6'>
              <div className='space-y-2 flex-1'>
                <div className='flex items-center gap-3'>
                  <span className='p-2 bg-indigo-500/20 text-indigo-400 rounded-lg text-lg'>
                    <FaCreditCard />
                  </span>
                  <h2 className='text-xl font-bold text-white'>
                    Seller Pro Pack <span className='text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ml-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'>
                      {isActive ? (remaining > 0 ? 'Active' : 'Quota Exhausted') : 'Get Pack'}
                    </span>
                  </h2>
                </div>

                {isActive ? (
                  <div>
                    <p className='text-slate-300 text-sm'>
                      You have <span className='font-bold text-emerald-400'>{remaining} of {total}</span> Sale listing credits available. Sale listings publish instantly for FREE!
                    </p>
                    <div className='w-full max-w-md bg-slate-700/50 rounded-full h-2.5 mt-2.5 overflow-hidden'>
                      <div className='bg-gradient-to-r from-blue-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500' style={{ width: `${percent}%` }}></div>
                    </div>
                    <p className='text-xs text-slate-400 mt-1.5'>
                      Valid till: <span className='text-slate-200 font-medium'>{new Date(sub.endDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span> ({total - remaining} of {total} used)
                    </p>
                  </div>
                ) : (
                  <p className='text-slate-300 text-sm max-w-2xl'>
                    Get the <span className='font-bold text-white'>Seller Pro Pack for ₹5,100</span> to list up to <span className='font-bold text-emerald-400'>10 Sale properties</span> (effective cost ₹510/listing vs ₹5,100 each). 1-year validity with instant live publishing!
                  </p>
                )}
              </div>

              <div className='w-full md:w-auto flex flex-col sm:flex-row gap-3'>
                <RazorpayBtn
                  orderType="seller_subscription"
                  btnText={isActive ? (remaining > 0 ? "Top-up 10 Credits (₹5,100)" : "Renew Pack (₹5,100)") : "Buy Seller Pack (₹5,100 for 10)"}
                  onSuccess={() => fetchDashboardData()}
                  customStyle="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 text-sm cursor-pointer whitespace-nowrap"
                />
              </div>
            </div>
          </div>
        );
      })()}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10'>
        <div className='p-6 rounded-2xl border shadow-lg' style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className='flex justify-between items-start'>
            <div className='p-3 bg-green-500/10 text-green-400 rounded-lg'><FaRupeeSign className='text-xl' /></div>
            <span className='text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded'>Finance</span>
          </div>
          <p className='text-slate-400 text-sm mt-4 font-medium'>Bookings Value (received)</p>
          <h3 className='text-3xl font-bold mt-1' style={{ color: 'var(--text-heading)' }}>{formatPrice(stats.bookingsValue || 0, currency, rates)}</h3>
          <p className='text-[11px] text-slate-500 mt-1'>{stats.bookingsCount} successful booking payment{stats.bookingsCount === 1 ? '' : 's'}</p>
        </div>

        <div className='p-6 rounded-2xl border shadow-lg' style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className='p-3 bg-blue-500/10 text-blue-400 rounded-lg w-fit'><FaChartPie className='text-xl' /></div>
          <p className='text-slate-400 text-sm mt-4 font-medium'>Deals Closed</p>
          <div className='flex items-baseline gap-2 mt-1'>
            <h3 className='text-3xl font-bold'>{stats.soldCount + stats.rentedCount}</h3>
            <span className='text-xs text-slate-500'>({stats.soldCount} Sold, {stats.rentedCount} Rented)</span>
          </div>
        </div>

        <div className='p-6 rounded-2xl border shadow-lg' style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className='p-3 bg-orange-500/10 text-orange-400 rounded-lg w-fit'><FaHome className='text-xl' /></div>
          <p className='text-slate-400 text-sm mt-4 font-medium'>Active Inventory</p>
          <h3 className='text-3xl font-bold mt-1'>{stats.activeListings} <span className='text-sm text-slate-500 font-normal'>/ {stats.totalListings} Total</span></h3>
        </div>

        <div className='p-6 rounded-2xl border shadow-lg' style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className='p-3 bg-purple-500/10 text-purple-400 rounded-lg w-fit'><FaClock className='text-xl' /></div>
          <p className='text-slate-400 text-sm mt-4 font-medium'>Pending Listings</p>
          <h3 className='text-3xl font-bold mt-1'>{stats.pendingListings}</h3>
          <p className='text-[11px] text-slate-500 mt-1'>Awaiting listing-fee payment to go live</p>
        </div>
      </div>

      {/* --- CHARTS SECTION --- */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10'>
        {/* Pie Chart: Rent vs Sale */}
        <div className='p-6 rounded-2xl border shadow-xl' style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <h3 className='font-bold text-lg mb-4 flex items-center gap-2' style={{ color: 'var(--text-heading)' }}>
            <FaChartLine className='text-blue-400' /> Property Distribution
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'For Sale', value: stats.saleListings || 0 },
                  { name: 'For Rent', value: stats.rentListings || 0 },
                ]}
                cx='50%'
                cy='50%'
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey='value'
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={true}
              >
                <Cell fill='#10b981' />
                <Cell fill='#3b82f6' />
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart: Status Breakdown */}
        <div className='p-6 rounded-2xl border shadow-xl' style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <h3 className='font-bold text-lg mb-4 flex items-center gap-2' style={{ color: 'var(--text-heading)' }}>
            <FaBuilding className='text-emerald-400' /> Status Breakdown
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={[
              { name: 'Available', count: stats.activeListings || 0 },
              { name: 'Pending', count: stats.pendingListings || 0 },
              { name: 'Sold', count: stats.soldCount || 0 },
              { name: 'Rented', count: stats.rentedCount || 0 },
            ]} barSize={40}>
              <XAxis dataKey='name' tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
              <Bar dataKey='count' radius={[8, 8, 0, 0]}>
                <Cell fill='#10b981' />
                <Cell fill='#f59e0b' />
                <Cell fill='#ef4444' />
                <Cell fill='#f97316' />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- STATUS SUMMARY CARDS --- */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-10'>
        <div className='bg-gradient-to-br from-emerald-600/20 to-slate-800 p-5 rounded-2xl border border-emerald-500/30 shadow-lg'>
          <FaHome className='text-emerald-400 text-2xl mb-2' />
          <p className='text-3xl font-bold text-white'>{stats.activeListings}</p>
          <span className='text-xs uppercase text-emerald-300 font-semibold'>Active Listings</span>
        </div>
        <div className='bg-gradient-to-br from-red-600/20 to-slate-800 p-5 rounded-2xl border border-red-500/30 shadow-lg'>
          <FaCheckCircle className='text-red-400 text-2xl mb-2' />
          <p className='text-3xl font-bold text-white'>{stats.soldCount}</p>
          <span className='text-xs uppercase text-red-300 font-semibold'>Sold</span>
        </div>
        <div className='bg-gradient-to-br from-orange-600/20 to-slate-800 p-5 rounded-2xl border border-orange-500/30 shadow-lg'>
          <FaTag className='text-orange-400 text-2xl mb-2' />
          <p className='text-3xl font-bold text-white'>{stats.rentedCount}</p>
          <span className='text-xs uppercase text-orange-300 font-semibold'>Rented</span>
        </div>
        <div className='bg-gradient-to-br from-purple-600/20 to-slate-800 p-5 rounded-2xl border border-purple-500/30 shadow-lg'>
          <FaStar className='text-purple-400 text-2xl mb-2' />
          <p className='text-3xl font-bold text-white'>{stats.offerListings}</p>
          <span className='text-xs uppercase text-purple-300 font-semibold'>Active Offers</span>
        </div>
      </div>

      {/* --- RECENT LISTINGS PREVIEW --- */}
      {listings.length > 0 && (
        <div className='bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden mb-10'>
          <div className='flex justify-between items-center p-5 border-b border-slate-700'>
            <h3 className='text-white font-bold text-lg flex items-center gap-2'>
              <FaClock className='text-violet-400' /> Recent Listings
            </h3>
            <button onClick={() => tableRef.current?.scrollIntoView({ behavior: 'smooth' })} className='text-blue-400 hover:text-blue-300 text-sm font-semibold transition'>
              View All →
            </button>
          </div>
          <table className='w-full text-left text-sm text-gray-400'>
            <thead className='bg-slate-900/60 uppercase text-[11px] text-slate-500'>
              <tr>
                <th className='p-3 pl-5'>Property</th>
                <th className='p-3'>Type</th>
                <th className='p-3'>Price</th>
                <th className='p-3'>Status</th>
                <th className='p-3'>Listed On</th>
                <th className='p-3 text-right pr-5'>Action</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-700/50'>
              {listings.slice(0, 5).map((listing) => (
                <tr key={listing._id} className='hover:bg-slate-700/30 transition'>
                  <td className='p-3 pl-5'>
                    <div className='flex gap-3 items-center'>
                      <img src={listing.imageUrls?.[0]} className='w-10 h-10 rounded-lg object-cover border border-slate-600' alt='' />
                      <div>
                        <p className='text-white font-semibold truncate w-32 md:w-44'>{listing.name}</p>
                        <p className='text-[11px] text-slate-500 truncate w-32 md:w-44'>{listing.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className='p-3'>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${listing.type === 'rent' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                      {listing.type}
                    </span>
                  </td>
                  <td className='p-3'>{formatPrice(listing.regularPrice, currency, rates)}</td>
                  <td className='p-3'>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${listing.status === 'sold' ? 'bg-red-500/20 text-red-400' :
                        listing.status === 'rented' ? 'bg-orange-500/20 text-orange-400' :
                          listing.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-emerald-500/20 text-emerald-400'
                      }`}>
                      {listing.status || 'available'}
                    </span>
                  </td>
                  <td className='p-3 text-slate-400 text-xs'>{new Date(listing.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className='p-3 text-right pr-5'>
                    <Link to={`/listing/${listing._id}`} className='text-blue-400 hover:text-blue-300 text-xs font-semibold transition'>
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div ref={tableRef} className='bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl'>
        <div className='p-6 border-b border-slate-700 bg-slate-800/50'>
          <h2 className='text-xl font-bold text-white flex items-center gap-2'>
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
                    {currentUser.role === 'admin' ? (
                      <button onClick={() => handleFeaturedToggle(listing._id, listing.featured)} className={`text-2xl transition-transform hover:scale-110 ${listing.featured ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-200'}`} title='Toggle Featured'>
                        {listing.featured ? <FaStar /> : <FaRegStar />}
                      </button>
                    ) : (
                      <span className={`text-2xl ${listing.featured ? 'text-yellow-400' : 'text-slate-600'}`} title={listing.featured ? 'Featured (VIP)' : 'Not featured'}>
                        {listing.featured ? <FaStar /> : <FaRegStar />}
                      </span>
                    )}
                  </td>
                  <td className='p-5'>
                    <div className='flex items-center gap-4'>
                      <div className='relative'>
                        <img src={listing.imageUrls?.[0]} alt="" className='w-14 h-14 rounded-xl object-cover bg-slate-700 border border-slate-600' />
                        {listing.offer && <div className='absolute -top-2 -right-2 bg-purple-600 text-[8px] font-bold px-1.5 py-0.5 rounded-md'>OFFER</div>}
                      </div>
                      <div>
                        <Link to={`/listing/${listing._id}`} className='font-bold text-white hover:text-blue-400 transition-colors truncate w-48 block'>{listing.name}</Link>
                        <p className='text-xs text-slate-500 truncate w-40'>{listing.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className='p-5'>
                    {listing.status === 'pending' ? (
                      getListingFee(listing.type) > 0 ? (
                        <span className='text-xs font-bold uppercase px-2 py-1.5 rounded-lg border bg-slate-900 text-yellow-400 border-yellow-500/50'>
                          Pending fee
                        </span>
                      ) : (
                        <span className='text-xs font-bold uppercase px-2 py-1.5 rounded-lg border bg-slate-900 text-yellow-400 border-yellow-500/50'>
                          Pending — publish free
                        </span>
                      )
                    ) : (
                    <select value={listing.status || 'available'} onChange={(e) => handleStatusChange(listing._id, e.target.value)} className={`text-xs font-bold uppercase px-2 py-1.5 rounded-lg border bg-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${listing.status === 'sold' ? 'text-green-500 border-green-500/50' : listing.status === 'rented' ? 'text-orange-500 border-orange-500/50' : 'text-blue-400 border-blue-500/50'}`}>
                      <option value="available">Available</option>
                      {listing.type === 'sale' && <option value="sold">Mark as Sold</option>}
                      {listing.type === 'rent' && <option value="rented">Mark as Rented</option>}
                    </select>
                    )}
                  </td>
                  <td className='p-5'>
                    <p className='font-bold text-white'>{formatPrice(listing.regularPrice, currency, rates)}</p>
                    {listing.type === 'rent' && <p className='text-[10px] text-slate-500'>per month</p>}
                  </td>
                  <td className='p-5 text-sm text-slate-400 font-medium'>
                    {new Date(listing.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className='p-5'>
                    <div className='flex justify-center gap-2'>
                      {listing.status === 'pending' ? (
                        getListingFee(listing.type) > 0 ? (
                          <button
                            onClick={() => setPayingListing(listing)}
                            className='p-2.5 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold uppercase'
                            title='Pay listing fee to publish'
                          >
                            <FaCreditCard /> Pay ₹{getListingFee(listing.type).toLocaleString('en-IN')}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(listing._id, 'available')}
                            className='p-2.5 bg-green-600 text-white hover:bg-green-500 rounded-xl transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold uppercase'
                            title='Publish this rent listing free'
                          >
                            Publish Free
                          </button>
                        )
                      ) : (
                        <>
                          <Link to={`/update-listing/${listing._id}`} className='p-2.5 bg-slate-700 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-sm' title='Edit'>
                            <FaEdit />
                          </Link>
                          <button onClick={() => handleDeleteListing(listing._id)} className='p-2.5 bg-slate-700 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm' title='Delete'>
                            <FaTrash />
                          </button>
                        </>
                      )}
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

      {/* --- PAY LISTING FEE MODAL --- */}
      {payingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-all overflow-y-auto">
          <div className="bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 relative overflow-hidden animate-fadeIn my-auto">
            <div className="p-8">
              <h3 className="text-xl font-bold text-white mb-2">Publish &quot;{payingListing.name}&quot;</h3>
              <p className="text-slate-400 text-sm mb-6">
                Pay the one-time listing fee to publish this property. It goes live immediately after the payment succeeds.
              </p>

              <div className="bg-slate-900/60 rounded-xl border border-slate-700 p-5 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className='text-slate-400 text-sm'>Listing Type</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${payingListing.type === 'rent' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                    For {payingListing.type === 'rent' ? 'Rent' : 'Sale'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className='text-slate-400 text-sm'>Listing Fee (one-time)</span>
                  <span className='text-3xl font-black text-white'>₹{getListingFee(payingListing.type).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <RazorpayBtn
                listing={payingListing}
                btnText={`Pay ₹${getListingFee(payingListing.type).toLocaleString('en-IN')} & Publish`}
                onSuccess={handleListingPaid}
                customStyle="w-full justify-center flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-4 rounded-xl font-bold transition-all shadow-lg shadow-green-900/30 border border-green-500/50"
              />

              <button
                onClick={() => setPayingListing(null)}
                className='mt-4 w-full text-center text-slate-400 hover:text-slate-200 text-sm font-semibold transition'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}