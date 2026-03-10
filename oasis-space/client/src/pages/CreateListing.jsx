import { useState } from 'react';
import { supabase } from '../supabase';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaCloudUploadAlt, FaTrashAlt } from 'react-icons/fa';
import { compressImage } from '../utils/compressImage';

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    imageUrls: [],
    imageLabels: [], // ✅ NEW: Labels state
    name: '',
    description: '',
    address: '',
    type: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // --- IMAGE UPLOAD LOGIC ---
  const handleImageSubmit = (files) => {
    if (files.length > 0 && files.length + formData.imageUrls.length < 7) {
      setUploading(true);
      setImageUploadError(false);
      const promises = [];
      for (let i = 0; i < files.length; i++) {
        if (files[i].size > 10 * 1024 * 1024) {
          setUploading(false);
          setImageUploadError('File too large! Max 10MB per image.');
          return;
        }
        promises.push(storeImage(files[i]));
      }
      Promise.all(promises).then((urls) => {
        // ✅ SYNC LABELS: Add empty labels for new images
        setFormData({
          ...formData,
          imageUrls: formData.imageUrls.concat(urls),
          imageLabels: formData.imageLabels.concat(Array(urls.length).fill(''))
        });
        setUploading(false);
      }).catch((err) => { console.log(err); setImageUploadError('Image upload failed'); setUploading(false); });
    } else { setImageUploadError('Maximum 6 images allowed.'); setUploading(false); }
  };

  const storeImage = async (file) => {
    // 🗜️ Auto-compress to ≤2MB before upload
    const compressed = await compressImage(file);
    const ext = compressed.type === 'image/webp' ? '.webp' : '.jpg';
    const fileName = new Date().getTime() + '_' + file.name.replace(/\.[^.]+$/, '') + ext;
    const { error: uploadErr } = await supabase.storage.from('images').upload(fileName, compressed, { cacheControl: '3600', upsert: false });
    if (uploadErr) throw uploadErr;
    const { data: publicData } = supabase.storage.from('images').getPublicUrl(fileName);
    return publicData.publicUrl;
  };

  // --- PASTE URL HANDLER ---
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return setImageUploadError('Please enter an image URL.');
    if (formData.imageUrls.length >= 6) return setImageUploadError('Maximum 6 images allowed.');

    // ✅ SYNC LABELS
    setFormData({
      ...formData,
      imageUrls: [...formData.imageUrls, imageUrlInput],
      imageLabels: [...formData.imageLabels, '']
    });
    setImageUrlInput('');
    setImageUploadError(false);
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
      imageLabels: formData.imageLabels.filter((_, i) => i !== index) // ✅ Remove label too
    });
  };

  // ✅ NEW: HANDLE LABEL CHANGE
  const handleLabelChange = (index, value) => {
    const newLabels = [...formData.imageLabels];
    newLabels[index] = value;
    setFormData({ ...formData, imageLabels: newLabels });
  };

  // --- MODIFIED HANDLE CHANGE (SELLER CHECK) 🛡️ ---
  const handleChange = (e) => {
    // 1. Check Permission specifically for 'Sell' checkbox
    if (e.target.id === 'sale') {
      if (currentUser.sellerStatus !== 'approved' && currentUser.role !== 'admin') {
        alert("Permission Denied! You must be an Approved Seller to post 'Sale' listings.");
        return;
      }
    }

    // 2. Normal Logic
    if (e.target.id === 'sale' || e.target.id === 'rent') {
      setFormData({ ...formData, type: e.target.id });
    }

    if (['parking', 'furnished', 'offer'].includes(e.target.id)) {
      setFormData({ ...formData, [e.target.id]: e.target.checked });
    }

    if (['number', 'text', 'textarea'].includes(e.target.type)) {
      setFormData({ ...formData, [e.target.id]: e.target.value });
    }
  };

  // 🤖 AI GENERATE FUNCTION
  const handleAIGenerate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      alert('Please fill "Name" and "Address" first so AI knows what to write about!');
      return;
    }

    try {
      setAiLoading(true);
      setError(false);

      const res = await fetch('/api/listing/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          type: formData.type,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          parking: formData.parking,
          furnished: formData.furnished,
          offer: formData.offer
        })
      });

      const data = await res.json();

      if (data.success === false) {
        setError(data.message);
      } else {
        setFormData({ ...formData, description: data.description });
      }

      setAiLoading(false);
    } catch (err) {
      console.log(err);
      setError('AI Failed to generate. Try again.');
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.imageUrls.length < 1) return setError('At least one image is required');
      if (+formData.regularPrice < +formData.discountPrice) return setError('Discount price must be lower than regular price');

      setLoading(true); setError(false);

      const res = await fetch('/api/listing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userRef: currentUser?._id })
      });

      const data = await res.json();
      setLoading(false);

      if (data.success === false) {
        setError(data.message);
      } else {
        navigate(`/listing/${data._id}`);
      }
    } catch (err) { console.log(err); setError('Failed to create listing'); setLoading(false); }
  };

  const inputClass = "bg-slate-700 text-white rounded-lg p-3 w-full border border-slate-600 focus:outline-none focus:border-indigo-500 placeholder-slate-400";
  const labelClass = "text-slate-300 font-semibold mb-2 block";

  return (
    <div className='min-h-screen bg-slate-900 flex items-center justify-center p-4 py-10'>
      <div className='max-w-4xl w-full bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700'>

        <h1 className='text-3xl font-bold text-center text-white mb-8'>Create a Listing</h1>

        <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-6'>

          {/* LEFT COLUMN */}
          <div className='flex flex-col gap-4 flex-1'>

            <div>
              <label htmlFor='name' className={labelClass}>Property Name</label>
              <input type='text' id='name' placeholder='Name' className={inputClass} onChange={handleChange} value={formData.name} required />
            </div>

            <div className='relative'>
              <label htmlFor='description' className={labelClass}>Description</label>
              <textarea id='description' placeholder='Description' className={`${inputClass} h-32 resize-none`} onChange={handleChange} value={formData.description} required />

              <button
                type='button'
                onClick={handleAIGenerate}
                disabled={aiLoading}
                className='absolute bottom-3 right-3 text-xs bg-indigo-600 text-white px-3 py-1 rounded shadow-lg hover:bg-indigo-500 transition disabled:opacity-50'
              >
                {aiLoading ? '✨ Generating...' : '✨ AI Generate'}
              </button>
            </div>

            <div>
              <label htmlFor='address' className={labelClass}>Address</label>
              <input type='text' id='address' placeholder='Address' className={inputClass} onChange={handleChange} value={formData.address} required />
            </div>

            {/* Checkboxes */}
            <div className='flex flex-wrap gap-4 mt-2'>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='sale' className='w-5 h-5 accent-indigo-600' onChange={handleChange} checked={formData.type === 'sale'} />
                <label htmlFor='sale' className='text-slate-300 cursor-pointer'>Sell</label>
              </div>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='rent' className='w-5 h-5 accent-indigo-600' onChange={handleChange} checked={formData.type === 'rent'} />
                <label htmlFor='rent' className='text-slate-300 cursor-pointer'>Rent</label>
              </div>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='parking' className='w-5 h-5 accent-indigo-600' onChange={handleChange} checked={formData.parking} />
                <label htmlFor='parking' className='text-slate-300 cursor-pointer'>Parking</label>
              </div>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='furnished' className='w-5 h-5 accent-indigo-600' onChange={handleChange} checked={formData.furnished} />
                <label htmlFor='furnished' className='text-slate-300 cursor-pointer'>Furnished</label>
              </div>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='offer' className='w-5 h-5 accent-indigo-600' onChange={handleChange} checked={formData.offer} />
                <label htmlFor='offer' className='text-slate-300 cursor-pointer'>Offer</label>
              </div>
            </div>

            {/* Beds/Baths */}
            <div className='flex gap-4 flex-wrap'>
              <div className='flex items-center gap-2'>
                <input type='number' id='bedrooms' min='1' max='10' className={`${inputClass} w-20`} onChange={handleChange} value={formData.bedrooms} />
                <label htmlFor='bedrooms' className='text-slate-300 cursor-pointer'>Beds</label>
              </div>
              <div className='flex items-center gap-2'>
                <input type='number' id='bathrooms' min='1' max='10' className={`${inputClass} w-20`} onChange={handleChange} value={formData.bathrooms} />
                <label htmlFor='bathrooms' className='text-slate-300 cursor-pointer'>Baths</label>
              </div>
            </div>

            {/* Price */}
            <div className='flex flex-col gap-4'>
              <div className='flex items-center gap-2'>
                <input type='number' id='regularPrice' min='50' max='10000000' className={`${inputClass} w-32`} onChange={handleChange} value={formData.regularPrice} required />
                <div className='flex flex-col'>
                  <label htmlFor='regularPrice' className='text-slate-300 cursor-pointer'>Regular price</label>
                  {formData.type === 'rent' && <span className='text-xs text-slate-400'>(₹ / month)</span>}
                </div>
              </div>

              {formData.offer && (
                <div className='flex items-center gap-2 animate-pulse'>
                  <input type='number' id='discountPrice' min='0' max='10000000' className={`${inputClass} w-32 border-indigo-500`} onChange={handleChange} value={formData.discountPrice} required />
                  <div className='flex flex-col'>
                    <label htmlFor='discountPrice' className='text-indigo-400 font-bold cursor-pointer'>Discount price</label>
                    {formData.type === 'rent' && <span className='text-xs text-indigo-400'>(₹ / month)</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - IMAGE UPLOAD SECTION */}
          <div className='flex flex-col flex-1 gap-6'>
            <div>
              <span className={`${labelClass} mb-3`}>Images (Max 6)</span>

              {/* PASTE URL SECTION */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  id="imageUrlInput"
                  aria-label="Paste image URL here"
                  placeholder="Paste image URL here..."
                  className={inputClass}
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                />
                <button
                  type='button'
                  onClick={handleAddImageUrl}
                  className='bg-slate-700 text-white border border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-600 transition'
                >
                  Add
                </button>
              </div>

              {/* UPLOAD FILE BUTTON */}
              <div className='flex gap-4'>
                <label className='flex-1 flex flex-col items-center justify-center p-4 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer hover:bg-slate-700/50 transition'>
                  <FaCloudUploadAlt className='text-3xl text-slate-400 mb-2' />
                  <span className='text-slate-400 text-sm'>Select from device</span>
                  <input onChange={(e) => handleImageSubmit(e.target.files)} className='hidden' type='file' id='images' accept='image/*' multiple />
                </label>
              </div>

              <p className='text-red-400 text-sm mt-2 text-center'>{imageUploadError && imageUploadError}</p>

              {/* UPLOADED IMAGES LIST WITH LABELS */}
              {formData.imageUrls.length > 0 && (
                <div className="flex flex-col gap-3 mt-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {formData.imageUrls.map((url, index) => (
                    <div key={index} className='flex items-center gap-3 bg-slate-700 p-2 rounded-lg border border-slate-600'>
                      <img
                        src={url}
                        alt='listing'
                        className='w-20 h-16 object-cover rounded-md bg-slate-600 flex-shrink-0'
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg";
                        }}
                      />

                      {/* ✅ IMAGE LABEL INPUT */}
                      <div className="flex-1">
                        <input
                          type="text"
                          aria-label={`Label for image ${index + 1}`}
                          placeholder="Label (e.g. Kitchen, Hall)"
                          className="bg-slate-800 text-white text-sm p-2 rounded border border-slate-500 w-full focus:outline-none focus:border-blue-500"
                          value={formData.imageLabels[index] || ''}
                          onChange={(e) => handleLabelChange(index, e.target.value)}
                        />
                      </div>

                      <button type='button' onClick={() => handleRemoveImage(index)} className='p-2 text-red-400 hover:text-red-300 uppercase font-semibold text-sm'>
                        <FaTrashAlt />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button disabled={loading || uploading} className='mt-auto p-4 bg-green-600 text-white rounded-lg uppercase hover:bg-green-700 disabled:opacity-80 transition shadow-lg font-bold'>
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
            {error && <p className='text-red-400 text-sm text-center'>{error}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}