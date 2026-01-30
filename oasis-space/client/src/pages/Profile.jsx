import { useSelector, useDispatch } from 'react-redux';
import { useRef, useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import {
  updateUserStart, updateUserSuccess, updateUserFailure,
  deleteUserFailure, deleteUserStart, deleteUserSuccess,
  signOutUserStart,
} from '../redux/user/userSlice';
import { Link } from 'react-router-dom';
import { 
    FaTimes, FaCamera, FaUserEdit, FaSignOutAlt, FaList, 
    FaHeart, FaUserShield, FaUserTag, FaPhone, FaEnvelope, FaLock,
    FaBoxOpen // ✅ NEW ICON IMPORT
} from 'react-icons/fa';

export default function Profile({ onClose }) {
  const fileRef = useRef(null);
  const { currentUser, loading, error } = useSelector((state) => state.user);
  const [file, setFile] = useState(undefined);
  const [uploading, setUploading] = useState(false);
  
  // ✅ Initialize FormData with current values
  const [formData, setFormData] = useState({
      username: currentUser.username,
      email: currentUser.email,
      mobile: currentUser.mobile === '0000000000' ? '' : currentUser.mobile, // Hide dummy mobile
      password: '',
      avatar: currentUser.avatar
  });

  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [userListings, setUserListings] = useState([]);
  const [showListingsError, setShowListingsError] = useState(false);
  const [savedListings, setSavedListings] = useState([]);
  const [showSavedError, setShowSavedError] = useState(false);
  
  const dispatch = useDispatch();

  // 🔍 Detect Google User (Heuristic based on Avatar URL or lack of password change capability)
  // Google avatars usually come from googleusercontent.com
  const isGoogleUser = currentUser.avatar?.includes('googleusercontent.com');

  // 1. 🔥 Live Sync & Auto Logout on 401 Token Expiry
  useEffect(() => {
      const syncUserData = async () => {
          try {
              if(!currentUser) return; 
              const res = await fetch(`/api/user/${currentUser._id}`);
              
              if (res.status === 401 || res.status === 403) {
                  console.log("Session expired. Logging out...");
                  dispatch(signOutUserStart());
                  await fetch('/api/auth/signout');
                  dispatch(deleteUserSuccess({})); 
                  if(onClose) onClose(); 
                  return;
              }

              const data = await res.json();
              if (res.ok) {
                  // Update Redux if data changed
                  if(data.sellerStatus !== currentUser.sellerStatus || data.avatar !== currentUser.avatar) {
                      dispatch(updateUserSuccess(data));
                  }
              }
          } catch (err) { 
            console.log("Sync Error:", err); 
          }
      };
      syncUserData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // 2. Image Upload Logic
  useEffect(() => {
    if (file) handleFileUpload(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const handleFileUpload = async (file) => {
    if (file.size > 5 * 1024 * 1024) return alert('File too large (Max 5MB)');
    setUploading(true);

    try {
      const fileName = `avatar_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, avatar: publicUrl }));
      await updateProfile({ ...formData, avatar: publicUrl });
      setUploading(false);
    } catch (err) {
      console.log(err);
      setUploading(false);
    }
  };

  const updateProfile = async (dataToUpdate) => {
      try {
          dispatch(updateUserStart());
          const res = await fetch(`/api/user/update/${currentUser._id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToUpdate),
          });
          const data = await res.json();
          if (data.success === false) {
            dispatch(updateUserFailure(data.message));
            return;
          }
          dispatch(updateUserSuccess(data));
          setUpdateSuccess(true);
          setIsEditing(false); // Close edit mode on success
          setTimeout(() => setUpdateSuccess(false), 3000);
      } catch (err) {
          dispatch(updateUserFailure(err.message));
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile(formData);
  };

  // 3. Action Handlers
  const handleSellerRequest = async () => {
    try {
        const res = await fetch(`/api/user/request-seller/${currentUser._id}`, { method: 'POST' });
        const data = await res.json();
        if (data.success === false) return;
        dispatch(updateUserSuccess(data)); // Update Redux with 'pending' status
        alert("Request Sent Successfully!");
    } catch (error) { 
        console.log(error);
    }
  };

  const handleSignOut = async () => {
    try {
      dispatch(signOutUserStart());
      await fetch('/api/auth/signout');
      if(onClose) onClose();
    } catch (error) { 
        console.log(error);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm("Are you sure you want to delete your account?")) return;
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
      if(onClose) onClose();
    } catch (error) { 
        dispatch(deleteUserFailure(error.message));
    }
  };

  const handleShowListings = async () => {
    try {
      setShowListingsError(false);
      const res = await fetch(`/api/user/listings/${currentUser._id}`);
      const data = await res.json();
      if (data.success === false) { setShowListingsError(true); return; }
      setUserListings(data);
    } catch (err) { 
        console.log(err);
        setShowListingsError(true); 
    }
  };

  const handleListingDelete = async (listingId) => {
    try {
      const res = await fetch(`/api/listing/delete/${listingId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success === false) return;
      setUserListings((prev) => prev.filter((listing) => listing._id !== listingId));
    } catch (error) { 
        console.log(error.message);
    }
  };

  const handleShowSavedListings = async () => {
    try {
      setShowSavedError(false);
      const res = await fetch(`/api/user/saved`);
      const data = await res.json();
      if (data.success === false) { setShowSavedError(true); return; }
      setSavedListings(data);
    } catch (error) { 
        console.log(error);
        setShowSavedError(true); 
    }
  };

  // Helper for Seller Button Text/Color
  const getSellerStatusUI = () => {
      switch(currentUser.sellerStatus) {
          case 'approved': return { text: 'Verified Seller', color: 'text-green-400', icon: '✅' };
          case 'pending': return { text: 'Verification Pending...', color: 'text-yellow-400', icon: '⏳' };
          case 'rejected': return { text: 'Application Rejected (Re-apply)', color: 'text-red-400', icon: '❌' };
          default: return { text: 'Become a Seller', color: 'text-blue-400', icon: '💼' };
      }
  };
  const sellerUI = getSellerStatusUI();

  return (
    <div className='fixed inset-0 z-50 flex justify-end items-start p-4 sm:p-6 pt-20'>
      
      {/* Backdrop */}
      <div className='fixed inset-0' onClick={onClose}></div>

      {/* Main Card */}
      <div className='relative bg-[#1e293b] text-slate-200 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-[380px] max-h-[85vh] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-5 duration-200'>
        
        <button onClick={onClose} className='absolute top-3 right-3 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-700 transition z-10'>
            <FaTimes />
        </button>

        {/* Header */}
        <div className='flex flex-col items-center pt-8 pb-4 px-6 bg-slate-800/50'>
            <input onChange={(e) => setFile(e.target.files[0])} type='file' ref={fileRef} hidden accept='image/*' />
            <div className='relative group cursor-pointer' onClick={() => fileRef.current.click()}>
                <img src={formData.avatar || currentUser.avatar} alt='profile' className='w-20 h-20 rounded-full object-cover border-4 border-slate-600 shadow-lg group-hover:border-slate-500 transition' />
                <div className='absolute bottom-0 right-0 bg-slate-700 p-1.5 rounded-full border border-slate-500 text-white text-xs group-hover:bg-blue-600 transition'><FaCamera /></div>
            </div>
            
            <h2 className='text-xl font-bold mt-3 text-white'>{currentUser.username}</h2>
            <p className='text-xs text-slate-400'>{currentUser.email}</p>

            <div className='flex gap-2 mt-2'>
                {currentUser.role === 'admin' && <span className='bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1'><FaUserShield /> ADMIN</span>}
                {currentUser.sellerStatus === 'approved' && <span className='bg-green-500/20 text-green-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30 flex items-center gap-1'><FaUserTag /> SELLER</span>}
            </div>
            
            {uploading && <p className='text-xs text-blue-400 mt-1 animate-pulse'>Updating photo...</p>}
            {updateSuccess && <p className='text-xs text-green-400 mt-1'>Profile updated successfully!</p>}
            {error && <p className='text-xs text-red-400 mt-1 bg-red-900/20 p-1 rounded'>{error}</p>}
        </div>

        <div className='px-4 pb-4 space-y-4'>
            
            {/* Edit Button / Form */}
            {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className='w-full text-xs border border-slate-600 px-4 py-2 rounded-full hover:bg-slate-700 transition flex items-center justify-center gap-2 font-medium'>
                    <FaUserEdit /> Edit Profile
                </button>
            ) : (
                <form onSubmit={handleSubmit} className='bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3'>
                    {/* Username */}
                    <div className='relative'>
                        <span className='absolute left-3 top-2.5 text-slate-500'><FaUserEdit /></span>
                        <input 
                            type='text' 
                            value={formData.username} 
                            className='w-full bg-slate-900 border border-slate-600 p-2 pl-9 rounded text-sm text-white focus:border-blue-500 outline-none' 
                            onChange={(e) => setFormData({...formData, username: e.target.value})} 
                            placeholder="Username" 
                        />
                    </div>
                    
                    {/* Mobile Number (Updated) */}
                    <div className='relative'>
                        <span className='absolute left-3 top-2.5 text-slate-500'><FaPhone /></span>
                        <input 
                            type='text' 
                            value={formData.mobile} 
                            className='w-full bg-slate-900 border border-slate-600 p-2 pl-9 rounded text-sm text-white focus:border-blue-500 outline-none' 
                            onChange={(e) => setFormData({...formData, mobile: e.target.value})} 
                            placeholder="Mobile Number" 
                        />
                    </div>

                    {/* Password (Disabled for Google Users) */}
                    <div className='relative'>
                        <span className='absolute left-3 top-2.5 text-slate-500'><FaLock /></span>
                        <input 
                            type='password' 
                            id='password' 
                            disabled={isGoogleUser}
                            className={`w-full bg-slate-900 border border-slate-600 p-2 pl-9 rounded text-sm text-white focus:border-blue-500 outline-none ${isGoogleUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            placeholder={isGoogleUser ? "Password managed by Google" : "New Password"} 
                        />
                    </div>

                    <div className='flex gap-2 pt-2'>
                        <button disabled={loading} className='flex-1 bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded text-xs font-bold transition'>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} className='flex-1 bg-slate-700 hover:bg-slate-600 text-white py-1.5 rounded text-xs transition'>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* MAIN ACTIONS */}
            <div className='bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50'>
                {currentUser.role === 'admin' && (
                    <Link to="/dashboard" onClick={onClose} className='p-3.5 hover:bg-slate-700 flex items-center gap-3 transition border-b border-slate-700/50'>
                        <span className='text-purple-400'><FaUserShield /></span> <span className='text-sm font-medium'>Admin Dashboard</span>
                    </Link>
                )}
                
                <Link to="/create-listing" onClick={onClose} className='p-3.5 hover:bg-slate-700 flex items-center gap-3 transition border-b border-slate-700/50'>
                    <span className='text-green-400'>🏠</span> <span className='text-sm font-medium'>List a Property</span>
                </Link>

                {/* ✅ ORDER HISTORY BUTTON (Added Here) */}
                <Link to="/order-history" onClick={onClose} className='p-3.5 hover:bg-slate-700 flex items-center gap-3 transition border-b border-slate-700/50'>
                    <span className='text-yellow-400'><FaBoxOpen /></span> <span className='text-sm font-medium'>Order History</span>
                </Link>
                
                {/* Seller Request Logic */}
                {currentUser.role !== 'admin' && currentUser.sellerStatus !== 'approved' && (
                    <div 
                        className='p-3.5 hover:bg-slate-700 flex items-center gap-3 transition cursor-pointer border-b border-slate-700/50' 
                        onClick={currentUser.sellerStatus === 'pending' ? null : handleSellerRequest}
                    >
                        <span className={sellerUI.color}>{sellerUI.icon}</span>
                        <div className='text-sm font-medium flex-1'>
                            {sellerUI.text}
                        </div>
                    </div>
                )}
                
                {/* If Approved, Show Seller Dashboard Link */}
                {currentUser.sellerStatus === 'approved' && (
                    <Link to="/seller-dashboard" onClick={onClose} className='p-3.5 hover:bg-slate-700 flex items-center gap-3 transition border-b border-slate-700/50'>
                         <span className='text-blue-400'><FaUserTag /></span> <span className='text-sm font-medium'>Seller Dashboard</span>
                    </Link>
                )}
            </div>

            {/* MY LISTINGS SECTION */}
            <div className='bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50'>
                 <button onClick={handleShowListings} className='w-full p-3.5 hover:bg-slate-700 flex items-center gap-3 transition text-left border-b border-slate-700/50'>
                    <span className='text-blue-400'><FaList /></span> <span className='text-sm font-medium'>My Properties</span>
                 </button>
                 {showListingsError && <p className='text-red-400 text-xs p-2 text-center'>Error showing listings</p>}
                 {userListings.length > 0 && (
                    <div className='bg-slate-900/50 p-2 max-h-40 overflow-y-auto'>
                        {userListings.map((listing) => (
                             <div key={listing._id} className='flex justify-between items-center p-2 mb-2 bg-slate-800 rounded border border-slate-700'>
                                 <Link to={`/listing/${listing._id}`} onClick={onClose} className='text-xs text-white truncate w-24 hover:underline'>{listing.name}</Link>
                                 <div className='flex gap-2'>
                                     <button onClick={() => handleListingDelete(listing._id)} className='text-red-400 text-[10px] uppercase hover:underline'>Delete</button>
                                     <Link to={`/update-listing/${listing._id}`} onClick={onClose} className='text-green-400 text-[10px] uppercase hover:underline'>Edit</Link>
                                 </div>
                             </div>
                        ))}
                    </div>
                 )}
            </div>

            {/* WISHLIST SECTION */}
            <div className='bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50'>
                 <button onClick={handleShowSavedListings} className='w-full p-3.5 hover:bg-slate-700 flex items-center gap-3 transition text-left border-b border-slate-700/50'>
                    <span className='text-pink-400'><FaHeart /></span> <span className='text-sm font-medium'>My Wishlist</span>
                 </button>
                 {showSavedError && <p className='text-red-400 text-xs p-2 text-center'>Error showing wishlist</p>}
                 {savedListings.length > 0 && (
                    <div className='bg-slate-900/50 p-2 max-h-40 overflow-y-auto'>
                        {savedListings.map((listing) => (
                             <div key={listing._id} className='flex justify-between items-center p-2 mb-2 bg-slate-800 rounded border border-slate-700'>
                                 <Link to={`/listing/${listing._id}`} onClick={onClose} className='text-xs text-white truncate w-32 hover:underline'>{listing.name}</Link>
                                 <Link to={`/listing/${listing._id}`} onClick={onClose} className='text-blue-400 text-[10px] uppercase hover:underline'>View</Link>
                             </div>
                        ))}
                    </div>
                 )}
            </div>

            {/* DELETE & SIGNOUT */}
            <div className='flex flex-col gap-2 pt-2'>
                <button onClick={handleSignOut} className='w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center gap-2 transition text-white font-medium'>
                    <FaSignOutAlt /> Sign Out
                </button>
                <button onClick={handleDeleteUser} className='w-full p-2 text-red-400 hover:text-red-300 text-xs text-center hover:underline'>
                    Delete Account permanently
                </button>
            </div>

        </div>
      </div>
    </div>
  );
}