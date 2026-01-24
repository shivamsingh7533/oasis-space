import { useState, useMemo } from 'react';
import { FaCalculator, FaMoneyBillWave, FaPercentage, FaCalendarAlt } from 'react-icons/fa';

export default function EMICalculator({ price }) {
  // Default values: 20% Down Payment, 8.5% Interest, 20 Years
  const [downPayment, setDownPayment] = useState(Math.floor(price * 0.2));
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  const emi = useMemo(() => {
    const principal = price - downPayment;
    const rate = interestRate / 12 / 100; // Monthly Interest Rate
    const time = tenure * 12; // Months

    if (principal > 0 && rate > 0 && time > 0) {
      const calculatedEmi = (principal * rate * Math.pow(1 + rate, time)) / (Math.pow(1 + rate, time) - 1);
      return Math.round(calculatedEmi);
    }
    return 0;
  }, [price, downPayment, interestRate, tenure]);

  return (
    // ✅ CHANGED: Main background to dark (slate-800) and text to white
    <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 mt-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
            <FaCalculator className="text-xl text-indigo-400" />
        </div>
        <h3 className="text-xl font-bold text-white">Mortgage Calculator</h3>
      </div>

      {/* --- Inputs Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Total Price (Read Only) */}
        <div>
           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Price</label>
           <div className="flex items-center bg-slate-900/50 border border-slate-700 p-3 rounded-xl mt-2 cursor-not-allowed">
              {/* ✅ CHANGED: Symbol to ₹ */}
              <span className="font-bold mr-2 text-slate-500">₹</span>
              <input type="number" value={price} disabled className="bg-transparent w-full outline-none text-slate-400 font-mono" />
           </div>
        </div>

        {/* Down Payment */}
        <div>
           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Down Payment</label>
           <div className="flex items-center bg-slate-700/30 border border-slate-600 p-3 rounded-xl mt-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
              <FaMoneyBillWave className="text-slate-400 mr-2" />
              {/* ✅ CHANGED: Symbol to ₹ */}
              <span className="font-bold mr-1 text-slate-300">₹</span>
              <input 
                type="number" 
                value={downPayment} 
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full bg-transparent outline-none text-white font-semibold"
              />
           </div>
        </div>

        {/* Interest Rate */}
        <div>
           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interest Rate (%)</label>
           <div className="flex items-center bg-slate-700/30 border border-slate-600 p-3 rounded-xl mt-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
              <FaPercentage className="text-slate-400 mr-2" />
              <input 
                type="number" 
                value={interestRate} 
                onChange={(e) => setInterestRate(Number(e.target.value))}
                step="0.1"
                className="w-full bg-transparent outline-none text-white font-semibold"
              />
           </div>
        </div>

        {/* Loan Tenure */}
        <div>
           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
              <span>Duration</span>
              <span className="text-indigo-400">{tenure} Years</span>
           </label>
           <div className="flex items-center bg-slate-700/30 border border-slate-600 p-3 rounded-xl mt-2">
              <FaCalendarAlt className="text-slate-400 mr-2" />
              <input 
                type="range" 
                min="5" max="30" 
                value={tenure} 
                onChange={(e) => setTenure(Number(e.target.value))}
                className="w-full cursor-pointer accent-indigo-500 h-2 bg-slate-600 rounded-lg appearance-none"
              />
           </div>
        </div>

      </div>

      {/* --- Result Section --- */}
      {/* ✅ CHANGED: Background to match dark theme deeper shade */}
      <div className="mt-8 bg-slate-900 border border-slate-700 p-6 rounded-2xl text-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Estimated Monthly Payment</p>
        
        {/* ✅ CHANGED: Currency to ₹ and locale to 'en-IN' */}
        <p className="text-4xl font-extrabold text-white mt-2">
            ₹ {emi.toLocaleString('en-IN')}
            <span className="text-sm font-medium text-slate-500 ml-1">/mo</span>
        </p>
      </div>
    </div>
  );
}