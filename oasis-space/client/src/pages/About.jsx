import React from 'react';
import { FaLinkedin, FaGithub, FaEnvelope, FaShieldAlt, FaRupeeSign, FaMagic } from 'react-icons/fa';

export default function About() {
  return (
    <div className="w-full min-h-screen py-12" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col gap-10">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-3 md:text-4xl" style={{ color: 'var(--text-heading)' }}>
            About OasisSpace
          </h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
            India's AI-powered marketplace to buy, rent and sell homes — built by a full-stack developer who wanted listings
            that are fast, trusted and genuinely real.
          </p>
        </div>

        {/* Mission */}
        <section className="flex flex-col gap-3 rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>Our Mission</h2>
          <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            Real estate portals are full of stale and duplicate listings. OasisSpace solves this by keeping listings honest:
            sellers go through verification, and Sale listings require a one-time fee while Rent listings publish free.
            That small friction removes the noise and keeps our marketplace honest for buyers, tenants and agents.
          </p>
        </section>

        {/* Trust signals */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
            <FaRupeeSign className="text-lg mb-2" style={{ color: 'var(--accent-color, #60a5fa)' }} />
            <h3 className="font-bold mb-1" style={{ color: 'var(--text-heading)' }}>Transparent Pricing</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Rent listings publish free. One-time ₹5,100 for Sale. No hidden commissions — browse and contact landlords free.
            </p>
          </div>
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
            <FaShieldAlt className="text-lg mb-2" style={{ color: 'var(--accent-color, #60a5fa)' }} />
            <h3 className="font-bold mb-1" style={{ color: 'var(--text-heading)' }}>Verified Sellers Only</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Every seller is verified, every payment goes through Razorpay, and OpenStreetMap shows you exactly where the property is.
            </p>
          </div>
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
            <FaMagic className="text-lg mb-2" style={{ color: 'var(--accent-color, #60a5fa)' }} />
            <h3 className="font-bold mb-1" style={{ color: 'var(--text-heading)' }}>AI-Powered Search</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Chat with Jarvis, our AI assistant, to find 2BHKs in your budget — it queries live data, not marketing copy.
            </p>
          </div>
        </section>

        {/* Founder / E-E-A-T block */}
        <section className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-heading)' }}>Built by</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--text-heading)' }}
            >
              SS
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Shivam Singh</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Founder &amp; Full-Stack Developer</p>
              <p className="text-xs mt-2 max-w-2xl leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                Shivam designed, built and maintains OasisSpace end-to-end — React frontend, Node.js/Express API,
                MongoDB database, Razorpay payments, and the AI assistant. The same identity is used consistently across
                the website, app manifest, package metadata and GitHub profile for reliable indexing of this project.
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs font-medium text-blue-500">
                <a href="https://github.com/shivamsingh7533" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline">
                  <FaGithub /> GitHub
                </a>
                <a href="https://oasis-space.vercel.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline">
                  <FaLinkedin /> Project
                </a>
                <a href="mailto:oasisspace60@gmail.com" className="flex items-center gap-1.5 hover:underline">
                  <FaEnvelope /> oasisspace60@gmail.com
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-heading)' }}>Get in Touch</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            For seller verification, listing questions or support, email <a href="mailto:oasisspace60@gmail.com" className="text-blue-500 hover:underline">oasisspace60@gmail.com</a> or
            use the contact form in the website footer. We try to reply within 24 hours.
          </p>
        </section>
      </div>
    </div>
  );
}