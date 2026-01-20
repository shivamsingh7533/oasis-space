import { Link } from 'react-router-dom';
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaHeart,
} from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className='bg-slate-900 text-slate-300 text-sm mt-auto'>
      {/* Top Section - 4 Columns */}
      <div className='max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8'>
        
        {/* Column 1: Brand & About */}
        <div className='flex flex-col gap-4'>
          <Link to='/'>
            <h1 className='font-bold text-2xl flex flex-wrap'>
              <span className='text-slate-400'>Oasis</span>
              <span className='text-slate-100'>Space</span>
              <span className='text-red-500 text-xl'>.</span>
            </h1>
          </Link>
          <p className='text-slate-400 leading-relaxed'>
            Experience the best property finding service in town. Find your next perfect place with ease and comfort.
          </p>
          
          {/* --- SOCIAL MEDIA LINKS --- */}
          {/* Yahan apne links replace karein */}
          <div className='flex gap-4 mt-2'>
            <a 
              href='https://www.facebook.com/profile.php?id=100025819383094' 
              target='_blank' 
              rel='noopener noreferrer'
              className='text-2xl hover:text-white transition-colors'
            >
              <FaFacebook />
            </a>
            <a 
              href='https://twitter.com/YOUR_ID' 
              target='_blank' 
              rel='noopener noreferrer'
              className='text-2xl hover:text-white transition-colors'
            >
              <FaTwitter />
            </a>
            <a 
              href='https://www.instagram.com/shivam_singh_7533?igsh=MTMzNDUzaDJ1d2Q2' 
              target='_blank' 
              rel='noopener noreferrer'
              className='text-2xl hover:text-white transition-colors'
            >
              <FaInstagram />
            </a>
            <a 
              href='https://www.linkedin.com/in/shivam-kumar-b61784293?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app' 
              target='_blank' 
              rel='noopener noreferrer'
              className='text-2xl hover:text-white transition-colors'
            >
              <FaLinkedin />
            </a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className='font-bold text-slate-100 mb-4 uppercase tracking-wider'>Quick Links</h3>
          <ul className='flex flex-col gap-2'>
            <li><Link to='/' className='hover:text-white transition-colors'>Home</Link></li>
            <li><Link to='/search' className='hover:text-white transition-colors'>Listings</Link></li>
            <li><Link to='/about' className='hover:text-white transition-colors'>About Us</Link></li>
            <li><Link to='/contact' className='hover:text-white transition-colors'>Contact</Link></li>
            <li><Link to='/create-listing' className='hover:text-white transition-colors'>Create Listing</Link></li>
          </ul>
        </div>

        {/* Column 3: Support */}
        <div>
          <h3 className='font-bold text-slate-100 mb-4 uppercase tracking-wider'>Support</h3>
          <ul className='flex flex-col gap-2'>
            <li><Link to='/faq' className='hover:text-white transition-colors'>FAQ</Link></li>
            <li><Link to='/help' className='hover:text-white transition-colors'>Help Center</Link></li>
            <li><Link to='/terms' className='hover:text-white transition-colors'>Terms of Service</Link></li>
            <li><Link to='/privacy' className='hover:text-white transition-colors'>Privacy Policy</Link></li>
            <li><Link to='/cookies' className='hover:text-white transition-colors'>Cookie Policy</Link></li>
          </ul>
        </div>

        {/* Column 4: Contact Us */}
        <div>
          <h3 className='font-bold text-slate-100 mb-4 uppercase tracking-wider'>Contact Us</h3>
          <ul className='flex flex-col gap-4'>
            <li className='flex items-start gap-3'>
              <FaMapMarkerAlt className='text-slate-100 mt-1 text-lg' />
              <span>Jaipur, Rajasthan, India</span>
            </li>
            <li className='flex items-center gap-3'>
              <FaPhoneAlt className='text-slate-100 text-lg' />
              <span>+91 98765 43210</span>
            </li>
            <li className='flex items-center gap-3'>
              <FaEnvelope className='text-slate-100 text-lg' />
              <a href='mailto:support@oasisspace.com' className='hover:text-white'>support@oasisspace.com</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Section - Copyright & Credit */}
      <div className='bg-slate-950 py-4 px-4'>
        <div className='max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left'>
          <p>© {new Date().getFullYear()} <span className='font-bold text-slate-100'>OasisSpace</span>. All rights reserved.</p>
          <p className='flex items-center gap-1'>
            Made with <FaHeart className='text-red-500 animate-pulse' /> by <span className='font-bold text-slate-100'>Gautam</span>
          </p>
        </div>
      </div>
    </footer>
  );
}