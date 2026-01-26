import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; 
import OAuth from '../components/OAuth'; // Ye component folder me hai

// ✅ CORRECT IMPORT: (Kyunki VerifyEmail.jsx bhi 'pages' folder me hi hai)
import VerifyEmailModal from './VerifyEmail'; 

export default function SignUp() {
  const [formData, setFormData] = useState({
    fullName: '', 
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value, // Trim hataya taaki space allowed ho
    });
  };

  const handlePhoneChange = (phone) => {
    setFormData({ ...formData, mobile: phone });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // --- VALIDATIONS ---
    if (!formData.fullName || !formData.email || !formData.mobile || !formData.password) {
      setError("All fields are required!");
      return;
    }
    if (formData.mobile.length < 10) {
      setError("Please enter a valid mobile number.");
      return;
    }
    
    // Password Strength
    const password = formData.password;
    if (password.length < 8) { setError("Password must be at least 8 characters long."); return; }
    if (!/[A-Z]/.test(password)) { setError("Password must contain at least one uppercase letter (A-Z)."); return; }
    if (!/[0-9]/.test(password)) { setError("Password must contain at least one number (0-9)."); return; }
    if (!/[!@#$%^&*]/.test(password)) { setError("Password must contain at least one special character (!@#$%^&*)."); return; }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      setError(null); 
      
      // Full Name se Unique Username banana
      const generatedUsername = formData.fullName.split(' ').join('').toLowerCase() + Math.random().toString(36).slice(-4);

      const finalData = {
        ...formData,
        username: generatedUsername
      };
      
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });

      const data = await res.json();
      
      if (data.success === false) {
        setLoading(false);
        setError(data.message);
        return;
      }
      
      setLoading(false);
      setError(null);
      
      // ✅ SUCCESS! OPEN MODAL
      setShowVerifyModal(true);
      
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  // --- STYLES ---
  const inputStyle = { backgroundColor: '#334155', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '0.5rem', width: '100%', height: '42px', fontSize: '0.875rem', paddingLeft: '48px' };
  const buttonStyle = { backgroundColor: '#334155', border: '1px solid #475569', borderTopLeftRadius: '0.5rem', borderBottomLeftRadius: '0.5rem' };
  const dropdownStyle = { backgroundColor: '#1e293b', border: '1px solid #475569', color: '#cbd5e1' };

  return (
    <div className='bg-slate-900 h-screen w-full flex items-center justify-center p-3 overflow-hidden relative'>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        .react-tel-input .country-list { background-color: #1e293b !important; color: #e2e8f0 !important; }
        .react-tel-input .country-list .search { background-color: #1e293b !important; }
        .react-tel-input .country-list .search-box { background-color: #334155 !important; color: #e2e8f0 !important; border: 1px solid #475569 !important; }
        .react-tel-input .country-list .country:hover, .react-tel-input .country-list .country.highlight { background-color: #334155 !important; }
      `}</style>

      {/* ✅ RENDER MODAL */}
      {showVerifyModal && (
        <VerifyEmailModal 
          email={formData.email} 
          onClose={() => setShowVerifyModal(false)} 
        />
      )}

      <div className='bg-slate-800 p-5 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700 max-h-[90vh] overflow-y-auto custom-scrollbar'>
        
        <h1 className='text-2xl text-center font-bold mb-4 text-slate-100 drop-shadow-md'>
          Sign Up
        </h1>
        
        <form onSubmit={handleSubmit} className='flex flex-col gap-2.5'>

          {/* ✅ GOOGLE BUTTON */}
          <OAuth />

          <div className="flex items-center my-2">
            <div className="flex-grow border-t border-slate-600"></div>
            <span className="flex-shrink-0 mx-2 text-slate-400 text-xs">OR CONTINUE WITH EMAIL</span>
            <div className="flex-grow border-t border-slate-600"></div>
          </div>

          {/* FULL NAME */}
          <input 
            type="text" 
            placeholder='Full Name' 
            className='border border-slate-600 bg-slate-700 text-slate-200 placeholder:text-slate-400 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all text-sm sm:text-base' 
            id='fullName' 
            onChange={handleChange} 
            value={formData.fullName || ''}
            required 
          />
          
          <input type="email" placeholder='Email' className='border border-slate-600 bg-slate-700 text-slate-200 placeholder:text-slate-400 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all text-sm sm:text-base' id='email' onChange={handleChange} value={formData.email || ''} required />

          <div className='w-full'>
            <PhoneInput country={'in'} value={formData.mobile} onChange={handlePhoneChange} enableSearch={true} inputStyle={inputStyle} buttonStyle={buttonStyle} dropdownStyle={dropdownStyle} placeholder="Mobile Number" masks={{ in: '..... .....' }} />
          </div>

          <div className='relative'>
            <input type={showPassword ? "text" : "password"} placeholder='Password' className='border border-slate-600 bg-slate-700 text-slate-200 placeholder:text-slate-400 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all w-full text-sm sm:text-base' id='password' onChange={handleChange} value={formData.password || ''} required />
            <div className='absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-200 text-base p-1' onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
          </div>
          <p className='text-[10px] text-slate-400 px-1 -mt-1'>* Min 8 chars, 1 uppercase, 1 number, 1 special char</p>

          <div className='relative'>
            <input type={showConfirmPassword ? "text" : "password"} placeholder='Confirm Password' className='border border-slate-600 bg-slate-700 text-slate-200 placeholder:text-slate-400 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all w-full text-sm sm:text-base' id='confirmPassword' onChange={handleChange} value={formData.confirmPassword || ''} required />
            <div className='absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-200 text-base p-1' onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
          </div>
          
          <button disabled={loading} className='bg-slate-600 text-white p-2.5 rounded-lg uppercase hover:bg-slate-500 disabled:opacity-80 transition-colors font-semibold shadow-md mt-1 text-sm sm:text-base'>
            {loading ? 'Loading...' : 'Sign Up'}
          </button>
          
        </form>

        <div className="flex gap-2 mt-3 text-slate-300 font-medium justify-center text-sm">
          <p>Have an account?</p>
          <Link to={"/sign-in"}>
            <span className='text-blue-400 hover:text-blue-300 hover:underline transition-colors'>
              Sign in
            </span>
          </Link>
        </div>
        
        {error && (
          <div className='mt-3 bg-red-900/20 border border-red-800 rounded p-2 animate-pulse'>
            <p className='text-red-400 text-xs text-center font-medium'>
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}