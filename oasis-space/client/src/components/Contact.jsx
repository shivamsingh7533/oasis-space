import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaPaperPlane, FaUserCircle, FaSpinner, FaCheckCircle } from 'react-icons/fa';

export default function Contact({ listing }) {
  const { currentUser } = useSelector((state) => state.user);
  const [landlord, setLandlord] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const onChange = (e) => {
    setMessage(e.target.value);
  };

  useEffect(() => {
    const fetchLandlord = async () => {
      try {
        const res = await fetch(`/api/user/${listing.userRef}`);
        const data = await res.json();
        
        if (data.success === false) {
             setLoading(false);
             return;
        }
        setLandlord(data);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    // ✅ FIX: Added 'listing' to dependency array to satisfy ESLint
    if (listing) {
        fetchLandlord();
    }
  }, [listing]); 

  const handleSendMessage = async () => {
      if(!message.trim()) return;

      try {
          setSending(true);
          setError(false);

          const res = await fetch('/api/user/contact', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  landlordId: landlord._id,
                  listingName: listing.name,
                  message: message,
                  senderName: currentUser.username,
                  senderEmail: currentUser.email
              }),
          });

          const data = await res.json();

          if (data.success === false) {
              setError('Failed to send message.');
              setSending(false);
              return;
          }

          setSuccess(true);
          setSending(false);
          setMessage(''); 

      } catch (error) {
          console.log(error);
          setError('Something went wrong.');
          setSending(false);
      }
  };

  return (
    <>
      {loading ? (
           <p className='text-slate-400 text-sm animate-pulse'>Loading owner details...</p>
      ) : landlord && (
        <div className='flex flex-col gap-4 bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg mt-4 animate-in fade-in zoom-in duration-300'>
          
          {/* OWNER INFO HEADER */}
          <div className='flex items-center gap-3 border-b border-slate-700 pb-3'>
               {landlord.avatar ? (
                   <img src={landlord.avatar} alt="owner" className='w-10 h-10 rounded-full object-cover bg-slate-600 border border-slate-500' />
               ) : (
                   <FaUserCircle className='text-4xl text-slate-400' />
               )}
               <div>
                   <p className='text-slate-400 text-xs uppercase font-bold tracking-wider'>Property Owner</p>
                   <p className='text-white font-bold capitalize'>{landlord.username}</p>
               </div>
          </div>

          {/* SUCCESS MESSAGE */}
          {success ? (
              <div className='bg-green-500/10 border border-green-500/50 text-green-400 p-6 rounded-lg text-center flex flex-col items-center gap-2 animate-fadeIn'>
                  <FaCheckCircle className='text-4xl mb-1' />
                  <p className='font-bold text-lg'>Message Sent Successfully!</p>
                  <p className='text-sm text-green-300/80'>The owner has been notified via email.</p>
              </div>
          ) : (
              /* FORM */
              <>
                <p className='text-slate-300 text-sm'>
                    Send a direct message to inquire about <span className='text-indigo-400 font-semibold'>{listing.name}</span>.
                </p>
                
                <textarea
                    name='message'
                    id='message'
                    rows='3'
                    value={message}
                    onChange={onChange}
                    placeholder='Hi, is this property still available? I am interested...'
                    className='w-full bg-slate-900 text-white border border-slate-600 p-3 rounded-lg focus:outline-none focus:border-indigo-500 placeholder-slate-500 resize-none transition focus:ring-1 focus:ring-indigo-500'
                ></textarea>

                <button
                    onClick={handleSendMessage}
                    disabled={sending || !message.trim()}
                    className='bg-indigo-600 text-white text-center p-3 rounded-lg uppercase font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95'
                >
                    {sending ? (
                        <> <FaSpinner className='animate-spin' /> Sending... </>
                    ) : (
                        <> <FaPaperPlane /> Send Message </>
                    )}
                </button>

                {error && <p className='text-red-400 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20'>{error}</p>}
                
                <p className='text-[10px] text-center text-slate-500'>
                    Your email address will be shared with the owner.
                </p>
              </>
          )}
        </div>
      )}
    </>
  );
}