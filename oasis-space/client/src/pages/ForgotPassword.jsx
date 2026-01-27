import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  
  // Step 1 = Send OTP, Step 2 = Verify & Change Password
  const [step, setStep] = useState(1); 
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // ✅ Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
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
      
      // Success: Next Step pe jao
      setMessage('✅ OTP sent! Check your inbox.');
      setStep(2); 
      setLoading(false);

    } catch (error) {
      // ✅ FIX: Error ko use kar liya taaki ESLint warning na aaye
      console.log(error);
      setError(true);
      setMessage('Something went wrong!');
      setLoading(false);
    }
  };

  // ✅ Step 2: Verify OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    setMessage('');

    try {
      // Backend ab { email, otp, password } expect kar raha hai
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      });

      const data = await res.json();

      if (data.success === false) {
        setError(true);
        setMessage(data.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      alert('Password Changed Successfully! Please Login.');
      navigate('/sign-in');

    } catch (error) {
      // Yahan hum error message dikha rahe hain, to ye already "Used" hai
      setError(true);
      setMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div className='bg-slate-900 min-h-screen flex items-center justify-center p-3'>
      
      <div className='bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700'>
        
        <h1 className='text-3xl text-center font-bold text-slate-100 mb-4'>
            {step === 1 ? 'Forgot Password 🔒' : 'Reset Password 🔑'}
        </h1>
        
        <p className='text-center text-slate-400 mb-8 text-sm'>
          {step === 1 
            ? "Enter your email address and we'll send you a 6-digit code."
            : `Enter the code sent to ${email} and your new password.`
          }
        </p>
        
        {/* --- FORM STEP 1: SEND OTP --- */}
        {step === 1 && (
            <form onSubmit={handleSendOtp} className='flex flex-col gap-4'>
            <input
                type='email'
                placeholder='Enter your email'
                className='bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            
            <button 
                disabled={loading}
                className='bg-blue-600 text-white p-3 rounded-lg uppercase hover:bg-blue-500 disabled:opacity-80 transition font-semibold shadow-md'
            >
                {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
            </form>
        )}

        {/* --- FORM STEP 2: VERIFY & RESET --- */}
        {step === 2 && (
            <form onSubmit={handleResetPassword} className='flex flex-col gap-4'>
                <input
                    type='text'
                    placeholder='Enter 6-digit OTP'
                    className='bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-center tracking-widest text-xl'
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                />

                <input
                    type='password'
                    placeholder='New Password'
                    className='bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                />
            
                <button 
                    disabled={loading}
                    className='bg-green-600 text-white p-3 rounded-lg uppercase hover:bg-green-500 disabled:opacity-80 transition font-semibold shadow-md'
                >
                    {loading ? 'Resetting...' : 'Change Password'}
                </button>
                
                <button 
                    type='button'
                    onClick={() => setStep(1)}
                    className='text-slate-400 text-xs hover:text-slate-200 underline'
                >
                    Change Email / Resend Code
                </button>
            </form>
        )}

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