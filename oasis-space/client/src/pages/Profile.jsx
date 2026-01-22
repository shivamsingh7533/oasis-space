import { useSelector, useDispatch } from 'react-redux';
import { useRef, useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import {
  updateUserStart, updateUserSuccess, updateUserFailure,
  deleteUserFailure, deleteUserStart, deleteUserSuccess,
  signOutUserStart,
} from '../redux/user/userSlice';
import { Link } from 'react-router-dom';

export default function Profile() {
  const fileRef = useRef(null);
  const { currentUser, loading, error } = useSelector((state) => state.user);
  const [file, setFile] = useState(undefined);
  const [uploading, setUploading] = useState(false);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [userListings, setUserListings] = useState([]);
  const [showListingsError, setShowListingsError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (file) handleFileUpload(file);
  }, [file]);

  const handleFileUpload = async (file) => {
    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      setFileUploadError('File too large (Max 20MB)');
      return;
    }
    setUploading(true);
    setFileUploadError(false);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('images') // Using your bucket named 'images'
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, avatar: publicUrl }));
      setUploading(false);
    } catch (err) {
      console.log(err);
      setFileUploadError('Upload failed. Check Supabase Storage Policies.');
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(updateUserFailure(data.message));
        return;
      }
      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
      setIsEditing(false);
    } catch (err) {
      dispatch(updateUserFailure(err.message));
    }
  };

  const handleShowListings = async () => {
    try {
      setShowListingsError(false);
      const res = await fetch(`/api/user/listings/${currentUser._id}`);
      const data = await res.json();
      if (data.success === false) {
        setShowListingsError(true);
        return;
      }
      setUserListings(data);
    } catch (err) {
      console.log(err);
      setShowListingsError(true);
    }
  };

  const handleDeleteUser = async () => {
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (err) { dispatch(deleteUserFailure(err.message)); }
  };

  const handleSignOut = async () => {
    try {
      dispatch(signOutUserStart());
      const res = await fetch('/api/auth/signout');
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (err) { dispatch(deleteUserFailure(err.message)); }
  };

  return (
    // FIX 1: Outer Container Full Height & Dark Background (bg-slate-900)
    <div className='bg-slate-900 min-h-screen w-full flex justify-center items-start pt-10 p-3'>
      
      {/* FIX 2: Card Container Darker (bg-slate-800), Border & White Text */}
      <div className='bg-slate-800 shadow-2xl rounded-xl p-6 w-full max-w-lg border border-slate-700'>
        
        {/* Profile Image Section */}
        <div className='flex flex-col items-center gap-3 mb-6'>
          <input onChange={(e) => setFile(e.target.files[0])} type='file' ref={fileRef} hidden accept='image/*' />
          
          <div className='relative cursor-pointer hover:opacity-90 transition-opacity' onClick={() => fileRef.current.click()}>
            <img 
              src={formData.avatar || currentUser.avatar} 
              alt='profile' 
              className='rounded-full h-24 w-24 object-cover border-4 border-slate-600 shadow-lg' 
            />
          </div>
          
          <p className='text-xs h-4 font-medium text-center'>
            {fileUploadError && <span className='text-red-400'>{fileUploadError}</span>}
            {uploading && <span className='text-slate-300 animate-pulse'>Uploading...</span>}
            {updateSuccess && <span className='text-green-400 font-bold'>Profile updated successfully!</span>}
          </p>
        </div>

        {!isEditing ? (
          // --- VIEW MODE (Dark Theme) ---
          <div className='flex flex-col items-center gap-2'>
            <h1 className='text-2xl font-bold text-slate-100'>{currentUser.username}</h1>
            <p className='text-slate-400 text-sm mb-6'>{currentUser.email}</p>
            
            <div className='flex gap-3 w-full'>
              <button 
                onClick={() => setIsEditing(true)} 
                className='flex-1 bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-600 border border-slate-600 transition-all shadow-md'
              >
                Edit Profile
              </button>
              <Link 
                to={'/create-listing'} 
                className='flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold text-center hover:bg-green-700 transition-all shadow-md'
              >
                Create Listing
              </Link>
            </div>
          </div>
        ) : (
          // --- EDIT MODE (Dark Theme Inputs) ---
          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <input 
              type='text' 
              defaultValue={currentUser.username} 
              id='username' 
              className='bg-slate-700 text-slate-200 border border-slate-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all placeholder-slate-400' 
              onChange={handleChange} 
            />
            <input 
              type='email' 
              defaultValue={currentUser.email} 
              id='email' 
              className='bg-slate-700 text-slate-200 border border-slate-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all placeholder-slate-400' 
              onChange={handleChange} 
            />
            <input 
              type='password' 
              placeholder='New Password' 
              id='password' 
              className='bg-slate-700 text-slate-200 border border-slate-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all placeholder-slate-400' 
              onChange={handleChange} 
            />
            
            <div className='flex gap-3 mt-2'>
              <button 
                disabled={loading} 
                className='flex-1 bg-slate-600 text-white rounded-lg p-3 text-sm font-bold uppercase hover:bg-slate-500 transition-all shadow-md disabled:opacity-70'
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                onClick={() => setIsEditing(false)} 
                className='bg-red-900/30 text-red-400 border border-red-900/50 rounded-lg px-5 py-3 text-sm font-bold uppercase hover:bg-red-900/50 transition-all'
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Footer Actions */}
        <div className='flex justify-between mt-6 text-sm font-medium border-t border-slate-700 pt-4'>
          <span onClick={handleDeleteUser} className='text-red-400 cursor-pointer hover:text-red-300 transition-colors'>Delete Account</span>
          <span onClick={handleSignOut} className='text-slate-400 cursor-pointer hover:text-slate-200 transition-colors'>Sign out</span>
        </div>

        {error && <p className='text-red-400 mt-4 text-center text-sm font-semibold bg-red-900/20 p-2 rounded'>{error}</p>}
        {showListingsError && <p className='text-red-400 mt-4 text-center text-sm font-semibold'>Error showing listings</p>}

        {/* Listings Section */}
        <div className='mt-6'>
          <button 
            onClick={handleShowListings} 
            className='w-full text-green-400 font-semibold text-sm hover:text-green-300 hover:underline transition-colors'
          >
             Show My Listings
          </button>
          
          {userListings.length > 0 && (
            <div className='mt-4 flex flex-col gap-3'>
              {userListings.map((listing) => (
                <div key={listing._id} className='border border-slate-600 bg-slate-700/50 rounded-lg p-3 flex justify-between items-center text-sm'>
                  <Link to={`/listing/${listing._id}`} className='text-slate-200 font-medium truncate max-w-[150px] hover:underline'>
                    {listing.name}
                  </Link>
                  <div className='flex flex-col items-center gap-1'>
                     <button onClick={() => handleDeleteUser(listing._id)} className='text-red-400 uppercase text-xs font-semibold hover:text-red-300'>Delete</button>
                     <Link to={`/update-listing/${listing._id}`} className='text-green-400 uppercase text-xs font-semibold hover:text-green-300'>Edit</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}