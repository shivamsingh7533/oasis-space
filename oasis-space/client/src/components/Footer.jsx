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
              className='bg-slate-800 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300'
            >
              <FaFacebook className="text-lg" />
            </a>
            <a 
              href='https://twitter.com' 
              target='_blank' 
              rel='noopener noreferrer'
              className='bg-slate-800 p-2 rounded-full hover:bg-sky-500 hover:text-white transition-all duration-300'
            >
              <FaTwitter className="text-lg" />
            </a>
            <a 
              href='https://www.instagram.com/shivam_singh_7533?igsh=MTMzNDUzaDJ1d2Q2' 
              target='_blank' 
              rel='noopener noreferrer'
              className='bg-slate-800 p-2 rounded-full hover:bg-pink-600 hover:text-white transition-all duration-300'
            >
              <FaInstagram className="text-lg" />
            </a>
            <a 
              href='https://www.linkedin.com/in/shivam-kumar-b61784293?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app' 
              target='_blank' 
              rel='noopener noreferrer'
              className='bg-slate-800 p-2 rounded-full hover:bg-blue-700 hover:text-white transition-all duration-300'
            >
              <FaLinkedin className="text-lg" />
            </a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className='font-bold text-white mb-4 uppercase tracking-wider text-sm border-b-2 border-blue-500 inline-block pb-1'>Quick Links</h3>
          <ul className='flex flex-col gap-3'>
            <li><Link to='/' className='hover:text-blue-400 transition-colors flex items-center gap-2'>Home</Link></li>
            <li><Link to='/search' className='hover:text-blue-400 transition-colors flex items-center gap-2'>Listings</Link></li>
            <li><Link to='/about' className='hover:text-blue-400 transition-colors flex items-center gap-2'>About Us</Link></li>
            <li><Link to='/create-listing' className='hover:text-blue-400 transition-colors flex items-center gap-2'>Create Listing</Link></li>
          </ul>
        </div>

        {/* Column 3: Support */}
        <div>
          <h3 className='font-bold text-white mb-4 uppercase tracking-wider text-sm border-b-2 border-blue-500 inline-block pb-1'>Support</h3>
          <ul className='flex flex-col gap-3'>
            <li><Link to='/profile' className='hover:text-blue-400 transition-colors'>My Account</Link></li>
            <li><Link to='/faq' className='hover:text-blue-400 transition-colors'>FAQ</Link></li>
            <li><Link to='/terms' className='hover:text-blue-400 transition-colors'>Terms of Service</Link></li>
            <li><Link to='/privacy' className='hover:text-blue-400 transition-colors'>Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Column 4: Contact Us */}
        <div>
          <h3 className='font-bold text-white mb-4 uppercase tracking-wider text-sm border-b-2 border-blue-500 inline-block pb-1'>Contact Us</h3>
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
              <a href='mailto:oasisspace60@gmail.com' className='hover:text-white transition-colors break-all'>
                oasisspace60@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Section - Copyright & Credit */}
      <div className='bg-slate-950 py-6 px-4 border-t border-slate-800'>
        <div className='max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left'>
          <p className='text-slate-500'>
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
    </footer>
  );
}