import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaQuestionCircle } from 'react-icons/fa';

export default function FAQ() {
  const faqs = [
    {
      question: "How do I list my property on OasisSpace?",
      answer: "First, you need to register and become a 'Verified Seller'. Once approved, go to your profile, click 'List a Property', fill in the details, upload photos, and pay the listing fee."
    },
    {
      question: "Is it free to browse properties?",
      answer: "Yes! Searching for properties, viewing details, using the map, and contacting landlords is completely free for buyers and tenants."
    },
    {
      question: "What are the charges for listing a property?",
      answer: "We charge a one-time fee of ₹1,100 for Rent listings and ₹5,100 for Sale listings. This ensures only genuine owners list on our platform."
    },
    {
      question: "How does the AI Assistant work?",
      answer: "Our AI 'Jarvis' helps you find properties by chatting. You can ask things like 'Show me 2BHK in Mumbai under 20k', and it will fetch real-time data from our database."
    },
    {
      question: "Can I edit my listing after posting?",
      answer: "Yes, you can go to your profile > My Properties and click the 'Edit' button to update price, photos, or description anytime."
    },
    {
      question: "How do I contact support?",
      answer: "You can email us at oasisspace60@gmail.com or call our support number mentioned in the footer."
    }
  ];

  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className='min-h-screen bg-slate-900 text-slate-200 py-16 px-4'>
      <div className='max-w-3xl mx-auto'>
        
        <div className='text-center mb-10'>
            <h1 className='text-3xl font-bold text-white mb-2 flex justify-center items-center gap-2'>
                <FaQuestionCircle className='text-blue-500' /> Frequently Asked Questions
            </h1>
            <p className='text-slate-400'>Got questions? We have answers.</p>
        </div>

        <div className='space-y-4'>
            {faqs.map((faq, index) => (
                <div key={index} className='bg-slate-800 rounded-xl border border-slate-700 overflow-hidden transition-all duration-300'>
                    <button 
                        onClick={() => toggleFAQ(index)}
                        className='w-full flex justify-between items-center p-5 text-left hover:bg-slate-700/50 transition'
                    >
                        <span className='font-semibold text-lg text-white'>{faq.question}</span>
                        {activeIndex === index ? <FaChevronUp className='text-blue-400' /> : <FaChevronDown className='text-slate-500' />}
                    </button>
                    
                    {activeIndex === index && (
                        <div className='p-5 pt-0 text-slate-300 leading-relaxed border-t border-slate-700/50 bg-slate-800/50'>
                            {faq.answer}
                        </div>
                    )}
                </div>
            ))}
        </div>

      </div>
    </div>
  );
}