import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    FaBoxOpen, FaRupeeSign, FaCalendarAlt, FaCheckCircle, 
    FaExclamationCircle, FaArrowLeft, FaSearch, FaTrash, FaBan 
} from 'react-icons/fa'; 

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/order/history');
        const data = await res.json();
        
        if (data.success === false) {
          setError(true);
          setLoading(false);
          return;
        }
        setOrders(data);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setError(true);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // DELETE FUNCTION
  const handleDeleteOrder = async (orderId) => {
      if(!window.confirm("Are you sure you want to delete this record from history?")) return;

      try {
          const res = await fetch(`/api/order/delete/${orderId}`, {
              method: 'DELETE',
          });
          const data = await res.json();

          if (data.success === false) {
              alert(data.message);
              return;
          }

          setOrders((prev) => prev.filter((order) => order._id !== orderId));

      } catch (error) {
          console.log(error);
      }
  };

  // ✅ CANCEL FUNCTION (Fixed: Using 'data' variable)
  const handleCancelOrder = async (orderId) => {
      if(!window.confirm("Are you sure you want to cancel this booking? The owner will be notified.")) return;

      try {
          const res = await fetch(`/api/order/cancel/${orderId}`, {
              method: 'POST',
          });
          const data = await res.json(); // Ab hum is 'data' ka use karenge

          if (res.ok === false) {
              // Agar koi error aayi (jaise backend se message), to use alert karein
              alert(data.message || "Could not cancel order.");
              return;
          }

          // UI update (Change status to 'cancelled' locally)
          setOrders((prev) => prev.map((order) => 
            order._id === orderId ? { ...order, status: 'cancelled' } : order
          ));
          
          // Success message jo backend ne bheja hai (ya fallback text)
          alert(typeof data === 'string' ? data : "Booking cancelled successfully!");

      } catch (error) {
          console.log(error);
          alert("Something went wrong!");
      }
  };

  return (
    <div className='min-h-screen bg-slate-900 text-slate-200 pb-20'>
      
      <div className='max-w-4xl mx-auto p-4 pt-24'>
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
            <Link to="/profile" className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition text-slate-300 border border-slate-700">
                <FaArrowLeft />
            </Link>
            <div>
                <h1 className='text-3xl font-bold text-white flex items-center gap-3'>
                    Transaction History
                </h1>
                <p className='text-slate-400 text-sm mt-1'>Track your property payments & bookings</p>
            </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
            <div className='flex flex-col items-center justify-center h-60 gap-4'>
                <div className='w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin'></div>
                <p className='text-slate-400 animate-pulse'>Loading your transactions...</p>
            </div>
        )}
        
        {/* ERROR STATE */}
        {error && (
            <div className='bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-center text-red-400'>
                Something went wrong fetching your history. Please try again.
            </div>
        )}

        {/* EMPTY STATE (No Orders) */}
        {!loading && orders.length === 0 && (
            <div className='flex flex-col items-center justify-center gap-6 mt-10 bg-slate-800 p-12 rounded-3xl border border-slate-700 shadow-2xl text-center'>
                 <div className="bg-slate-700/50 p-6 rounded-full shadow-inner">
                    <FaBoxOpen className='text-6xl text-slate-500 opacity-80' />
                 </div>
                 <div className='space-y-2'>
                    <h2 className='text-2xl font-bold text-white'>No transactions yet</h2>
                    <p className='text-slate-400 max-w-sm mx-auto'>
                        It looks like you haven't made any purchases or bookings yet. Start exploring your dream home today!
                    </p>
                 </div>
                 <Link to='/search' className='flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg hover:shadow-indigo-500/25'>
                    <FaSearch /> Browse Properties
                 </Link>
            </div>
        )}

        {/* ORDER LIST */}
        <div className='flex flex-col gap-5'>
            {!loading && orders.length > 0 && orders.map((order) => (
            <div key={order._id} className='relative bg-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row gap-5 border border-slate-700 shadow-lg hover:shadow-xl hover:border-slate-600 transition-all group'>
                
                {/* DELETE BUTTON (Top Right) */}
                <button 
                    onClick={() => handleDeleteOrder(order._id)}
                    className='absolute top-4 right-4 text-slate-600 hover:text-red-500 transition-colors p-2 z-10'
                    title="Delete Transaction History"
                >
                    <FaTrash />
                </button>

                {/* 1. Property Image */}
                <Link to={`/listing/${order.listingRef?._id}`} className='w-full sm:w-40 h-32 flex-shrink-0 bg-slate-900 rounded-xl overflow-hidden relative'>
                {order.listingRef?.imageUrls?.[0] ? (
                    <img 
                        src={order.listingRef.imageUrls[0]} 
                        alt="property" 
                        className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500' 
                    />
                ) : (
                    <div className='w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-1'>
                        <FaExclamationCircle className='text-xl' /> Listing Deleted
                    </div>
                )}
                </Link>

                {/* 2. Order Details */}
                <div className='flex-1 flex flex-col justify-between py-1 pr-10'>
                    <div>
                        <div className='flex flex-wrap items-center gap-3 mb-2'>
                            <h3 className='text-xl font-bold text-white truncate max-w-[200px] sm:max-w-xs'>
                                {order.listingRef?.name || 'Unknown Property'}
                            </h3>
                            
                            {/* STATUS BADGES */}
                            {order.status === 'success' ? (
                                <span className='text-green-400 flex items-center gap-1.5 bg-green-500/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-green-500/20'>
                                    <FaCheckCircle /> Paid
                                </span>
                            ) : order.status === 'cancelled' ? (
                                <span className='text-orange-400 flex items-center gap-1.5 bg-orange-500/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-orange-500/20'>
                                    <FaBan /> Cancelled
                                </span>
                            ) : (
                                <span className='text-red-400 flex items-center gap-1.5 bg-red-500/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-red-500/20'>
                                    <FaExclamationCircle /> Failed
                                </span>
                            )}
                        </div>
                        
                        <p className='text-slate-400 text-xs font-mono bg-slate-900/60 inline-block px-2 py-1 rounded border border-slate-700/50 mb-2'>
                            ID: <span className="select-all">{order.orderId || order._id}</span>
                        </p>
                    </div>
                    
                    <div className='flex items-center gap-6 text-sm text-slate-300'>
                        <span className='flex items-center gap-2'>
                            <FaCalendarAlt className='text-indigo-400' />
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>

                {/* 3. Amount & Action */}
                <div className='flex flex-row sm:flex-col items-center justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-700 pt-4 sm:pt-0 sm:pl-6 min-w-[140px]'>
                    <div className='text-right sm:text-center'>
                        <p className='text-slate-500 text-xs uppercase font-bold tracking-wider mb-1'>Total Amount</p>
                        <p className='text-2xl font-bold text-green-400 flex items-center justify-end sm:justify-center'>
                            <FaRupeeSign className='text-lg' />
                            {order.amount.toLocaleString('en-IN')}
                        </p>
                    </div>
                    
                    {/* CANCEL BUTTON (Only if status is success) */}
                    {order.status === 'success' && (
                        <button 
                            onClick={() => handleCancelOrder(order._id)}
                            className='hidden sm:inline-block mt-2 text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1 rounded hover:bg-red-500/10 transition'
                        >
                            Cancel Booking
                        </button>
                    )}

                    {/* View Property Button */}
                    <Link to={`/listing/${order.listingRef?._id}`} className='hidden sm:inline-block mt-2 text-xs text-blue-400 hover:text-blue-300 hover:underline'>
                        View Details
                    </Link>

                    {/* Mobile Cancel Button */}
                    {order.status === 'success' && (
                         <button 
                            onClick={() => handleCancelOrder(order._id)}
                            className='sm:hidden text-xs text-red-400 hover:text-red-300 font-bold'
                         >
                            Cancel
                         </button>
                    )}
                </div>

            </div>
            ))}
        </div>
      </div>
    </div>
  );
}