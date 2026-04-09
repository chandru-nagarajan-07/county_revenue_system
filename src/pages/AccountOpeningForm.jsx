import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserPlus, Phone, Landmark, MapPin, Briefcase, IdCard, Check, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';

const ThemeInput = React.memo(({ label, name, type = 'text', icon: Icon, placeholder, value, onChange, error, required = true }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-foreground">{label}{required && ' *'}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-background py-3 text-base outline-none focus:ring-2 transition-all
          ${Icon ? 'pl-12' : 'px-4'} pr-4
          ${error ? 'border-destructive focus:ring-destructive/50' : 'border-input focus:ring-ring'}`}
      />
    </div>
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
));

const ThemeSelect = React.memo(({ label, name, options, icon: Icon, value, onChange, error }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-foreground">{label} *</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />}
      <select
        name={name}
        value={value}
        onChange={onChange}
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
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
));

const AccountOpeningForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(''); // NEW: show server errors

  const [formData, setFormData] = useState({
    userName: '',
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
    city: '',
    country: '',
    accountType: 'Savings',
    currency: 'USD',
    occupation: '',
    nationalId: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    setServerError(''); // clear server error when user types
  };

  const validate = () => {
    let tempErrors = {};

    const trimmedUsername = formData.userName?.trim() || "";
    if (!trimmedUsername) {
      tempErrors.userName = "Username is required";
    } else if (trimmedUsername.length < 3) {
      tempErrors.userName = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      tempErrors.userName = "Only letters, numbers, and underscores allowed";
    }

    if (!formData.firstName) tempErrors.firstName = "Required";
    if (!formData.lastName) tempErrors.lastName = "Required";
    if (!formData.dob) tempErrors.dob = "Required";
    if (!formData.phone) tempErrors.phone = "Required";
    else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) tempErrors.phone = "Invalid phone";
    if (!formData.email) tempErrors.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) tempErrors.email = "Invalid email";
    if (!formData.city) tempErrors.city = "Required";
    if (!formData.occupation) tempErrors.occupation = "Required";
    if (!formData.nationalId) tempErrors.nationalId = "Required";
    if (!formData.password) tempErrors.password = "Required";
    else if (formData.password.length < 6) tempErrors.password = "Min 6 characters";
    if (formData.password !== formData.confirmPassword) tempErrors.confirmPassword = "Passwords do not match";
    if (!formData.termsAccepted) tempErrors.termsAccepted = "You must accept the terms";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // 1. Validate local form
    if (!validate()) {
      alert("Please fix the errors in the form");
      return;
    }

    // 2. Ensure username is a non-empty string
    let safeUsername = formData.userName?.trim();
    if (!safeUsername) {
      setErrors(prev => ({ ...prev, userName: "Username cannot be empty" }));
      alert("Username is required");
      return;
    }
  const email = formData.email.trim();

    setIsSubmitting(true);

    // 3. Build payload – double-check types
    const payload = {
      userName: safeUsername,
      email: formData.email.trim(),
      password: formData.password,
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      phone_number: formData.phone.trim(),
      date_of_birth: formData.dob,
      gender: formData.gender,
      city: formData.city.trim(),
      country: formData.country.trim(),
      account_type: formData.accountType,
      currency: formData.currency,
      occupation: formData.occupation.trim(),
      national_id: formData.nationalId.trim(),
    };

    // 🔍 VERIFY what is being sent
    console.log("📤 FINAL PAYLOAD:", JSON.stringify(payload, null, 2));
    console.log("Username type:", typeof payload.userName, "value:", payload.userName);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/sign-up/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("📥 Response status:", response.status, data);

      if (!response.ok) {
        // Handle backend errors – DO NOT NAVIGATE
        const fieldLabels = {
          userName: 'Username',
          email: 'Email',
          password: 'Password',
          first_name: 'First Name',
          last_name: 'Last Name',
          phone_number: 'Phone Number',
          date_of_birth: 'Date of Birth',
          gender: 'Gender',
          city: 'City',
          country: 'Country',
          account_type: 'Account Type',
          currency: 'Currency',
          occupation: 'Occupation',
          national_id: 'National ID',
        };
 console.log('Email for OTP step:', email);
        let errorMsg = "Registration failed:\n";
        let hasErrors = false;

        for (const [field, msgs] of Object.entries(data)) {
          if (Array.isArray(msgs) && msgs.length) {
            const label = fieldLabels[field] || field;
            errorMsg += `\n• ${label}: ${msgs.join(", ")}`;
            hasErrors = true;
          }
        }

        if (!hasErrors) {
          errorMsg += `\nServer error: ${JSON.stringify(data)}`;
        }

        // Show error in UI and alert
        setServerError(errorMsg);
        alert(errorMsg);
        return; // ✅ STOP – do NOT navigate
      }

      // Success: clear errors and navigate
      setServerError('');
      console.log("✅ Account created, navigating to /verify-otp");
      navigate('/verify-otp',{
      
        state: { email: email }});

    } catch (error) {
      console.error("Network error:", error);
      const networkError = "Cannot connect to server. Please make sure your backend is running at http://127.0.0.1:8000";
      setServerError(networkError);
      alert(networkError);
      // ✅ Do NOT navigate
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground">Open New Account</h2>
            <p className="text-muted-foreground">Complete your profile to get started</p>
          </div>

          {/* Display server error prominently */}
          {serverError && (
            <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-3 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4"/> Personal Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ThemeInput 
                  label="Username" 
                  name="userName" 
                  icon={AtSign} 
                  placeholder="johndoe_123"
                  value={formData.userName} 
                  onChange={handleChange} 
                  error={errors.userName} 
                />
                <ThemeInput label="First Name" name="firstName" icon={User} placeholder="John"
                  value={formData.firstName} onChange={handleChange} error={errors.firstName} />
                <ThemeInput label="Last Name" name="lastName" icon={User} placeholder="Doe"
                  value={formData.lastName} onChange={handleChange} error={errors.lastName} />
                <ThemeInput label="Date of Birth" name="dob" type="date" icon={User}
                  value={formData.dob} onChange={handleChange} error={errors.dob} />
                <ThemeSelect label="Gender" name="gender" icon={User} options={['Male', 'Female', 'Other', 'Prefer not to say']}
                  value={formData.gender} onChange={handleChange} error={errors.gender} />
              </div>
            </div>

            {/* Contact & Location */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4"/> Contact & Location
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ThemeInput label="Phone Number" name="phone" type="tel" icon={Phone} placeholder="+1 234..."
                  value={formData.phone} onChange={handleChange} error={errors.phone} />
                <ThemeInput label="Email Address" name="email" type="email" icon={Mail} placeholder="john@example.com"
                  value={formData.email} onChange={handleChange} error={errors.email} />
                <ThemeInput label="City" name="city" icon={MapPin} placeholder="New York"
                  value={formData.city} onChange={handleChange} error={errors.city} />
                <ThemeInput label="Country" name="country" icon={MapPin} placeholder="USA"
                  value={formData.country} onChange={handleChange} error={errors.country} />
              </div>
            </div>

            {/* Account & Finance */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Landmark className="h-4 w-4"/> Account & Finance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ThemeSelect label="Account Type" name="accountType" icon={Landmark} options={['Savings', 'Current', 'Fixed Deposit']}
                  value={formData.accountType} onChange={handleChange} error={errors.accountType} />
                <ThemeSelect label="Currency" name="currency" icon={Landmark} options={['USD', 'EUR', 'GBP', 'INR', 'AED']}
                  value={formData.currency} onChange={handleChange} error={errors.currency} />
                <ThemeInput label="Occupation" name="occupation" icon={Briefcase} placeholder="Engineer"
                  value={formData.occupation} onChange={handleChange} error={errors.occupation} />
                <ThemeInput label="National ID / SSN" name="nationalId" icon={IdCard} placeholder="ID Number"
                  value={formData.nationalId} onChange={handleChange} error={errors.nationalId} />
              </div>
            </div>

            {/* Security */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Lock className="h-4 w-4"/> Security
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ThemeInput label="Password" name="password" type="password" icon={Lock} placeholder="Min 6 characters"
                  value={formData.password} onChange={handleChange} error={errors.password} />
                <ThemeInput label="Confirm Password" name="confirmPassword" type="password" icon={Lock} placeholder="********"
                  value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
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

              <Button type="submit" className="w-full h-12 text-base font-semibold mt-2" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/" className="text-primary font-medium hover:underline">Log in</a>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AccountOpeningForm;