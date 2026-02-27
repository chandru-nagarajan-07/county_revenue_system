import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

// --- Mock UI Components ---
const Button = ({ children, className, ...props }) => (
  <button
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const DashboardHeader = () => (
  <header className="w-full h-16 border-b border-border bg-card flex items-center px-6 sm:px-8">
    <div className="font-bold text-lg text-foreground">SecureBank</div>
  </header>
);

// --- CORRECTED CSS Styles for the Loader ---
const loaderStyles = `
  .newtonsCradleLoader {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: absolute;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 20px;
  }
  .newtonsCradleLoader h1 {
    margin-bottom: 40px;
    color: #333;
    font-family: Roboto, Helvetica, serif;
    font-weight: bold;
    font-size: 24px;
  }
  
  /* Container for balls and shadows to ensure they stay horizontal */
  .newtonsCradleLoader .balls-container,
  .newtonsCradleLoader .shadows-container {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 0px; /* Balls touch each other like a real Newton's Cradle */
  }

  .newtonsCradleLoader .ball,
  .newtonsCradleLoader .shadow {
    /* Switched to block for flex alignment, width/height handled below */
    display: block; 
    width: 20px;
    border-radius: 50%;
    flex-shrink: 0; /* Prevent shrinking */
  }
  .newtonsCradleLoader .ball {
    height: 20px;
    background: #333;
    /* Transform origin needs to be top center for pendulum effect, 
       but the original keyframes use translate/rotate combinations. 
       We will keep original keyframes behavior but ensure layout is horizontal. */
  }
  .newtonsCradleLoader .shadow {
    height: 5px;
    background: black;
    opacity: 0.1;
    margin-top: 10px; /* Space between ball and shadow */
  }

  /* Loader Animations */
  .newtonsCradleLoader #b1 { animation: swing-left 1s ease-in-out infinite; transform-origin: top center; }
  .newtonsCradleLoader #b2 { animation: wiggle-left 1s ease-in-out infinite; animation-delay: 1s; }
  .newtonsCradleLoader #b3 { animation: wiggle-middle 1s ease-in-out infinite; animation-delay: 0.5s; }
  .newtonsCradleLoader #b4 { animation: wiggle-right 1s ease-in-out infinite; animation-delay: 0.5s; }
  .newtonsCradleLoader #b5 { animation: swing-right 1s ease-in-out infinite; animation-delay: 0.5s; transform-origin: top center; }

  .newtonsCradleLoader #s1 { animation: shadow-swing-left 1s ease-in-out infinite; }
  .newtonsCradleLoader #s2 { animation: shadow-wiggle-left 1s ease-in-out infinite; animation-delay: 1s; }
  .newtonsCradleLoader #s3 { animation: shadow-wiggle-middle 1s ease-in-out infinite; animation-delay: 0.5s; }
  .newtonsCradleLoader #s4 { animation: shadow-wiggle-right 1s ease-in-out infinite; animation-delay: 0.5s; }
  .newtonsCradleLoader #s5 { animation: shadow-swing-right 1s ease-in-out infinite; animation-delay: 0.5s; }

  @keyframes swing-left {
    0% { transform: rotate(0deg); background: #333; }
    25% { transform: rotate(35deg) translateX(-60px); background: #ff6600; }
    50% { transform: rotate(0deg); background: #333; }
    100% { transform: rotate(0deg); background: #333; }
  }
  @keyframes swing-right {
    0% { transform: rotate(0deg); background: #333; }
    25% { transform: rotate(-35deg) translateX(50px); background: #390; }
    50% { transform: rotate(0deg); background: #333; }
    100% { transform: rotate(0deg); background: #333; }
  }
  @keyframes wiggle-left {
    0% { transform: rotate(0deg); background: #333; }
    25% { transform: rotate(5deg) translateX(-5px); background: #cc5200; }
    50% { transform: rotate(0deg); background: #333; }
    100% { transform: rotate(0deg); background: #333; }
  }
  @keyframes wiggle-right {
    0% { transform: rotate(0deg); background: #333; }
    25% { transform: rotate(-5deg) translateX(5px); background: #2a8000; }
    50% { transform: rotate(0deg); background: #333; }
    100% { transform: rotate(0deg); background: #333; }
  }
  @keyframes wiggle-middle {
    0% { transform: rotate(0deg); background: #333; }
    25% { transform: rotate(-2.5deg) translateX(2.5px); background: #226600; }
    50% { transform: rotate(0deg); background: #333; }
    75% { transform: rotate(2.5deg) translateX(-2.5px); background: #b34700; }
    100% { transform: rotate(0deg); background: #333; }
  }

  @keyframes shadow-swing-left {
    0% { transform: translateX(0); }
    25% { transform: translateX(-50px) scale(0.95); opacity: 0.095; }
    50% { transform: translateX(0); }
    100% { transform: translateX(0); }
  }
  @keyframes shadow-swing-right {
    0% { transform: translateX(0); }
    25% { transform: translateX(50px) scale(0.95); opacity: 0.095; }
    50% { transform: translateX(0); }
    100% { transform: translateX(0); }
  }
  @keyframes shadow-wiggle-left {
    0% { transform: translateX(0); }
    25% { transform: translateX(-5px) scale(0.97); opacity: 0.097; }
    50% { transform: translateX(0); }
    100% { transform: translateX(0); }
  }
  @keyframes shadow-wiggle-right {
    0% { transform: translateX(0); }
    25% { transform: translateX(5px) scale(0.97); opacity: 0.097; }
    50% { transform: translateX(0); }
    100% { transform: translateX(0); }
  }
  @keyframes shadow-wiggle-middle {
    0% { transform: translateX(0); }
    25% { transform: translateX(2px) scale(0.99); opacity: 0.099; }
    50% { transform: translateX(0); }
    75% { transform: translateX(-2px) scale(0.99); opacity: 0.099; }
    100% { transform: translateX(0); }
  }
`;

// --- Loader Component ---
function NewtonsCradleLoader({ text }) {
  return (
    <div className="newtonsCradleLoader mt-8">
      <h1>{text}</h1>
      {/* Added className for flex container to ensure horizontal layout */}
      <div className="balls-container">
        <div id="b1" className="ball" />
        <div id="b2" className="ball" />
        <div id="b3" className="ball" />
        <div id="b4" className="ball" />
        <div id="b5" className="ball" />
      </div>
      <div className="shadows-container">
        <div id="s1" className="shadow" />
        <div id="s2" className="shadow" />
        <div id="s3" className="shadow" />
        <div id="s4" className="shadow" />
        <div id="s5" className="shadow" />
      </div>
    </div>
  );
}

// --- OTP Verification Component ---
const OtpVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp.map((d, idx) => (idx === index ? element.value : d))];
    setOtp(newOtp);

    if (element.value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length === 6) {
      alert("Successfully Verified!");
      navigate('/email-otp');
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
          className="w-full max-w-md bg-card rounded-xl shadow-lg border border-border p-8 space-y-6"
        >
          <div className="text-center">
            <div className="mx-auto w-fit p-4 bg-primary/10 rounded-full mb-4">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
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

// --- Main Page Controller ---
const VerificationFlowPage = () => {
  const [status, setStatus] = useState('device');
  
  useEffect(() => {
    // Inject styles
    const styleSheet = document.createElement("style");
    styleSheet.innerText = loaderStyles;
    document.head.appendChild(styleSheet);
    
    const timers = [];
    timers.push(setTimeout(() => setStatus('email'), 2000));
    timers.push(setTimeout(() => setStatus('phone'), 4000));
    timers.push(setTimeout(() => setStatus('otp'), 6000));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  if (status === 'otp') {
    return <OtpVerification />;
  }

  const loadingText = {
    device: 'Verifying Device...',
    email: 'Verifying Email...',
    phone: 'Verifying Phone...'
  }[status];

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      <NewtonsCradleLoader text={loadingText} />
    </div>
  );
};

export default VerificationFlowPage;