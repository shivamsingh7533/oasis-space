import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { signInStart, signInSuccess, signInFailure } from '../redux/user/userSlice';
import { FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function AuthModal({ onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/signin';

    try {
      if (!isSignUp) dispatch(signInStart());

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success === false) {
        setLoading(false);
        setError(data.message);
        if (!isSignUp) dispatch(signInFailure(data.message));
        return;
      }

      setLoading(false);
      
      if (isSignUp) {
        setIsSignUp(false);
        setError("Account created! Please login.");
        setFormData({});
      } else {
        dispatch(signInSuccess(data));
        onClose(); 
      }

    } catch (error) {
      setLoading(false);
      setError(error.message);
      if (!isSignUp) dispatch(signInFailure(error.message));
    }
  };

  return (
    // FIX: bg-black/60 ensure karega ki background transparent ho
    // backdrop-blur-sm peeche ki website ko dhundhla karega
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
      
      <div className="bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 relative overflow-hidden animate-fadeIn">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
        >
          <FaTimes size={20} />
        </button>

        <div className="p-8">
          <h2 className="text-3xl font-bold text-center text-slate-100 mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400 text-center mb-6 text-sm">
            {isSignUp ? 'Join OasisSpace to explore homes.' : 'Sign in to view property details.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <input
                type="text"
                placeholder="Username"
                id="username"
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-3 focus:outline-none focus:border-slate-500 placeholder:text-slate-500"
                onChange={handleChange}
                required
              />
            )}

            <input
              type="email"
              placeholder="Email"
              id="email"
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-3 focus:outline-none focus:border-slate-500 placeholder:text-slate-500"
              onChange={handleChange}
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                id="password"
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-3 w-full focus:outline-none focus:border-slate-500 placeholder:text-slate-500"
                onChange={handleChange}
                required
              />
              <div 
                className='absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-200'
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>

            <button 
              disabled={loading}
              className="bg-slate-100 text-slate-900 font-bold p-3 rounded-lg hover:bg-slate-200 transition-colors mt-2 uppercase disabled:opacity-70 shadow-md"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="flex gap-2 mt-5 justify-center text-sm">
            <p className="text-slate-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <span 
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-blue-400 hover:text-blue-300 cursor-pointer font-semibold underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </span>
          </div>

          {error && (
            <p className="text-red-400 bg-red-900/20 border border-red-900/50 p-2 rounded text-center mt-4 text-sm">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}