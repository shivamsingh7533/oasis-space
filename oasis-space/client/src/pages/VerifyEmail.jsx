import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaTimes, FaSpinner } from 'react-icons/fa';

export default function VerifyEmailModal({ email, onClose }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Debugging ke liye (Check Console F12)
    console.log("Sending for verification:", { email, otp });

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (data.success === false) {
        setLoading(false);
        setError(data.message);
        return;
      }

      setLoading(false);
      alert('Verification Successful! Please Login.');
      
      // Success hone par Modal band aur Login page par bhejo
      onClose(); 
      navigate('/sign-in');

    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-all">
      
      {/* Modal Card */}
      <div className="bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 relative overflow-hidden animate-fadeIn">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <FaTimes size={20} />
        </button>

        <div className="p-8 flex flex-col items-center">
          
          {/* Icon */}
          <div className='bg-slate-700 p-4 rounded-full mb-4 shadow-inner'>
            <FaShieldAlt className='text-4xl text-green-500' />
          </div>

          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            Verify OTP
          </h2>
          
          <p className="text-slate-400 text-center mb-6 text-sm">
            Enter the 6-digit code sent to <br/>
            <span className="text-blue-400 font-semibold">{email}</span>
          </p>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <input
              type="text"
              placeholder="XXXXXX"
              className="bg-slate-900 border border-slate-600 text-slate-200 text-center text-2xl tracking-[0.5em] rounded-lg p-3 focus:outline-none focus:border-green-500 transition-all placeholder:tracking-normal w-full"
              onChange={(e) => setOtp(e.target.value.trim())}
              maxLength={6}
              required
              autoFocus
            />

            <button 
              disabled={loading}
              className="bg-green-600 text-white font-bold p-3 rounded-lg hover:bg-green-700 transition-colors mt-2 uppercase disabled:opacity-70 shadow-lg flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className='animate-spin' /> Verifying...
                </>
              ) : 'Verify Email'}
            </button>
          </form>

          {error && (
            <p className="text-red-400 bg-red-900/20 border border-red-900/50 p-2 rounded text-center mt-4 text-sm w-full">
              {error}
            </p>
          )}
          
          <p className='text-xs text-slate-500 mt-4'>
            Didn't receive code? Check spam folder.
          </p>
        </div>
      </div>
    </div>
  );
}