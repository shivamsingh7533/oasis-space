import React from 'react';

export default function Terms() {
  return (
    <div className='min-h-screen bg-slate-900 text-slate-200 py-16 px-4'>
      <div className='max-w-4xl mx-auto space-y-8'>
        
        <div className='text-center space-y-2'>
            <h1 className='text-3xl font-bold text-white'>Terms of Service</h1>
            <p className='text-slate-400'>Please read these terms carefully before using OasisSpace.</p>
        </div>

        <div className='bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 space-y-6 leading-relaxed'>
            
            <section>
                <h2 className='text-xl font-bold text-green-400 mb-3'>1. Acceptance of Terms</h2>
                <p className='text-slate-300'>
                    By accessing or using OasisSpace, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
                </p>
            </section>

            <section>
                <h2 className='text-xl font-bold text-green-400 mb-3'>2. User Responsibilities</h2>
                <p className='text-slate-300'>
                    You are responsible for maintaining the confidentiality of your account and password. You agree to provide accurate information when creating listings. Fake listings or fraudulent activity will result in an immediate ban.
                </p>
            </section>

            <section>
                <h2 className='text-xl font-bold text-green-400 mb-3'>3. Property Listings</h2>
                <p className='text-slate-300'>
                    OasisSpace acts as a platform for connecting buyers/renters with owners. We do not own any properties listed. We are not responsible for disputes arising between users, though we will assist where possible.
                </p>
            </section>

            <section>
                <h2 className='text-xl font-bold text-green-400 mb-3'>4. Fees and Payments</h2>
                <p className='text-slate-300'>
                    Listing properties for Rent incurs a fee of ₹1,100, and for Sale incurs ₹5,100. All payments are processed securely via Razorpay. Fees are non-refundable once the listing is live.
                </p>
            </section>

            <section>
                <h2 className='text-xl font-bold text-green-400 mb-3'>5. Termination</h2>
                <p className='text-slate-300'>
                    We reserve the right to terminate or suspend access to our service immediately, without prior notice, for any breach of these Terms.
                </p>
            </section>

        </div>
      </div>
    </div>
  );
}