import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    setMessage('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success === false) {
        setError(true);
        setMessage(data.message);
        setLoading(false);
        return;
      }
      setMessage('✅ Email sent! Check your inbox.');
      setLoading(false);
    } catch (error) {
      console.log(error);
      setError(true);
      setMessage('Something went wrong!');
      setLoading(false);
    }
  };

  return (
    // Outer Container: Dark Background
    <div className='bg-slate-900 min-h-screen flex items-center justify-center p-3'>
      
      {/* Card: Dark Slate, Shadow, Border */}
      <div className='bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700'>
        
        <h1 className='text-3xl text-center font-bold text-slate-100 mb-4'>Forgot Password 🔒</h1>
        
        <p className='text-center text-slate-400 mb-8 text-sm'>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <input
            type='email'
            placeholder='Enter your email'
            // Input Styling: Dark Slate background, Light Text
            className='bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <button 
            disabled={loading}
            className='bg-blue-600 text-white p-3 rounded-lg uppercase hover:bg-blue-500 disabled:opacity-80 transition font-semibold shadow-md'
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {/* Message Box */}
        {message && (
          <div className={`mt-5 p-3 rounded text-center text-sm font-medium ${error ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
            {message}
          </div>
        )}

        <div className='flex gap-2 mt-6 justify-center text-sm'>
          <p className='text-slate-400'>Remembered Password?</p>
          <Link to='/sign-in'>
            <span className='text-blue-400 hover:text-blue-300 hover:underline'>Sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}