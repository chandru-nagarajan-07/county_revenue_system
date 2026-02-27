import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserPlus, Phone, Landmark, MapPin, Briefcase, IdCard, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';

const AccountOpeningForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Personal
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    // Contact
    phone: '',
    email: '',
    city: '',
    country: '',
    // Account & Finance
    accountType: 'Savings',
    currency: 'USD',
    occupation: '',
    // KYC
    nationalId: '',
    // Security
    password: '',
    confirmPassword: '',
    // Declaration
    termsAccepted: false
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validate = () => {
    let tempErrors = {};
    
    // Personal
    if (!formData.firstName) tempErrors.firstName = "Required";
    if (!formData.lastName) tempErrors.lastName = "Required";
    if (!formData.dob) tempErrors.dob = "Required";

    // Contact
    if (!formData.phone) tempErrors.phone = "Required";
    else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) tempErrors.phone = "Invalid phone";
    if (!formData.email) tempErrors.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) tempErrors.email = "Invalid email";
    
    // Location
    if (!formData.city) tempErrors.city = "Required";

    // Finance & KYC
    if (!formData.occupation) tempErrors.occupation = "Required";
    if (!formData.nationalId) tempErrors.nationalId = "Required";

    // Security
    if (!formData.password) tempErrors.password = "Required";
    else if (formData.password.length < 6) tempErrors.password = "Min 6 characters";
    if (formData.password !== formData.confirmPassword) tempErrors.confirmPassword = "Passwords do not match";
    
    // Terms
    if (!formData.termsAccepted) tempErrors.termsAccepted = "You must accept the terms";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log("Account Opening Request:", formData);
      navigate('/verify-otp');
    }
  };

  // --- Reusable Input Component ---
  const ThemeInput = ({ label, name, type = 'text', icon: Icon, placeholder, required = true }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}{required && ' *'}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />}
        <input 
          type={type} 
          name={name} 
          value={formData[name]} 
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full rounded-xl border bg-background py-3 text-base outline-none focus:ring-2 transition-all
            ${Icon ? 'pl-12' : 'px-4'} pr-4
            ${errors[name] ? 'border-destructive focus:ring-destructive/50' : 'border-input focus:ring-ring'}`}
        />
      </div>
      {errors[name] && <p className="text-sm text-destructive">{errors[name]}</p>}
    </div>
  );

  const ThemeSelect = ({ label, name, options, icon: Icon }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label} *</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />}
        <select 
          name={name} 
          value={formData[name]} 
          onChange={handleChange}
          className={`w-full rounded-xl border border-input bg-background py-3 text-base outline-none focus:ring-2 focus:ring-ring appearance-none transition-all
            ${Icon ? 'pl-12' : 'px-4'} pr-8`}
        >
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl bg-card rounded-xl shadow-card border border-border p-8 sm:p-10 space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Open New Account
            </h2>
            <p className="text-muted-foreground">
              Complete your profile to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4"/> Personal Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ThemeInput label="First Name" name="firstName" icon={User} placeholder="John" />
                <ThemeInput label="Last Name" name="lastName" icon={User} placeholder="Doe" />
                <ThemeInput label="Date of Birth" name="dob" type="date" icon={User} />
                <ThemeSelect label="Gender" name="gender" icon={User} options={['Male', 'Female', 'Other', 'Prefer not to say']} />
              </div>
            </div>

            {/* Section 2: Contact & Location */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4"/> Contact & Location
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ThemeInput label="Phone Number" name="phone" type="tel" icon={Phone} placeholder="+1 234..." />
                <ThemeInput label="Email Address" name="email" type="email" icon={Mail} placeholder="john@ex.com" />
                <ThemeInput label="City" name="city" icon={MapPin} placeholder="New York" />
                <ThemeInput label="Country" name="country" icon={MapPin} placeholder="USA" />
              </div>
            </div>

            {/* Section 3: Account & Finance */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Landmark className="h-4 w-4"/> Account & Finance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ThemeSelect label="Account Type" name="accountType" icon={Landmark} options={['Savings', 'Current', 'Fixed Deposit']} />
                <ThemeSelect label="Currency" name="currency" icon={Landmark} options={['USD', 'EUR', 'GBP', 'INR', 'AED']} />
                <ThemeInput label="Occupation" name="occupation" icon={Briefcase} placeholder="Engineer" />
                <ThemeInput label="National ID / SSN" name="nationalId" icon={IdCard} placeholder="ID Number" />
              </div>
            </div>

            {/* Section 4: Security */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Lock className="h-4 w-4"/> Security
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ThemeInput label="Password" name="password" type="password" icon={Lock} placeholder="Min 6 characters" />
                <ThemeInput label="Confirm Password" name="confirmPassword" type="password" icon={Lock} placeholder="********" />
              </div>
            </div>

            {/* Terms & Submit */}
            <div className="space-y-4 pt-4 border-t border-border">
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  name="termsAccepted" 
                  checked={formData.termsAccepted} 
                  onChange={handleChange} 
                  className="sr-only peer" 
                />
                <div className="w-5 h-5 border-2 border-input rounded-md peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center mt-0.5">
                  <Check className="h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100" />
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  I confirm that the information provided is accurate and accept the <a href="#" className="text-primary hover:underline">Terms of Service</a>.
                </span>
              </label>
              {errors.termsAccepted && <p className="text-sm text-destructive pl-8">{errors.termsAccepted}</p>}

              <Button type="submit" className="w-full h-12 text-base font-semibold mt-2">
                Submit Application
              </Button>
            </div>

          </form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/" className="text-primary font-medium hover:underline">
              Log in
            </a>
          </div>

        </motion.div>
      </main>
    </div>
  );
};

export default AccountOpeningForm;
