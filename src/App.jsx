import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import  VerifyPage  from "./pages/VerifyPage";
import DashboardPage from "./pages/DashboardPage";  
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import Documentation from "./pages/Documentation";
import NotFound from "./pages/NotFound";
import VerificationFlowPage from "./pages/OtpVerification";
import AccountCreation from "./pages/AccountCreation";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import EmailOtp from "./pages/EmailOtp";
import AccountOpeningForm from "./pages/AccountOpeningForm";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/create-account" element={<AccountOpeningForm />} />
          <Route path="/verify-otp" element={<VerificationFlowPage />} />
          <Route path="/email-otp" element={<EmailOtp />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/account" element={<AccountCreation />} />
          <Route path="/reset" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
       
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;


