import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";

const EmailOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation(); // 1. Get access to passed state

  // 2. Retrieve the customer data passed from the Login page
  // If the user refreshes the page, this might be undefined, so we handle that in handleVerify
  const customer = location.state?.customer;

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Move to next input
    if (element.value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }

    // 3. Check if customer data exists before navigating
    if (customer) {
      // Pass the customer data forward to VerifyPage
      navigate('/verify', { state: { customer } });
    } else {
      // If customer data is missing (e.g., page refresh), send back to login
      alert("Session expired or invalid access. Please login again.");
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-card rounded-xl shadow-card border border-border p-8 space-y-6"
        >
          <div className="text-center">
            <div className="mx-auto w-fit p-4 bg-primary/10 rounded-full mb-4">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Email Verify OTP</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Enter the 6-digit code sent to your device
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={(e) => e.target.select()}
                  ref={(el) => (inputRefs.current[index] = el)}
                  className="w-12 h-14 text-center text-xl font-semibold border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))}
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold">
              Verify & Continue
            </Button>
          </form>

          <div className="text-center text-sm">
            Didn't receive code?{" "}
            <button type="button" className="text-blue-600 hover:underline">
              Resend OTP
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default EmailOtp;