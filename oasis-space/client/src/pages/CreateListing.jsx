import { useState } from 'react';
import { supabase } from '../supabase';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaMagic, FaLink, FaCloudUploadAlt, FaTrashAlt } from 'react-icons/fa';

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
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
  });
  
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

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
          setFormData({
            ...formData,
            imageUrls: formData.imageUrls.concat(urls),
          });
          setUploading(false);
        })
        .catch((err) => {
          console.log("Upload Error:", err); // Fixed: 'err' variable used
          setImageUploadError('Image upload failed');
          setUploading(false);
        });
    } else {
      setImageUploadError('Maximum 6 images allowed.');
      setUploading(false);
    }
  };

  const storeImage = async (file) => {
    const fileName = new Date().getTime() + '_' + file.name;
    const { error: uploadErr } = await supabase.storage
      .from('images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadErr) throw uploadErr;
    const { data: publicData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);
    return publicData.publicUrl;
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim() || !imageUrlInput.includes('http')) {
         return setImageUploadError('Please enter a valid image URL.');
    }
    if (formData.imageUrls.length >= 6) {
      return setImageUploadError('Maximum 6 images allowed.');
    }
    setFormData({ ...formData, imageUrls: [...formData.imageUrls, imageUrlInput] });
    setImageUrlInput('');
    setImageUploadError(false);
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
  };

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

  const handleAIGenerate = async (e) => {
    e.preventDefault(); 
    if (!formData.name || !formData.address) {
        setError('Name and Address required for AI generation.');
        return;
    }
    try {
        setAiLoading(true);
        setError(false);
        const promptText = `Name: ${formData.name}, Address: ${formData.address}, Type: ${formData.type}, Beds: ${formData.bedrooms}, Baths: ${formData.bathrooms}.`;
        const res = await fetch('/api/listing/generate-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText }),
        });
        const data = await res.json();
        if (data.success === false) {
            setError(data.message);
        } else {
            setFormData({ ...formData, description: data });
        }
        setAiLoading(false);
    } catch (err) {
        console.log("AI Error:", err); // Fixed: 'err' variable used
        setError('AI Generation Failed.');
        setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.imageUrls.length < 1) return setError('At least one image is required');
      setLoading(true);
      setError(false);
      const res = await fetch('/api/listing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userRef: currentUser?._id }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success === false) setError(data.message);
      else navigate(`/listing/${data._id}`);
    } catch (err) {
      console.log("Submit Error:", err);
      setError('Form submission failed.');
      setLoading(false);
    }
  };

  // OasisSpace UI Styles
  const inputBase = "border-slate-700 bg-slate-800 text-white placeholder-slate-500 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm w-full";
  const labelBase = "text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block";

  return (
    <div className='min-h-screen bg-[#0b0f1a] py-10 px-4 flex items-center justify-center'>
      <main className='max-w-4xl w-full mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden'>
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 p-6 text-center">
             <h1 className='text-3xl font-extrabold text-white'>Create a Listing</h1>
             <p className="text-slate-200 mt-1 text-sm">Fill in the details to publish your property</p>
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col md:flex-row gap-8 p-8'>
          
          {/* Left Column */}
          <div className='flex flex-col gap-4 flex-1'>
            <div>
                <label className={labelBase}>Property Name</label>
                <input type='text' id='name' placeholder='e.g., Luxury Villa' className={inputBase} required onChange={handleChange} value={formData.name} />
            </div>
            
            <div className="relative">
                <label className={labelBase}>Description</label>
                <textarea id='description' placeholder='Describe your place...' className={`${inputBase} h-28 resize-none`} required onChange={handleChange} value={formData.description} />
                <button type='button' onClick={handleAIGenerate} disabled={aiLoading}
                    className='absolute bottom-2 right-2 bg-slate-900/80 text-indigo-400 border border-indigo-500/30 text-[10px] px-3 py-1.5 rounded-full hover:bg-indigo-600 hover:text-white transition-all font-bold'>
                    {aiLoading ? 'Magic...' : <><FaMagic className="inline mr-1" /> AI Generate</>}
                </button>
            </div>

            <div>
                <label className={labelBase}>Full Address</label>
                <input type='text' id='address' placeholder='Street, City, State' className={inputBase} required onChange={handleChange} value={formData.address} />
            </div>
            
            <div className='grid grid-cols-3 gap-3 bg-slate-800/40 p-3 rounded-2xl border border-slate-800'>
              {['sale', 'rent', 'parking', 'furnished', 'offer'].map((item) => (
                <div key={item} className='flex gap-2 items-center'>
                  <input type='checkbox' id={item} className='w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500' onChange={handleChange} checked={item === 'sale' || item === 'rent' ? formData.type === item : formData[item]} />
                  <span className="text-slate-300 capitalize text-xs">{item}</span>
                </div>
              ))}
            </div>

            <div className='flex gap-4'>
              <div className='flex-1 bg-slate-800 p-3 rounded-2xl border border-slate-700'>
                <label className={labelBase}>Bedrooms</label>
                <input type='number' id='bedrooms' min='1' max='10' className='bg-transparent text-white font-bold w-full focus:outline-none' onChange={handleChange} value={formData.bedrooms} />
              </div>
              <div className='flex-1 bg-slate-800 p-3 rounded-2xl border border-slate-700'>
                <label className={labelBase}>Bathrooms</label>
                <input type='number' id='bathrooms' min='1' max='10' className='bg-transparent text-white font-bold w-full focus:outline-none' onChange={handleChange} value={formData.bathrooms} />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className='flex flex-col flex-1 gap-5'>
            <div>
                <label className={labelBase}>Images (Max 6)</label>
                <div className="flex gap-2 mb-2">
                    <input type="text" placeholder="Paste URL..." className={`${inputBase} py-2`} value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} />
                    <button type='button' onClick={handleAddImageUrl} className="bg-indigo-600 text-white px-4 rounded-xl font-bold text-xs hover:bg-indigo-500">Add</button>
                </div>
                <label className="flex justify-center items-center h-12 bg-slate-700 border-2 border-dashed border-slate-500 rounded-xl cursor-pointer hover:bg-slate-600 text-slate-300 transition-all">
                    <FaCloudUploadAlt className="mr-2" /> Upload Files
                    <input type='file' className='hidden' onChange={(e) => handleImageSubmit(e.target.files)} accept='image/*' multiple />
                </label>
                {imageUploadError && <p className="text-red-400 text-[10px] mt-1 ml-1">{imageUploadError}</p>}
            </div>

            <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                {formData.imageUrls.map((url, index) => (
                    <div key={url} className='flex justify-between p-2 bg-slate-800 border border-slate-700 rounded-xl items-center group'>
                        <div className="flex items-center gap-3">
                            <span className="text-slate-500 font-bold text-[10px]">#{index + 1}</span>
                            <img src={url} alt='listing' className='w-12 h-10 object-cover rounded-lg' />
                        </div>
                        <button type='button' onClick={() => handleRemoveImage(index)} className='p-2 text-slate-500 hover:text-red-400'><FaTrashAlt className="w-3 h-3" /></button>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-800">
                <div className='mb-4'>
                    <label className={labelBase}>Regular Price {formData.type === 'rent' && '($/Mo)'}</label>
                    <input type='number' id='regularPrice' className={`${inputBase} text-lg font-extrabold`} onChange={handleChange} value={formData.regularPrice} />
                </div>
                <button disabled={loading || uploading} className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-4 rounded-2xl font-black uppercase tracking-tighter shadow-xl hover:opacity-90 disabled:opacity-50 transition-all">
                   {loading ? 'Publishing...' : 'Publish Listing'}
                </button>
                {error && <p className='text-red-400 text-xs mt-3 text-center font-bold bg-red-900/20 p-2 rounded-lg'>{error}</p>}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}