import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';

const OtpVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    // Update state for the specific index
    const newOtp = [...otp.map((d, idx) => (idx === index ? element.value : d))];
    setOtp(newOtp);

    // Auto-focus next input
    if (element.value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length === 6) {
      // Show success popup
      alert("Successfully Verified!");
      
      // Move to Login page
      navigate('/account');
    } else {
      alert("Please enter a valid 6-digit OTP");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader />
      
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
            <h2 className="font-display text-2xl font-bold text-foreground">
              Verify OTP
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              Enter the 6-digit code sent to your device
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-3">
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
                  className="w-12 h-14 text-center text-xl font-semibold border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                />
              ))}
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold">
              Verify & Continue
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Didn't receive code?{' '}
            <button className="text-primary font-medium hover:underline">
              Resend OTP
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default OtpVerification;