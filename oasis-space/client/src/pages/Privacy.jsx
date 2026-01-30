import React from 'react';

export default function Privacy() {
  return (
    <div className='min-h-screen bg-slate-900 text-slate-200 py-16 px-4'>
      <div className='max-w-4xl mx-auto space-y-8'>
        
        {/* Header */}
        <div className='text-center space-y-2'>
            <h1 className='text-3xl font-bold text-white'>Privacy Policy</h1>
            <p className='text-slate-400'>Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content Box */}
        <div className='bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 space-y-6 leading-relaxed'>
            
            <section>
                <h2 className='text-xl font-bold text-blue-400 mb-3'>1. Introduction</h2>
                <p className='text-slate-300'>
                    Welcome to <strong>OasisSpace</strong>. We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our website.
                </p>
            </section>

            <section>
                <h2 className='text-xl font-bold text-blue-400 mb-3'>2. Information We Collect</h2>
                <ul className='list-disc list-inside text-slate-300 space-y-2'>
                    <li><strong>Personal Information:</strong> Name, email address, phone number, and profile details provided during signup.</li>
                    <li><strong>Property Data:</strong> Images, addresses, and descriptions of properties you list.</li>
                    <li><strong>Usage Data:</strong> Information on how you interact with our services (e.g., search history, saved listings).</li>
                </ul>
            </section>

            <section>
                <h2 className='text-xl font-bold text-blue-400 mb-3'>3. How We Use Your Data</h2>
                <p className='text-slate-300'>
                    We use your data to facilitate property transactions, connect buyers with sellers, improve our AI recommendations, and ensure platform security. We do <strong>not</strong> sell your personal data to third parties.
                </p>
            </section>

            <section>
                <h2 className='text-xl font-bold text-blue-400 mb-3'>4. Cookies</h2>
                <p className='text-slate-300'>
                    We use cookies to maintain your session, remember your preferences (like dark mode), and provide a seamless user experience. You can control cookie settings through your browser.
                </p>
            </section>

            <section>
                <h2 className='text-xl font-bold text-blue-400 mb-3'>5. Contact Us</h2>
                <p className='text-slate-300'>
                    If you have any questions about this policy, please contact us at: <a href="mailto:oasisspace60@gmail.com" className='text-blue-400 hover:underline'>oasisspace60@gmail.com</a>
                </p>
            </section>

        </div>
      </div>
    </div>
  );
}