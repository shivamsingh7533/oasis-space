import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PaymentLoading from './PaymentLoading';
import { FaCreditCard } from 'react-icons/fa';

export default function RazorpayBtn({ listing, btnText = "Pay Now", customStyle = "" }) {
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
      // B. Create Order (Backend Call)
      const amount = 500; // Example: ₹500
      
      const orderRes = await fetch('/api/order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount, listingId: listing._id })
      });
      
      const orderData = await orderRes.json();
      if (orderData.success === false) throw new Error(orderData.message);

      // ✅ SMART PREFILL LOGIC
      // Agar number dummy hai (0000000000) ya nahi hai, to contact field mat bhejo.
      // Razorpay tab user se uska number input karne ko bolega.
      const prefillData = {
          name: currentUser.username,
          email: currentUser.email
      };

      const userMobile = currentUser.mobile;
      const isDummyMobile = !userMobile || userMobile === "0000000000" || userMobile === "9999999999";

      if (!isDummyMobile) {
          prefillData.contact = userMobile;
      }

      // C. Open Razorpay Options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Frontend Key
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "OasisSpace",
        description: `Booking for ${listing.name}`,
        image: "https://cdn-icons-png.flaticon.com/512/1040/1040993.png", // Aapka logo URL
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
             
             const verifyData = await verifyRes.json();
             
             if (verifyData.success) {
                setPaymentStatus('success');
                setTimeout(() => {
                    setPaymentStatus(null);
                    // REDIRECT instead of RELOAD
                    navigate('/order-history'); 
                }, 3000);
             } else {
                setPaymentStatus('failed');
                setTimeout(() => setPaymentStatus(null), 3000);
             }

          } catch (error) {
             console.log(error);
             setPaymentStatus('failed');
             setTimeout(() => setPaymentStatus(null), 3000);
          }
        },
        // ✅ Updated Prefill Object
        prefill: prefillData,
        
        theme: {
          color: "#2563eb" // Blue Theme
        },
        // Handle Modal Close by User
        modal: {
            ondismiss: function() {
                setPaymentStatus(null);
            }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.log(error);
      setPaymentStatus('failed');
      setTimeout(() => setPaymentStatus(null), 3000);
    }
  };

  return (
    <>
      {/* The Button */}
      <button 
        onClick={handlePayment} 
        className={customStyle || "bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg uppercase font-bold shadow-lg transition flex items-center justify-center gap-2"}
      >
        <FaCreditCard /> {btnText}
      </button>

      {/* The Production Level Loader */}
      <PaymentLoading status={paymentStatus} />
    </>
  );
}