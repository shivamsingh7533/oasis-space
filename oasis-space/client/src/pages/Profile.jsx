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
    <div className='p-3 max-w-lg mx-auto'>
      <div className='bg-white shadow-md rounded-lg p-5 mt-5 border border-slate-200'>
        <div className='flex flex-col items-center gap-2 mb-4'>
          <input onChange={(e) => setFile(e.target.files[0])} type='file' ref={fileRef} hidden accept='image/*' />
          <div className='relative cursor-pointer' onClick={() => fileRef.current.click()}>
            <img src={formData.avatar || currentUser.avatar} alt='profile' className='rounded-full h-20 w-20 object-cover border-2 border-slate-100 shadow-sm' />
          </div>
          <p className='text-xs h-3 font-medium text-center'>
            {fileUploadError && <span className='text-red-600'>{fileUploadError}</span>}
            {uploading && <span className='text-slate-600 animate-pulse'>Uploading...</span>}
            {updateSuccess && <span className='text-green-600 font-bold'>Profile updated!</span>}
          </p>
        </div>

        {!isEditing ? (
          <div className='flex flex-col items-center gap-1'>
            <h1 className='text-xl font-bold text-slate-800'>{currentUser.username}</h1>
            <p className='text-slate-500 text-sm mb-4'>{currentUser.email}</p>
            <div className='flex gap-3'>
              <button onClick={() => setIsEditing(true)} className='bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium'>Edit Profile</button>
              <Link to={'/create-listing'} className='bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium'>Create Listing</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
            <input type='text' defaultValue={currentUser.username} id='username' className='bg-slate-50 p-3 rounded-lg border text-sm' onChange={handleChange} />
            <input type='email' defaultValue={currentUser.email} id='email' className='bg-slate-50 p-3 rounded-lg border text-sm' onChange={handleChange} />
            <input type='password' placeholder='New Password' id='password' className='bg-slate-50 p-3 rounded-lg border text-sm' onChange={handleChange} />
            <div className='flex gap-2'>
              <button disabled={loading} className='flex-1 bg-slate-800 text-white rounded-lg p-2 text-xs font-bold uppercase'>{loading ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={() => setIsEditing(false)} className='bg-red-100 text-red-700 rounded-lg p-2 text-xs font-bold uppercase'>Cancel</button>
            </div>
          </form>
        )}

        <div className='flex justify-between mt-4 text-xs font-medium border-t pt-3'>
          <span onClick={handleDeleteUser} className='text-red-500 cursor-pointer hover:underline'>Delete Account</span>
          <span onClick={handleSignOut} className='text-slate-500 cursor-pointer hover:underline'>Sign out</span>
        </div>

        {error && <p className='text-red-600 mt-2 text-center text-xs font-semibold'>{error}</p>}
        {showListingsError && <p className='text-red-600 mt-2 text-center text-xs font-semibold'>Error showing listings</p>}

        <div className='mt-4'>
          <button onClick={handleShowListings} className='w-full text-slate-600 font-semibold text-xs hover:text-slate-800 hover:underline'>
             Show My Listings
          </button>
          {userListings.length > 0 && (
            <div className='mt-2 flex flex-col gap-2'>
              {userListings.map((listing) => (
                <div key={listing._id} className='border rounded p-2 flex justify-between items-center text-xs'>
                  <span className='truncate max-w-[120px] font-medium'>{listing.name}</span>
                  <Link to={`/update-listing/${listing._id}`} className='text-green-700 font-bold'>EDIT</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}