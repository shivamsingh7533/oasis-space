import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaHeart,
  FaTimes,
  FaPaperPlane,
} from 'react-icons/fa';

export default function Footer() {
  const [showContact, setShowContact] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setSending(true);
    setStatus(null);
    try {
      const res = await fetch('/api/user/contact-us', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => { setShowContact(false); setStatus(null); }, 2500);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
    setSending(false);
  };

  return (
    <footer className='bg-slate-900 text-slate-300 text-sm mt-auto border-t border-slate-800'>
      {/* Top Section - 4 Columns */}
      <div className='max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8'>

        {/* Column 1: Brand & About */}
        <div className='flex flex-col gap-4'>
          <Link to='/' className='flex items-center gap-1'>
            <h1 className='font-bold text-2xl flex flex-wrap'>
              <span className='text-slate-200'>Oasis</span>
              <span className='text-slate-100'>Space</span>
              <span className='text-blue-500 text-2xl'>.</span>
            </h1>
          </Link>
          <p className='text-slate-400 leading-relaxed text-sm'>
            Experience the best property finding service in town. Find your next perfect place with ease, comfort, and trust.
          </p>

          {/* --- SOCIAL MEDIA LINKS --- */}
          <div className='flex gap-4 mt-2'>
            <a
              href='https://www.facebook.com/profile.php?id=100025819383094'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Follow us on Facebook'
              className='bg-slate-800 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300'
            >
              <FaFacebook className="text-lg" />
            </a>
            <a
              href='https://twitter.com'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Follow us on Twitter'
              className='bg-slate-800 p-2 rounded-full hover:bg-sky-500 hover:text-white transition-all duration-300'
            >
              <FaTwitter className="text-lg" />
            </a>
            <a
              href='https://www.instagram.com/shivam_singh_7533?igsh=MTMzNDUzaDJ1d2Q2'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Follow us on Instagram'
              className='bg-slate-800 p-2 rounded-full hover:bg-pink-600 hover:text-white transition-all duration-300'
            >
              <FaInstagram className="text-lg" />
            </a>
            <a
              href='https://www.linkedin.com/in/shivam-kumar-b61784293?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Connect with us on LinkedIn'
              className='bg-slate-800 p-2 rounded-full hover:bg-blue-700 hover:text-white transition-all duration-300'
            >
              <FaLinkedin className="text-lg" />
            </a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h2 className='font-bold text-white mb-4 uppercase tracking-wider text-sm border-b-2 border-blue-500 inline-block pb-1'>Quick Links</h2>
          <ul className='flex flex-col gap-3'>
            <li><Link to='/' className='hover:text-blue-400 transition-colors flex items-center gap-2'>Home</Link></li>
            <li><Link to='/search' className='hover:text-blue-400 transition-colors flex items-center gap-2'>Listings</Link></li>
            <li><Link to='/about' className='hover:text-blue-400 transition-colors flex items-center gap-2'>About Us</Link></li>
            <li><Link to='/create-listing' className='hover:text-blue-400 transition-colors flex items-center gap-2'>Create Listing</Link></li>
          </ul>
        </div>

        {/* Column 3: Support */}
        <div>
          <h2 className='font-bold text-white mb-4 uppercase tracking-wider text-sm border-b-2 border-blue-500 inline-block pb-1'>Support</h2>
          <ul className='flex flex-col gap-3'>
            <li><Link to='/profile' className='hover:text-blue-400 transition-colors'>My Account</Link></li>
            <li><Link to='/faq' className='hover:text-blue-400 transition-colors'>FAQ</Link></li>
            <li><Link to='/terms' className='hover:text-blue-400 transition-colors'>Terms of Service</Link></li>
            <li><Link to='/privacy' className='hover:text-blue-400 transition-colors'>Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Column 4: Contact Us */}
        <div>
          <h2 className='font-bold text-white mb-4 uppercase tracking-wider text-sm border-b-2 border-blue-500 inline-block pb-1'>Contact Us</h2>
          <ul className='flex flex-col gap-4'>
            <li className='flex items-start gap-3 group'>
              <FaMapMarkerAlt className='text-blue-500 mt-1 text-lg group-hover:animate-bounce' />
              <a
                href="https://www.google.com/maps/search/?api=1&query=Jaipur+Rajasthan+India"
                target="_blank"
                rel="noreferrer"
                className='hover:text-white transition-colors'
              >
                Jaipur, Rajasthan, India
              </a>
            </li>
            <li className='flex items-center gap-3 group'>
              <FaPhoneAlt className='text-blue-500 text-lg group-hover:rotate-12 transition-transform' />
              <a href="tel:+919876543210" className='hover:text-white transition-colors'>+91 98765 43210</a>
            </li>
            <li className='flex items-center gap-3 group'>
              <FaEnvelope className='text-blue-500 text-lg group-hover:scale-110 transition-transform' />
              <button
                onClick={() => setShowContact(true)}
                className='hover:text-white transition-colors break-all text-left cursor-pointer'
              >
                oasisspace60@gmail.com
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Section - Copyright & Credit */}
      <div className='bg-slate-950 py-6 px-4 border-t border-slate-800'>
        <div className='max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left'>
          <p className='text-slate-400'>
            © {new Date().getFullYear()} <span className='font-bold text-slate-200'>OasisSpace</span>. All rights reserved.
          </p>
          <p className='flex items-center gap-1 text-slate-400'>
            Made with <FaHeart className='text-red-500 animate-pulse mx-1' /> by
            <a
              href='https://www.linkedin.com/in/shivam-kumar-b61784293'
              target='_blank'
              rel='noreferrer'
              className='font-bold text-blue-400 hover:text-blue-300 hover:underline'
            >
              Shivam
            </a>
          </p>
        </div>
      </div>

      {/* ✉️ CONTACT POPUP MODAL */}
      {showContact && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4' onClick={() => setShowContact(false)}>
          <div
            className='bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl w-full max-w-md p-6 relative animate-fadeIn'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button onClick={() => setShowContact(false)} className='absolute top-4 right-4 text-slate-400 hover:text-white transition'>
              <FaTimes className='text-lg' />
            </button>

            <h3 className='text-xl font-bold text-white mb-1 flex items-center gap-2'>
              <FaEnvelope className='text-blue-500' /> Contact Us
            </h3>
            <p className='text-slate-400 text-xs mb-5'>We'll get back to you at your email.</p>

            <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
              <input
                type='text'
                placeholder='Your Name'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className='bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500'
              />
              <input
                type='email'
                placeholder='Your Email'
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className='bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500'
              />
              <textarea
                placeholder='Your Message...'
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                className='bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500 resize-none'
              />
              <button
                type='submit'
                disabled={sending}
                className='bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/30'
              >
                <FaPaperPlane /> {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>

            {status === 'success' && (
              <p className='mt-4 text-center text-green-400 font-semibold text-sm bg-green-500/10 p-3 rounded-xl border border-green-500/20'>
                ✅ Message sent successfully!
              </p>
            )}
            {status === 'error' && (
              <p className='mt-4 text-center text-red-400 font-semibold text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20'>
                ❌ Failed to send. Please try again.
              </p>
            )}
          </div>
        </div>
      )}
    </footer>
  );
}