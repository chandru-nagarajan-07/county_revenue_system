import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Added AnimatePresence
import { User, Landmark, MapPin, CreditCard, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';

const AccountCreation = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    ifscCode: '',
    branch: '',
    accountNumber: ''
  });

  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false); // New state for popup

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validate = () => {
    let tempErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      tempErrors.name = "Account holder name is required";
      isValid = false;
    }

    if (!formData.ifscCode.trim()) {
      tempErrors.ifscCode = "IFSC code is required";
      isValid = false;
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) {
      tempErrors.ifscCode = "Invalid IFSC format (e.g., SBIN0001234)";
      isValid = false;
    }

    if (!formData.branch.trim()) {
      tempErrors.branch = "Branch name is required";
      isValid = false;
    }

    if (!formData.accountNumber.trim()) {
      tempErrors.accountNumber = "Account number is required";
      isValid = false;
    } else if (!/^\d{9,18}$/.test(formData.accountNumber)) {
      tempErrors.accountNumber = "Account number must be 9-18 digits";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      console.log("Bank Details Submitted:", formData);
      // Show the success popup
      setShowSuccess(true);
      
      // Navigate to dashboard after 2.5 seconds
      setTimeout(() => {
        navigate('/');
      }, 2500);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader />

      {/* Success Popup Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card rounded-2xl p-8 shadow-xl text-center max-w-sm w-full border border-border relative"
            >
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Verified Successfully!</h3>
              <p className="text-muted-foreground mb-6">
                Your bank account has been linked securely.
              </p>
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Redirecting to dashboard...
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg bg-card rounded-xl shadow-card border border-border p-8 space-y-8"
        >
          {/* Header Section */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <Landmark className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Bank Details
            </h2>
            <p className="text-muted-foreground">
              Link your bank account securely
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Account Holder Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Account Holder Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full rounded-xl border bg-background pl-12 pr-4 py-3 text-base outline-none focus:ring-2 transition-all
                    ${errors.name ? 'border-destructive focus:ring-destructive/50' : 'border-input focus:ring-ring'}`}
                />
              </div>
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            {/* IFSC Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">IFSC Code</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input 
                  type="text" 
                  name="ifscCode" 
                  value={formData.ifscCode} 
                  onChange={handleChange}
                  placeholder="SBIN0001234"
                  className={`w-full rounded-xl border bg-background pl-12 pr-4 py-3 text-base outline-none focus:ring-2 transition-all uppercase
                    ${errors.ifscCode ? 'border-destructive focus:ring-destructive/50' : 'border-input focus:ring-ring'}`}
                />
              </div>
              {errors.ifscCode && <p className="text-sm text-destructive">{errors.ifscCode}</p>}
            </div>

            {/* Branch Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Branch Name</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input 
                  type="text" 
                  name="branch" 
                  value={formData.branch} 
                  onChange={handleChange}
                  placeholder="Main Branch, New York"
                  className={`w-full rounded-xl border bg-background pl-12 pr-4 py-3 text-base outline-none focus:ring-2 transition-all
                    ${errors.branch ? 'border-destructive focus:ring-destructive/50' : 'border-input focus:ring-ring'}`}
                />
              </div>
              {errors.branch && <p className="text-sm text-destructive">{errors.branch}</p>}
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Account Number</label>
              <div className="relative">
                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input 
                  type="text" 
                  name="accountNumber" 
                  value={formData.accountNumber} 
                  onChange={handleChange}
                  placeholder="123456789012"
                  className={`w-full rounded-xl border bg-background pl-12 pr-4 py-3 text-base outline-none focus:ring-2 transition-all
                    ${errors.accountNumber ? 'border-destructive focus:ring-destructive/50' : 'border-input focus:ring-ring'}`}
                />
              </div>
              {errors.accountNumber && <p className="text-sm text-destructive">{errors.accountNumber}</p>}
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold mt-4">
              <CheckCircle className="mr-2 h-5 w-5" />
            Verify & Link Account
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>256-bit SSL Encrypted</span>
          </div>

        </motion.div>
      </main>
    </div>
  );
};

export default AccountCreation;