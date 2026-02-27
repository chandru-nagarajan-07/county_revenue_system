import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserPlus, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';

const Register = () => {
  const navigate = useNavigate(); // Initialize navigate

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '', 
    email: '',
    userName: '',
  });

  const [errors, setErrors] = useState({});

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

    if (!formData.firstName) {
      tempErrors.firstName = "First name is required";
      isValid = false;
    }

    if (!formData.phone) {
      tempErrors.phone = "Phone number is required";
      isValid = false;
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      tempErrors.phone = "Invalid phone number format";
      isValid = false;
    }

    if (!formData.email) {
      tempErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Email format is invalid";
      isValid = false;
    }
    if (!formData.userName) {
      tempErrors.userName = "user name is required";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/sign-up/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          userName: formData.userName,
        }),
      });

      const data = await response.json(); 

      if (!response.ok) {
        // Django validation errors
        console.log("Backend errors:", data);
        alert("Registration failed");
        return;
      }

      console.log("Success:", data);

      // Navigate after success
      navigate("/verify-otp");

    } catch (error) {
      console.log('error')
      console.error("Error:", error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader />

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
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Create Account
            </h2>
            <p className="text-muted-foreground">
              Enter your details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Name Fields Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="text" 
                    name="firstName" 
                    value={formData.firstName} 
                    onChange={handleChange}
                    placeholder="John"
                    className={`w-full rounded-xl border bg-background pl-12 pr-4 py-3 text-base outline-none focus:ring-2 transition-all
                      ${errors.firstName ? 'border-destructive focus:ring-destructive/50' : 'border-input focus:ring-ring'}`}
                  />
                </div>
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Last Name</label>
                 <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-50" />
                  <input 
                    type="text" 
                    name="lastName" 
                    value={formData.lastName} 
                    onChange={handleChange} 
                    placeholder="Doe"
                    className="w-full rounded-xl border border-input bg-background pl-12 pr-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className={`w-full rounded-xl border bg-background pl-12 pr-4 py-3 text-base outline-none focus:ring-2 transition-all
                    ${errors.phone ? 'border-destructive focus:ring-destructive/50' : 'border-input focus:ring-ring'}`}
                />
              </div>
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange}
                  placeholder="john.doe@example.com"
                  className={`w-full rounded-xl border bg-background pl-12 pr-4 py-3 text-base outline-none focus:ring-2 transition-all
                    ${errors.email ? 'border-destructive focus:ring-destructive/50' : 'border-input focus:ring-ring'}`}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">User Name</label>
                 <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-50" />
                  <input 
                    type="text" 
                    name="userName" 
                    value={formData.UserName} 
                    onChange={handleChange} 
                    placeholder="Doe"
                    className="w-full rounded-xl border border-input bg-background pl-12 pr-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold mt-4">
              Create Account
            </Button>
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

export default Register;