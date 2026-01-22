import React from 'react';

export default function About() {
  return (
    // 1. FIX: 'min-h-screen' aur 'bg-slate-900' yahan lagayein taaki poora page dark ho jaye
    <div className="w-full min-h-screen bg-slate-900 text-white py-12">
      
      {/* 2. RESPONSIVE CONTAINER: 
          - 'max-w-6xl': Content ko zyada failne se rokega (PC ke liye)
          - 'mx-auto': Content ko beech mein layega
          - 'px-4': Mobile mein text kinare se chipkega nahi (Left-Right Padding)
      */}
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        
        {/* Heading */}
        <h1 className="text-3xl font-bold mb-6 text-slate-200 md:text-4xl">
          About Oasis Space
        </h1>

        {/* Paragraphs */}
        <div className="flex flex-col gap-4 text-slate-300">
          <p className="text-sm md:text-lg leading-relaxed">
            Oasis Space is a leading real estate agency that specializes in helping clients buy, sell, and rent properties in the most desirable neighborhoods. Our team of experienced agents is dedicated to providing exceptional service.
          </p>
          
          <p className="text-sm md:text-lg leading-relaxed">
            Our mission is to help our clients achieve their real estate goals by providing expert advice, personalized service, and a deep understanding of the local market.
          </p>
          
          <p className="text-sm md:text-lg leading-relaxed">
            Our team of agents has a wealth of experience and knowledge in the real estate industry, and we are committed to providing the highest level of service to our clients.
          </p>
        </div>
        
      </div>
    </div>
  );
}