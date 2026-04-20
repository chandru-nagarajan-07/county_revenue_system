import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LoginPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // ✅ Empty validation
    if (!username || !password) {
      alert("Enter username & password");
      return;
    }

    try {
      const response = await fetch("https://snapsterbe.techykarthikbms.com/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();
      console.log("login response:", data);

      // ❌ login failed
      if (!response.ok) {
        alert(data.error || "Login failed");
        return;
      }

      // ✅ store user data
      sessionStorage.setItem("userData1", JSON.stringify(data));

      // ✅ role-based navigation
      const role = data?.user_role?.toLowerCase();

      if (role === "teller") {
        navigate("/dash", {
          state: { customer: data },
        });
      } else {
        navigate("/dashboard", {
          state: { customer: data },
        });
      }

    } catch (error) {
      console.error("Login error:", error);
      alert("Server connection failed");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center mt-8 justify-center p-4 overflow-auto"
    >
      <div className="w-full max-w-sm space-y-6 bg-card p-8 rounded-xl shadow-lg border border-border">
        
        {/* Title */}
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-2">
            Sign in to access your account
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">

          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Button */}
          <Button onClick={handleLogin} className="w-full">
            Sign In
          </Button>

        </div>
      </div>

      {/* Register */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default LoginPage;