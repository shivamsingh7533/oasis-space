import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signInStart, signInSuccess, signInFailure } from '../redux/user/userSlice';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import Eye Icons

export default function SignIn() {
  const [formData, setFormData] = useState({});
  const { loading, error } = useSelector((state) => state.user);
  const [showPassword, setShowPassword] = useState(false); // State for toggling password visibility
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(signInStart());
      
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (data.success === false) {
        dispatch(signInFailure(data.message));
        return;
      }
      
      dispatch(signInSuccess(data));
      navigate('/');
      
    } catch (error) {
      dispatch(signInFailure(error.message));
    }
  };

  return (
    // PAGE BACKGROUND (Dark Theme - Slate 900)
    <div className='bg-slate-900 min-h-screen flex items-center justify-center p-3'>
      
      {/* CARD CONTAINER */}
      <div className='bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700'>
        
        <h1 className='text-3xl text-center font-bold my-7 text-slate-100 drop-shadow-md'>
          Sign In
        </h1>
        
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <input 
            type="email" 
            placeholder='email' 
            className='border border-slate-600 bg-slate-700 text-slate-200 placeholder:text-slate-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all' 
            id='email' 
            onChange={handleChange} 
          />
          
          {/* Password Field with Eye Icon */}
          <div className='relative'>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder='password' 
              className='border border-slate-600 bg-slate-700 text-slate-200 placeholder:text-slate-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all w-full' 
              id='password' 
              onChange={handleChange} 
            />
            {/* Toggle Button for Password */}
            <div 
              className='absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-200 text-lg p-1'
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
          </div>
          
          <button 
            disabled={loading} 
            className='bg-slate-600 text-white p-3 rounded-lg uppercase hover:bg-slate-500 disabled:opacity-80 transition-colors font-semibold shadow-md'
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>
          
          {/* <OAuth /> */}
        </form>
        
        <div className="flex gap-2 mt-5 text-slate-300 font-medium">
          <p>Dont have an account?</p>
          <Link to={"/sign-up"}>
            <span className='text-blue-400 hover:text-blue-300 hover:underline transition-colors'>
              Sign up
            </span>
          </Link>
        </div>
        
        {error && (
          <p className='text-red-400 mt-5 text-center bg-red-900/20 p-2 rounded border border-red-800'>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}