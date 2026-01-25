import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { id, token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(password !== confirmPassword) return alert("Passwords do not match!");
    
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/reset-password/${id}/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Password Updated Successfully! Please Login.');
        navigate('/sign-in');
      } else {
        alert(data.message || 'Error updating password');
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className='bg-slate-900 min-h-screen flex items-center justify-center p-3'>
      
      <div className='bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700'>
        
        <h1 className='text-3xl text-center font-bold text-slate-100 mb-6'>Reset Password 🔑</h1>
        
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <input
            type='password'
            placeholder='New Password'
            className='bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all'
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <input
            type='password'
            placeholder='Confirm New Password'
            className='bg-slate-700 border border-slate-600 text-slate-200 placeholder:text-slate-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all'
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button 
            disabled={loading} 
            className='bg-green-600 text-white p-3 rounded-lg uppercase hover:bg-green-500 disabled:opacity-80 transition font-semibold shadow-md mt-2'
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}