import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";

const EmailOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const register_by = location.state?.register_by;

  console.log("Email from state:", email);
  console.log("Register by from state:", register_by);

  // If page refreshed and email missing
  if (!email) {
    navigate("/");
  }

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      let data1 = "done";

      // Fetch account data
      if (register_by !== "By using App") {
        const response1 = await fetch(
          `https://corebanking.pythonanywhere.com/customer/account_fetch/${email}/`,
          {
            method: "GET",
          }
        );

        if (response1.ok) {
          const result = await response1.json();

          if (result && Object.keys(result).length > 0) {
            data1 = result; // data irundha assign
          }
        }

        console.log("Account Fetch Response:", data1);
      }

      // OTP verify
      const response = await fetch(
        "https://snapsterbe.techykarthikbms.com/api/email-verification/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            otp: otpValue,
            userData1: data1,
          }),
        }
      );

      const data = await response.json();

      console.log("OTP Response:", data);

      if (!response.ok) {
        alert(data.message || "OTP verification failed");
        return;
      }

      // Store data
      localStorage.setItem("verifiedUser", JSON.stringify(data));
      sessionStorage.setItem("userData1", JSON.stringify(data1));

      navigate("/verify", {
        state: { userData: data },
      });

    } catch (error) {
      console.error("OTP Error:", error);
      alert(
        "The entered email ID is not linked with the bank. Please enter a correct and registered email ID."
      );
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
              Enter the 6-digit code sent to {email}
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((value, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={value}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={(e) => e.target.select()}
                  ref={(el) => (inputRefs.current[index] = el)}
                  className="w-12 h-14 text-center text-xl font-semibold border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
            >
              Verify & Continue
            </Button>
          </form>

          <div className="text-center text-sm">
            Didn't receive code?{" "}
            <button
              type="button"
              className="text-blue-600 hover:underline"
            >
              Resend OTP
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default EmailOtp;
