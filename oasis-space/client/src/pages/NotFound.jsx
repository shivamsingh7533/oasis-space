import { Link } from 'react-router-dom';
import { FaHome, FaSearch } from 'react-icons/fa';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 pt-10 pb-16">
      <p className="text-[#3b82f6] font-semibold text-sm tracking-widest uppercase mb-2">Error 404</p>
      <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
        Ye URL OasisSpace par exist nahi karta. Home ya Search se apni dream property dhoondo.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link to="/" className="px-6 py-3 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold transition flex items-center justify-center gap-2">
          <FaHome /> Home
        </Link>
        <Link to="/search" className="px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 border" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
          <FaSearch /> Search Property
        </Link>
      </div>
    </div>
  );
}