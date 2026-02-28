import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // Assuming framer-motion is installed
import { Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';

const ResetPassword = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear specific error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validate = () => {
    let tempErrors = {};
    let isValid = true;

    if (!formData.password) {
      tempErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!formData.confirmPassword) {
      tempErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate())return;
    try{
      const response = await fetch()
    }
    if (validate()) {
      console.log("Password Reset Successful:", formData);
      
      // Simulate API call success and navigate to Login or Dashboard
      navigate('/'); 
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
   

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
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Reset Password
            </h2>
            <p className="text-muted-foreground">
              Create a new secure password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border bg-background pl-12 pr-12 py-3 text-base outline-none focus:ring-2 transition-all
                    ${errors.password ? 'border-destructive focus:ring-destructive/50' : 'border-input focus:ring-ring'}`}
                />
                {/* Toggle Password Visibility Icon */}
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border bg-background pl-12 pr-4 py-3 text-base outline-none focus:ring-2 transition-all
                    ${errors.confirmPassword ? 'border-destructive focus:ring-destructive/50' : 'border-input focus:ring-ring'}`}
                />
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold mt-4">
              Update Password
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <a href="/" className="text-primary font-medium hover:underline">
              Log in
            </a>
          </div>

        </motion.div>
      </main>
    </div>
  );
};

export default ResetPassword;