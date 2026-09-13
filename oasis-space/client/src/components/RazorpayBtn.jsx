import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PaymentLoading from './PaymentLoading';
import { FaCreditCard } from 'react-icons/fa';

export default function RazorpayBtn({ listing, btnText = "Pay Now", customStyle = "", onSuccess }) {
  const { currentUser } = useSelector((state) => state.user);
  const [paymentStatus, setPaymentStatus] = useState(null); // null | 'processing' | 'success' | 'failed'
  const navigate = useNavigate();

  // 1. Script Load Function
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // 2. Main Payment Handler
  const handlePayment = async () => {
    if (!currentUser) return alert("Please Login First!");

    // Start Loader
    setPaymentStatus('processing');

    // A. Load Script
    const res = await loadRazorpayScript();
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      setPaymentStatus(null);
      return;
    }

    try {
      // B. Create Order (Backend Call) — fee is computed server-side, never trust the client amount
      const orderRes = await fetch('/api/order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing._id })
      });

      const orderData = await orderRes.json();
      if (orderData.success === false) throw new Error(orderData.message);

      // ✅ SMART PREFILL LOGIC — mobile is optional now (Google sign-ins have none)
      const prefillData = {
          name: currentUser.username,
          email: currentUser.email
      };

      if (currentUser.mobile) {
          prefillData.contact = currentUser.mobile;
      }

      // ✅ FIX: Use import.meta.env for Vite
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      
      if (!razorpayKey) {
          alert("Razorpay Key Not Found! Check .env file.");
          setPaymentStatus('failed');
          return;
      }

      // C. Open Razorpay Options
      const options = {
        key: razorpayKey, // ✅ Fixed Variable
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "OasisSpace",
        description: `Publishing fee for ${listing.name}`,
        image: "https://cdn-icons-png.flaticon.com/512/1040/1040993.png",
        order_id: orderData.order.id, // Backend Order ID
        
        // D. Success Handler
        handler: async function (response) {
          try {
             // Verify Payment on Backend
             const verifyRes = await fetch('/api/order/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                   razorpay_order_id: response.razorpay_order_id,
                   razorpay_payment_id: response.razorpay_payment_id,
                   razorpay_signature: response.razorpay_signature
                })
             });

             setPaymentStatus('success');

             const verifyData = await verifyRes.json();

             if (verifyData.success) {
                if (onSuccess) {
                   onSuccess(verifyData);
                } else {
                   setTimeout(() => {
                       setPaymentStatus(null);
                       navigate('/order-history');
                   }, 1200);
                }
             } else {
                console.log(verifyData.message || 'Payment verification failed');
                setPaymentStatus(null);
             }

          } catch (error) {
             console.log(error);
             setPaymentStatus('failed');
             setTimeout(() => setPaymentStatus(null), 3000);
          }
        },
        prefill: prefillData,
        theme: {
          color: "#2563eb"
        },
        modal: {
            ondismiss: function() {
                setPaymentStatus(null);
            }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.log("Payment Error:", error);
      setPaymentStatus('failed');
      setTimeout(() => setPaymentStatus(null), 3000);
    }
  };

  return (
    <>
      <button 
        onClick={handlePayment} 
        className={customStyle || "bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg uppercase font-bold shadow-lg transition flex items-center justify-center gap-2"}
      >
        <FaCreditCard /> {btnText}
      </button>

      <PaymentLoading status={paymentStatus} />
    </>
  );
}