import { useState } from 'react';
import { supabase } from '../supabase';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaCloudUploadAlt, FaTrashAlt, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { compressImage } from '../utils/compressImage';
import RazorpayBtn from '../components/RazorpayBtn';
import { getListingFee, LISTING_FEES } from '../utils/fees';

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
  // Draft saved by the backend — payment is required before it goes live.
  const [createdListing, setCreatedListing] = useState(null);

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
    if (!import.meta.env.VITE_SUPABASE_KEY) {
      throw new Error('Image upload is not configured (missing VITE_SUPABASE_KEY).');
    }
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
      if (!currentUser) return setError('Please login to create a listing');

      setLoading(true); setError(false);

      // Backend forces userRef/status('pending'); ownership is never trusted from the client.
      const res = await fetch('/api/listing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      setLoading(false);

      if (data.success === false) {
        setError(data.message);
      } else {
        // Draft saved → show the fee-payment step to publish.
        setCreatedListing(data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) { console.log(err); setError('Failed to create listing'); setLoading(false); }
  };

  const inputClass = "bg-slate-700 text-white rounded-lg p-3 w-full border border-slate-600 focus:outline-none focus:border-indigo-500 placeholder-slate-400";
  const labelClass = "text-slate-300 font-semibold mb-2 block";

  // --- PAYMENT STEP RENDERED AFTER THE DRAFT IS CREATED ---
  if (createdListing) {
    const fee = getListingFee(createdListing.type);
    const feeLabel = createdListing.type === 'rent' ? 'Rent' : 'Sale';

    // Rent listings publish FREE and instantly — no payment needed.
    if (fee === 0) {
      return (
        <div className='min-h-screen flex items-center justify-center p-4 py-10' style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className='max-w-lg w-full rounded-lg shadow-2xl p-8 border' style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <div className='flex flex-col items-center text-center mb-6'>
              <div className='bg-green-500/10 p-4 rounded-full mb-4 border border-green-500/30'>
                <FaCheckCircle className='text-4xl text-green-500' />
              </div>
              <h2 className='text-2xl font-bold text-white mb-2'>Your Rent Listing is LIVE!</h2>
              <p className='text-slate-400 text-sm mb-4'>
                <span className='font-semibold text-slate-200'>{createdListing.name}</span> is now published for everyone to see. Rent listings are free — there's nothing to pay.
              </p>
            </div>
            <div className='bg-slate-800/60 rounded-2xl border border-slate-700 p-5 mb-6 text-center'>
              <span className='px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-green-500/20 text-green-400 border border-green-500/30'>
                Published — Free
              </span>
            </div>
            <button
              onClick={() => navigate('/seller-dashboard')}
              className='w-full justify-center flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-4 rounded-xl font-bold transition-all shadow-lg shadow-green-900/30 border border-green-500/50'
            >
              Go to Seller Dashboard
            </button>
            <p className='text-center mt-4'>
              <button
                onClick={() => navigate('/')}
                className='text-slate-400 hover:text-slate-200 text-sm font-semibold transition'
              >
                Or see it on the Home page
              </button>
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className='min-h-screen flex items-center justify-center p-4 py-10' style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className='max-w-lg w-full rounded-lg shadow-2xl p-8 border' style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <button
            onClick={() => setCreatedListing(null)}
            className='flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-semibold transition mb-4'
          >
            <FaArrowLeft /> Back to edit draft
          </button>

          <div className='flex flex-col items-center text-center mb-6'>
            <div className='bg-green-500/10 p-4 rounded-full mb-4 border border-green-500/30'>
              <FaCheckCircle className='text-4xl text-green-500' />
            </div>
            <h2 className='text-2xl font-bold text-white mb-2'>Draft Saved!</h2>
            <p className='text-slate-400 text-sm mb-4'>
              <span className='font-semibold text-slate-200'>{createdListing.name}</span> is created as a draft. Pay the one-time listing fee to publish it for everyone to see.
            </p>
          </div>

          <div className='bg-slate-800/60 rounded-2xl border border-slate-700 p-5 mb-6'>
            <div className='flex justify-between items-center mb-2'>
              <span className='text-slate-400 text-sm'>Listing Type</span>
              <span className='px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'>
                For {feeLabel}
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-slate-400 text-sm'>Listing Fee (one-time)</span>
              <span className='text-3xl font-black text-white'>&#8377;{fee.toLocaleString('en-IN')}</span>
            </div>
            <p className='text-[11px] text-slate-500 mt-3 leading-relaxed'>
              Sale listings: &#8377;{LISTING_FEES.sale.toLocaleString('en-IN')} &nbsp;&middot;&nbsp; Rent listings: <span className='text-green-400 font-semibold'>FREE</span>. The fee is charged once via Razorpay. Your listing goes live right after payment.
            </p>
          </div>

          <RazorpayBtn
            listing={createdListing}
            btnText={`Pay ₹${fee.toLocaleString('en-IN')} & Publish`}
            onSuccess={() => navigate('/seller-dashboard')}
            customStyle="w-full justify-center flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-5 py-3.5 rounded-xl font-bold transition-all border border-slate-600 mb-3"
          />

          <div className='relative flex py-2 items-center mb-3'>
            <div className='flex-grow border-t border-slate-700'></div>
            <span className='flex-shrink mx-4 text-xs uppercase tracking-wider text-slate-400 font-bold'>OR BEST VALUE</span>
            <div className='flex-grow border-t border-slate-700'></div>
          </div>

          <div className='p-4 rounded-xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-indigo-500/30 mb-2 text-left'>
            <div className='flex items-center justify-between mb-2'>
              <span className='font-bold text-white text-sm'>🚀 Seller Pro Pack</span>
              <span className='text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold'>Save 90%</span>
            </div>
            <p className='text-xs text-slate-300 mb-3'>
              Get <strong>10 Sale Listings</strong> for just <strong>₹5,100</strong> (effective ₹510 each). 1-year validity with instant publishing!
            </p>
            <RazorpayBtn
              orderType="seller_subscription"
              btnText="Buy Seller Pack (₹5,100 for 10)"
              onSuccess={() => navigate('/seller-dashboard')}
              customStyle="w-full justify-center flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
            />
          </div>

          <p className='text-center mt-4'>
            <button
              onClick={() => navigate('/seller-dashboard')}
              className='text-slate-400 hover:text-slate-200 text-sm font-semibold transition'
            >
              Pay later — go to Seller Dashboard
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4 py-10' style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className='max-w-4xl w-full rounded-lg shadow-2xl p-8 border' style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>

        <h1 className='text-3xl font-bold text-center text-white mb-6'>Create a Listing</h1>

        {/* Quota Status Badge */}
        {(() => {
          const sub = currentUser?.sellerSubscription;
          const isActive = sub && sub.status === 'active' && sub.endDate && new Date(sub.endDate) > new Date();
          const remaining = isActive ? Math.max(0, (sub.totalQuota || 0) - (sub.usedQuota || 0)) : 0;

          if (isActive && remaining > 0) {
            return (
              <div className='mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <span className='text-emerald-400 text-lg'>✨</span>
                  <div>
                    <p className='text-sm font-bold text-white'>Seller Pro Pack Active</p>
                    <p className='text-xs text-slate-300'>You have <span className='text-emerald-400 font-bold'>{remaining}</span> Sale listing credits remaining. Sale properties publish instantly for FREE!</p>
                  </div>
                </div>
                <span className='text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30 whitespace-nowrap'>
                  {remaining} Free Left
                </span>
              </div>
            );
          }
          return null;
        })()}

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