import { useEffect, useState } from 'react';
import { supabase } from '../supabase'; 
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FaCloudUploadAlt, FaTrashAlt } from 'react-icons/fa';

export default function UpdateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const params = useParams();
  
  const [formData, setFormData] = useState({
    imageUrls: [],
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
    userRef: '', 
  });
  
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // --- 1. FETCH DATA (Existing Feature) ---
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const listingId = params.listingId;
        const res = await fetch(`/api/listing/get/${listingId}`);
        const data = await res.json();
        if (data.success === false) {
          console.log(data.message);
          return;
        }
        setFormData(data); 
      } catch (error) {
        console.log(error);
      }
    };
    fetchListing();
  }, [params.listingId]);

  // --- 2. IMAGE UPLOAD LOGIC (Existing Feature) ---
  const handleImageSubmit = (files) => {
    if (files.length > 0 && files.length + formData.imageUrls.length < 7) {
      setUploading(true);
      setImageUploadError(false);
      const promises = [];

      for (let i = 0; i < files.length; i++) {
        if (files[i].size > 20 * 1024 * 1024) {
           setUploading(false);
           setImageUploadError('File too large! Max 20MB per image.');
           return;
        }
        promises.push(storeImage(files[i]));
      }

      Promise.all(promises)
        .then((urls) => {
          setFormData({ ...formData, imageUrls: formData.imageUrls.concat(urls) });
          setImageUploadError(false);
          setUploading(false);
        })
        .catch((err) => {
          setImageUploadError('Image upload failed');
          setUploading(false);
          console.log(err);
        });
    } else {
      setImageUploadError('You can only upload 6 images per listing');
      setUploading(false);
    }
  };

  const storeImage = async (file) => {
      const fileName = new Date().getTime() + '_' + file.name;
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      return data.publicUrl;
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return setImageUploadError('Please enter a valid URL');
    if (formData.imageUrls.length >= 6) return setImageUploadError('Maximum 6 images allowed.');
    setFormData({ ...formData, imageUrls: [...formData.imageUrls, imageUrlInput] });
    setImageUrlInput('');
    setImageUploadError(false);
  };

  // --- 3. FORM HANDLERS ---
  const handleChange = (e) => {
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

  // 🤖 AI GENERATE FUNCTION (Matches CreateListing Logic)
  const handleAIGenerate = async (e) => {
    e.preventDefault(); 
    if (!formData.name || !formData.address) { 
        setError('Please fill "Name" and "Address" first so AI knows what to write about!'); 
        return; 
    }
    
    try { 
        setAiLoading(true); 
        setError(false);
        
        // Sending structured data to match Backend Controller
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

  // --- 4. SUBMIT LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.imageUrls.length < 1) return setError('At least one image is required');
      if (+formData.regularPrice < +formData.discountPrice) return setError('Discount price must be lower than regular price');
      
      setLoading(true);
      setError(false);

      const finalUserRef = formData.userRef || currentUser._id;

      const res = await fetch(`/api/listing/update/${params.listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userRef: finalUserRef }),
      });

      const data = await res.json();
      setLoading(false);
      
      if (data.success === false) {
        setError(data.message);
      } else {
        navigate(`/listing/${data._id}`);
      }
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const inputClass = "bg-slate-700 text-white rounded-lg p-3 w-full border border-slate-600 focus:outline-none focus:border-indigo-500 placeholder-slate-400";
  const labelClass = "text-slate-300 font-semibold mb-2 block";

  return (
    <div className='min-h-screen bg-slate-900 flex items-center justify-center p-4 py-10'>
      <div className='max-w-4xl w-full bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700'>
        <h1 className='text-3xl font-bold text-center text-white mb-8'>Update Listing</h1>
        
        <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-6'>
            
             <div className='flex flex-col gap-4 flex-1'>
            
            <div>
                <label className={labelClass}>Property Name</label>
                <input type='text' id='name' placeholder='Name' className={inputClass} onChange={handleChange} value={formData.name} required />
            </div>

            <div className='relative'>
                <label className={labelClass}>Description</label>
                <textarea id='description' placeholder='Description' className={`${inputClass} h-32 resize-none`} onChange={handleChange} value={formData.description} required />
                
                {/* 🤖 AI BUTTON */}
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
                <label className={labelClass}>Address</label>
                <input type='text' id='address' placeholder='Address' className={inputClass} onChange={handleChange} value={formData.address} required />
            </div>

            {/* Checkboxes */}
            <div className='flex flex-wrap gap-4 mt-2'>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='sale' className='w-5 h-5 accent-indigo-600' onChange={handleChange} checked={formData.type === 'sale'} />
                <span className='text-slate-300'>Sell</span>
              </div>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='rent' className='w-5 h-5 accent-indigo-600' onChange={handleChange} checked={formData.type === 'rent'} />
                <span className='text-slate-300'>Rent</span>
              </div>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='parking' className='w-5 h-5 accent-indigo-600' onChange={handleChange} checked={formData.parking} />
                <span className='text-slate-300'>Parking</span>
              </div>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='furnished' className='w-5 h-5 accent-indigo-600' onChange={handleChange} checked={formData.furnished} />
                <span className='text-slate-300'>Furnished</span>
              </div>
              <div className='flex gap-2 items-center'>
                <input type='checkbox' id='offer' className='w-5 h-5 accent-indigo-600' onChange={handleChange} checked={formData.offer} />
                <span className='text-slate-300'>Offer</span>
              </div>
            </div>

            {/* Beds/Baths */}
            <div className='flex gap-4 flex-wrap'>
              <div className='flex items-center gap-2'>
                <input type='number' id='bedrooms' min='1' max='10' className={`${inputClass} w-20`} onChange={handleChange} value={formData.bedrooms} />
                <span className='text-slate-300'>Beds</span>
              </div>
              <div className='flex items-center gap-2'>
                <input type='number' id='bathrooms' min='1' max='10' className={`${inputClass} w-20`} onChange={handleChange} value={formData.bathrooms} />
                <span className='text-slate-300'>Baths</span>
              </div>
            </div>

            {/* Price */}
            <div className='flex flex-col gap-4'>
                <div className='flex items-center gap-2'>
                    <input type='number' id='regularPrice' min='50' max='10000000' className={`${inputClass} w-32`} onChange={handleChange} value={formData.regularPrice} required />
                    <div className='flex flex-col'>
                        <span className='text-slate-300'>Regular price</span>
                        {formData.type === 'rent' && <span className='text-xs text-slate-400'>(₹ / month)</span>}
                    </div>
                </div>

                {formData.offer && (
                    <div className='flex items-center gap-2 animate-pulse'>
                        <input type='number' id='discountPrice' min='0' max='10000000' className={`${inputClass} w-32 border-indigo-500`} onChange={handleChange} value={formData.discountPrice} required />
                        <div className='flex flex-col'>
                            <span className='text-indigo-400 font-bold'>Discount price</span>
                            {formData.type === 'rent' && <span className='text-xs text-indigo-400'>(₹ / month)</span>}
                        </div>
                    </div>
                )}
            </div>
          </div>

          {/* RIGHT COLUMN - IMAGE UPLOAD SECTION */}
          <div className='flex flex-col flex-1 gap-6'>
            <div>
              <label className={`${labelClass} mb-3`}>Images (Max 6)</label>
              
              {/* PASTE URL SECTION */}
              <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
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
              
              {/* UPLOADED IMAGES LIST */}
              {formData.imageUrls.length > 0 && (
                <div className="flex flex-col gap-2 mt-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {formData.imageUrls.map((url, index) => (
                    <div key={index} className='flex justify-between items-center bg-slate-700 p-2 rounded-lg border border-slate-600'>
                      <img 
                          src={url} 
                          alt='listing' 
                          className='w-20 h-16 object-cover rounded-md bg-slate-600'
                          onError={(e) => {
                             e.target.onerror = null; 
                             e.target.src = "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg";
                          }} 
                      />
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
              {loading ? 'Updating...' : 'Update Listing'}
            </button>
            {error && <p className='text-red-400 text-sm text-center'>{error}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}