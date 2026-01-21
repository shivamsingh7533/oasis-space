import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function SignUp() {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // VALIDATION 1: Mandatory Fields
    if (!formData.email || !formData.mobile) {
      setError("Email and Mobile Number are required!");
      return;
    }

    // VALIDATION 2: Mobile Number Length
    if (formData.mobile.length < 10) {
      setError("Please enter a valid mobile number.");
      return;
    }

    // VALIDATION 3: Passwords Match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (data.success === false) {
        setLoading(false);
        setError(data.message);
        return;
      }
      
      setLoading(false);
      setError(null);
      navigate('/sign-in');
      
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  return (
    <div className='bg-slate-900 min-h-screen flex items-center justify-center p-3'>
      
      {/* CHANGE: Padding reduced (p-6), Width slightly constrained (max-w-sm) */}
      <div className='bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700'>
        
        {/* CHANGE: Heading size reduced (text-2xl) and margin reduced (my-4) */}
        <h1 className='text-2xl text-center font-bold my-4 text-slate-100 drop-shadow-md'>
          Sign Up
        </h1>
        
        {/* CHANGE: Gap reduced (gap-3) */}
        <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
          {/* Username */}
          <input 
            type="text" 
            placeholder='username' 
            // CHANGE: Padding reduced (p-2.5)
            className='border border-slate-600 bg-slate-700 text-slate-200 placeholder:text-slate-400 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all text-sm sm:text-base' 
            id='username' 
            onChange={handleChange} 
            required
          />
          
          {/* Email */}
          <input 
            type="email" 
            placeholder='email' 
            className='border border-slate-600 bg-slate-700 text-slate-200 placeholder:text-slate-400 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all text-sm sm:text-base' 
            id='email' 
            onChange={handleChange} 
            required
          />

          {/* Mobile Number */}
          <input 
            type="number" 
            placeholder='mobile number' 
            className='border border-slate-600 bg-slate-700 text-slate-200 placeholder:text-slate-400 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all appearance-none text-sm sm:text-base' 
            id='mobile' 
            onChange={handleChange} 
            required
          />

          {/* Password Field */}
          <div className='relative'>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder='password' 
              className='border border-slate-600 bg-slate-700 text-slate-200 placeholder:text-slate-400 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all w-full text-sm sm:text-base' 
              id='password' 
              onChange={handleChange} 
              required
            />
            <div 
              className='absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-200 text-base p-1'
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className='relative'>
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder='confirm password' 
              className='border border-slate-600 bg-slate-700 text-slate-200 placeholder:text-slate-400 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all w-full text-sm sm:text-base' 
              id='confirmPassword' 
              onChange={handleChange} 
              required
            />
            <div 
              className='absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-200 text-base p-1'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
          </div>
          
          <button 
            disabled={loading} 
            className='bg-slate-600 text-white p-2.5 rounded-lg uppercase hover:bg-slate-500 disabled:opacity-80 transition-colors font-semibold shadow-md mt-2 text-sm sm:text-base'
          >
            {loading ? 'Loading...' : 'Sign Up'}
          </button>
          
        </form>

        <div className="flex gap-2 mt-4 text-slate-300 font-medium justify-center text-sm">
          <p>Have an account?</p>
          <Link to={"/sign-in"}>
            <span className='text-blue-400 hover:text-blue-300 hover:underline transition-colors'>
              Sign in
            </span>
          </Link>
        </div>
        
        {error && (
          <p className='text-red-400 mt-3 text-center bg-red-900/20 p-2 rounded border border-red-800 text-sm'>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}