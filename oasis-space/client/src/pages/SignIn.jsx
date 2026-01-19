import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; // <--- NEW IMPORTS
import { signInStart, signInSuccess, signInFailure } from '../redux/user/userSlice'; // <--- NEW IMPORTS

export default function SignIn() {
  const [formData, setFormData] = useState({});
  // We now read 'loading' and 'error' from the global store, not local state
  const { loading, error } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch(); // <--- This allows us to send commands to Redux

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Tell Redux we are starting
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
        // 2. Tell Redux it failed
        dispatch(signInFailure(data.message));
        return;
      }
      
      // 3. Tell Redux it succeeded (and save the user data!)
      dispatch(signInSuccess(data));
      navigate('/');
      
    } catch (error) {
      dispatch(signInFailure(error.message));
    }
  };

  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl text-center font-semibold my-7'>Sign In</h1>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input 
          type="email" 
          placeholder='email' 
          className='border p-3 rounded-lg' 
          id='email' 
          onChange={handleChange} 
        />
        <input 
          type="password" 
          placeholder='password' 
          className='border p-3 rounded-lg' 
          id='password' 
          onChange={handleChange} 
        />
        
        <button 
          disabled={loading} 
          className='bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80'
        >
          {loading ? 'Loading...' : 'Sign In'}
        </button>
      </form>
      <div className="flex gap-2 mt-5">
        <p>Dont have an account?</p>
        <Link to={"/sign-up"}>
          <span className='text-blue-700'>Sign up</span>
        </Link>
      </div>
      {error && <p className='text-red-500 mt-5'>{error}</p>}
    </div>
  )
}