import React from 'react';

export default function Preloader() {
  return (
    <div className='fixed inset-0 bg-slate-200 flex flex-col items-center justify-center z-50'>
      {/* Logo Section */}
      <img 
        src='/logo.png'   // Make sure this matches your file path (or URL)
        alt='Oasis Space' 
        // CHANGED: w-52 h-52 (Bigger), rounded-full (Circle), shadow-2xl (Pop)
        className='w-52 h-52 object-cover mb-6 animate-bounce rounded-full shadow-2xl border-4 border-white' 
      />
      
      {/* Welcome Text */}
      <h1 className='text-4xl font-bold text-slate-700 animate-pulse font-serif'>
        Welcome to Oasis Space
      </h1>
      
      <p className='text-slate-500 mt-2 text-lg'>
        Finding your dream home...
      </p>
    </div>
  );
}