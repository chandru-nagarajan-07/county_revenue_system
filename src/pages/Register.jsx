// Register.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
// import { DashboardHeader } from '@/components/banking/DashboardHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    userName: '',
    branch: '',
  });

  const [errors, setErrors] = useState({});
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch('https://snapsterbe.techykarthikbms.com/api/branches/');
        const data = await response.json();
        setBranches(data);
      } catch (error) {
        console.error('Branch fetch error:', error);
      }
    };
    fetchBranches();
  }, []);

  const BRANCH_OPTIONS = branches.map((branch) => ({
    value: branch.branch_id,
    label: branch.branch_name,
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleBranchChange = (value) => {
    setFormData((prev) => ({ ...prev, branch: value }));
    if (errors.branch) setErrors((prev) => ({ ...prev, branch: null }));
  };

  const validate = () => {
    let tempErrors = {};
    let isValid = true;

    if (!formData.firstName) {
      tempErrors.firstName = 'First name is required';
      isValid = false;
    }
    if (!formData.phone) {
      tempErrors.phone = 'Phone number is required';
      isValid = false;
    }
    if (!formData.email) {
      tempErrors.email = 'Email is required';
      isValid = false;
    }
    if (!formData.userName) {
      tempErrors.userName = 'Username is required';
      isValid = false;
    }
    if (!formData.branch) {
      tempErrors.branch = 'Please select a branch';
      isValid = false;
    }
    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Email validation
    if (!formData.email || !formData.email.includes('@')) {
      alert('A valid email address is required to register.');
      navigate('/kyconboarding');
      return;
    }
    console.log('Form data ready for submission:', formData);
    // Optional: check if email exists
    try {
      const checkResponse = await fetch(
        `https://corebanking.pythonanywhere.com/customer/account_fetch/${formData.email}/`,
        { method: 'GET' }
      );
      if (!checkResponse.ok) {
        alert('No account found with this email. Please create an account.');
        navigate('/kyconboarding');
        return;
      }
    } catch (err) {
      console.error('Email check failed:', err);
      alert('Unable to verify email. Please try again.');
      navigate('/kyconboarding');
      return;
    }

    // Proceed with registration
    try {
      const response = await fetch('https://snapsterbe.techykarthikbms.com/api/sign-up/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          userName: formData.userName,
          branch: formData.branch,
        }),
      });
      const data = await response.json();
      console.log('Registration response:', data);
      if (!response.ok) {
        alert(`Registration failed: ${data.message || 'Unknown error'}`);
        return;
      }
      // Navigate to verification flow (loader + actual async steps)
      navigate('/verify-otp', { state: { email: formData.email, phone: formData.phone } });
    } catch (error) {
      console.error('Registration error:', error);
      alert('Something went wrong during registration.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* <DashboardHeader /> */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-card rounded-xl shadow-card border p-8"
        >
          <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />
            <input
              type="text"
              name="userName"
              placeholder="Username"
              value={formData.userName}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />
            <Select value={formData.branch} onValueChange={handleBranchChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                {BRANCH_OPTIONS.map((branch) => (
                  <SelectItem key={branch.value} value={branch.value}>
                    {branch.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.branch && <p className="text-red-500 text-sm">{errors.branch}</p>}
            <Button type="submit" className="w-full">
              Create Account
            </Button>
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


export default Register;