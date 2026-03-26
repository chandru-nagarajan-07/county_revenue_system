import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, UserPlus, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  // Fetch Branch API
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/branches/");
        const data = await response.json();
        console.log("branches:", data);
        setBranches(data);
      } catch (error) {
        console.error("Branch fetch error:", error);
      }
    };

    fetchBranches();
  }, []);

  // Branch Options
  const BRANCH_OPTIONS = branches.map((branch) => ({
    value: branch.branch_id,
    label: branch.branch_name,
    location: branch.location,
  }));

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

  const handleBranchChange = (value) => {
    setFormData({
      ...formData,
      branch: value
    });

    if (errors.branch) {
      setErrors({ ...errors, branch: null });
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
    }

    if (!formData.email) {
      tempErrors.email = "Email is required";
      isValid = false;
    }

    if (!formData.userName) {
      tempErrors.userName = "User name is required";
      isValid = false;
    }

    if (!formData.branch) {
      tempErrors.branch = "Please select branch";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/sign-up/",
        {
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
            branch: formData.branch,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert("Registration Failed");
        return;
      }

      navigate("/verify-otp", {
        state: { email: formData.email }
      });

    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader />

      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-card rounded-xl shadow-card border p-8"
        >

          <h2 className="text-2xl font-bold text-center mb-6">
            Create Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* First Name */}
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />

            {/* Last Name */}
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />

            {/* Phone */}
            <input
              type="text"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />

            {/* Username */}
            <input
              type="text"
              name="userName"
              placeholder="Username"
              value={formData.userName}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
            />

            {/* Branch Dropdown */}
            <Select
              value={formData.branch}
              onValueChange={handleBranchChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>

              <SelectContent>
                {BRANCH_OPTIONS.map((branch) => (
                  <SelectItem
                    key={branch.value}
                    value={branch.value}
                  >
                    {branch.label}
                  </SelectItem>
                ))}
              </SelectContent>

            </Select>

            <Button type="submit" className="w-full">
              Create Account
            </Button>

          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default Register;