import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { HiCheck, HiX } from 'react-icons/hi';
import { FaTrash, FaUserTie } from 'react-icons/fa';

export default function DashUsers() {
  const { currentUser } = useSelector((state) => state.user);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`/api/user/getusers`);
        const data = await res.json();
        if (res.ok) {
          setUsers(data);
        }
      } catch (error) {
        console.log(error.message);
      }
    };
    // ✅ FIX: currentUser.role check yahan hai, isliye dependency mein add kiya
    if (currentUser.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser._id, currentUser.role]); // ✅ Added currentUser.role here

  // --- HANDLE DELETE USER ---
  const handleDeleteUser = async (userId) => {
    try {
        const res = await fetch(`/api/user/delete/${userId}`, {
            method: 'DELETE',
        });
        const data = await res.json();
        if (res.ok) {
            setUsers((prev) => prev.filter((user) => user._id !== userId));
            alert("User deleted successfully");
        } else {
            console.log(data.message);
        }
    } catch (error) {
        console.log(error.message);
    }
  };

  // --- HANDLE SELLER VERIFICATION ---
  const handleVerifySeller = async (userId, status) => {
    try {
        const res = await fetch(`/api/user/verify-seller/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }), // 'approved' or 'rejected'
        });
        
        if (res.ok) {
            setUsers((prev) => 
                prev.map((user) => 
                    user._id === userId ? { ...user, sellerStatus: status } : user
                )
            );
            alert(`User ${status === 'approved' ? 'Verified' : 'Rejected'} successfully!`);
        } else {
            alert("Something went wrong");
        }
    } catch (error) {
        console.log(error);
    }
  };

  return (
    <div className='w-full p-5'>
      <h1 className='text-2xl font-bold mb-5 text-slate-200'>Users Dashboard</h1>
      
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {currentUser.role === 'admin' && users.length > 0 ? (
          users.map((user) => (
            <div key={user._id} className='bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col gap-4 relative overflow-hidden'>
                
                {/* User Info */}
                <div className="flex items-start gap-4">
                    <img src={user.avatar} alt={user.username} className="w-14 h-14 rounded-full object-cover border-2 border-slate-600"/>
                    <div className='flex-1 min-w-0'>
                        <h3 className="text-lg font-bold text-white truncate flex items-center gap-2">
                            {user.username}
                            {user.role === 'admin' && <span className="bg-purple-600 text-xs px-2 py-0.5 rounded text-white">Admin</span>}
                        </h3>
                        <p className="text-sm text-slate-400 truncate">{user.email}</p>
                    </div>
                </div>

                {/* Seller Status Logic */}
                <div className='bg-slate-900/50 p-3 rounded-lg border border-slate-700/50'>
                    <p className='text-xs uppercase text-slate-500 font-bold mb-2 flex items-center gap-2'>
                        <FaUserTie /> Seller Status
                    </p>
                    
                    {user.sellerStatus === 'pending' ? (
                        <div>
                            <span className="text-yellow-400 text-sm font-bold animate-pulse">⏳ Verification Requested</span>
                            <div className="flex gap-2 mt-3">
                                <button onClick={() => handleVerifySeller(user._id, 'approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded flex items-center justify-center gap-1">
                                    <HiCheck className="text-lg"/> Approve
                                </button>
                                <button onClick={() => handleVerifySeller(user._id, 'rejected')} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded flex items-center justify-center gap-1">
                                    <HiX className="text-lg"/> Reject
                                </button>
                            </div>
                        </div>
                    ) : user.sellerStatus === 'approved' ? (
                        <div className="flex items-center justify-between">
                            <span className="text-green-400 text-sm font-bold flex items-center gap-1"><HiCheck className="bg-green-500/20 rounded-full p-0.5 text-xl"/> Verified Seller</span>
                            <button onClick={() => handleVerifySeller(user._id, 'regular')} className="text-xs text-slate-500 underline hover:text-red-400">Revoke</button>
                        </div>
                    ) : user.sellerStatus === 'rejected' ? (
                        <span className="text-red-400 text-sm font-bold">❌ Application Rejected</span>
                    ) : (
                        <span className="text-slate-500 text-sm">Regular User</span>
                    )}
                </div>

                {/* Delete Button */}
                {user.role !== 'admin' && (
                    <button onClick={() => { if(window.confirm("Are you sure?")) handleDeleteUser(user._id); }} className='absolute top-3 right-3 text-slate-600 hover:text-red-500 transition-colors'>
                        <FaTrash />
                    </button>
                )}
            </div>
          ))
        ) : (
          <p className='text-slate-400'>No users found!</p>
        )}
      </div>
    </div>
  );
}