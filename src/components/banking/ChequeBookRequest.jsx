import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Shield,
  Eye,
  ThumbsUp,
  BookOpen,
  Zap,
  Star,
  Hash,
  Building2,
  Clock,
  Mail,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import qr from '@/assets/qr.png';
import { DashboardHeader } from "@/components/banking/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// API Base URL
const API_BASE_URL = "http://127.0.0.1:8000";

/* CONSTANTS */
const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Authorization" },
];

const CHEQUE_LEAVES = [
  { value: "25", label: "25 Leaves" },
  { value: "50", label: "50 Leaves" },
  { value: "100", label: "100 Leaves" },
];

const SERIES_PREFS = [
  { value: "continue", label: "Continue from last series" },
  { value: "new", label: "New series" },
];

const DELIVERY_OPTIONS = [
  { value: "post", label: "Collect by Post" },
  { value: "branch", label: "Nearby Branch" },
];

// Branch options for Kenya
// const BRANCH_OPTIONS = [
//   { value: "kenya", label: "Kenya - Head Office", location: "Nairobi, Kenya" },
//   { value: "nairobi", label: "Nairobi - CBD Branch", location: "Nairobi, Kenya" },
//   { value: "kilimini", label: "Kilimini - Mombasa Branch", location: "Mombasa, Kenya" },
//   { value: "westlands", label: "Westlands - Nairobi", location: "Nairobi, Kenya" },
//   { value: "industrial_area", label: "Industrial Area - Nairobi", location: "Nairobi, Kenya" },
//   { value: "nyali", label: "Nyali - Mombasa", location: "Mombasa, Kenya" },
// ];

// Helper function to get currency symbol
const getCurrencySymbol = (currencyId) => {
  const currencyMap = {
    1: "KES",
    2: "USD",
    3: "EUR",
    4: "GBP",
    5: "UGX",
    6: "TZS"
  };
  return currencyMap[currencyId] || "KES";
};

export default function ChequeBookRequest({ customer: propCustomer, onBack, formFields }) {
  const navigate = useNavigate();
  const sessionUser = JSON.parse(sessionStorage.getItem("userData1") || "{}");
  const accounts = sessionUser?.account || [];
  const branches = sessionUser?.branch || [];

  /* FORMAT BRANCHES */
  const BRANCH_OPTIONS = useMemo(() => {
    return branches.map((b) => ({
      value: b.branch_id,
      label: b.branch_name,
    }));
  }, [branches]);

  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
 const serviceFee = useMemo(() => {
    return formFields?.[0]?.service_type?.service_fee || 0;
  }, [formFields]);
  /* SESSION USER */
  // const [sessionUser, setSessionUser] = useState({});
  // const [accounts, setAccounts] = useState([]);
  
  // useEffect(() => {
  //   try {
  //     const userData = sessionStorage.getItem("userData1");
      
  //     if (userData) {
  //       const parsed = JSON.parse(userData);
  //       setSessionUser(parsed);
        
  //       if (parsed.account && Array.isArray(parsed.account)) {
  //         setAccounts(parsed.account);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error parsing session user:", error);
  //     setSessionUser({});
  //     setAccounts([]);
  //   }
  // }, []);

  /* STATE */
  const [customer, setCustomer] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [requestId, setRequestId] = useState(null);

  /* FORM STATE */
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [chequeLeaves, setChequeLeaves] = useState("50");
  const [seriesPref, setSeriesPref] = useState("continue");
  const [deliveryOption, setDeliveryOption] = useState("post");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [smsNotify, setSmsNotify] = useState(true);
  const [chqReason, setChqReason] = useState("");
  const [formErrors, setFormErrors] = useState({});

  /* PROCESSING STATE */
  const [officerNotes, setOfficerNotes] = useState("");

  /* DERIVED DATA */
  const eligibleAccounts = useMemo(() => {
    if (!accounts || accounts.length === 0) return [];
    
    return accounts.filter((acc) => {
      if (!acc) return false;
      const status = acc.status || acc.STATUS || acc.account_status;
      return status === "ACTIVE" || status === "Active" || status === "active";
    });
  }, [accounts]);

  /* INIT CUSTOMER */
  useEffect(() => {
    if (propCustomer) {
      setCustomer(propCustomer);
      setContactPhone(propCustomer.phone || propCustomer.Phone || "");
      setContactEmail(propCustomer.email || propCustomer.Email || "");
      return;
    }
    
    const sessionCustomer = sessionStorage.getItem("customer");
    if (sessionCustomer) {
      try {
        const c = JSON.parse(sessionCustomer);
        setCustomer(c);
        setContactPhone(c.phone || c.Phone || "");
        setContactEmail(c.email || c.Email || "");
      } catch (error) {
        console.error("Error parsing session customer:", error);
      }
    }
  }, [propCustomer]);

  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => setStep(3), 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  /* HANDLERS */
  const validate = () => {
    const errs = {};
    if (!selectedAccount) errs.account = "Select account";
    if (!contactPhone.trim()) errs.phone = "Phone required";
    if (deliveryOption === "branch" && !selectedBranch) errs.branch = "Please select a branch";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };
  console.log("sessionUser", sessionUser);
 console.log("res", customer?.user_id || sessionUser?.user_id,
          "service fee", serviceFee,"branch", selectedBranch);
  const handleSubmit = async () => {
    if (!validate()) return;
    
    setLoading(true);
    setApiError(null);
    
    try {
      const getAccountField = (field) => {
        const fieldMappings = {
          account_number: ['account_number', 'AccountNumber'],
          id: ['id', 'ID', 'account_id'],
        };
        
        const possibleNames = fieldMappings[field] || [field];
        for (const name of possibleNames) {
          if (selectedAccount[name] !== undefined) {
            return selectedAccount[name];
          }
        }
        return null;
      };

      const payload = {
        account_number: getAccountField('account_number'),
        account_id: getAccountField('id'),
        customer_id: customer?.id || customer?.ID || customer?.customerId || sessionUser?.id,
        user_id: sessionUser?.user_id || sessionUser?.userId || sessionUser?.id,
        cheque_leaves: parseInt(chequeLeaves),
        series_preference: seriesPref,
        delivery_method: deliveryOption,
        branch: deliveryOption === "branch" ? selectedBranch : null,
        contact_phone: contactPhone,
        contact_email: contactEmail || null,
        sms_notification: smsNotify,
        reason: chqReason || null,
        status: "PENDING",
        request_date: new Date().toISOString(),
      };
      
      console.log("Submitting Cheque Book Request:", payload);

      const response = await fetch(`${API_BASE_URL}/api/cheque-book-requests/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
          user_id: customer?.user_id || sessionUser?.user_id,
          service_amount: serviceFee,
          branch: selectedBranch,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || data.error || "Request failed";
        setApiError(errorMessage);
        alert(errorMessage);
        setLoading(false);
        return;
      }

      if (data.id || data.request_id) {
        setRequestId(data.id || data.request_id);
      }

      setStep(2);
    } catch (error) {
      console.error("Error submitting cheque book request:", error);
      setApiError(error.message);
      alert("Server error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalComplete = async () => {
    setLoading(true);
    
    try {
      if (requestId) {
        await fetch(`${API_BASE_URL}/api/cheque-book-requests/${requestId}/complete/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Error completing request:", error);
    } finally {
      setLoading(false);
      alert("Cheque Book Request Submitted Successfully");
      if (onBack) onBack();
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (!customer && !sessionUser) {
    return <div className="min-h-screen flex items-center justify-center">Customer not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        customerName={customer?.fullName || customer?.FullName || sessionUser?.first_name || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => { 
          localStorage.removeItem("customer"); 
          sessionStorage.removeItem("userData1");
          navigate("/"); 
        }}
      />

      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Cheque Book Request</h1>
            <p className="text-xs text-gray-500">Step {step} of 6: {STEPS[step - 1].name}</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center w-full mt-2 px-1">
          {STEPS.map((s, index) => {
            const isCompleted = s.id < step;
            const isCurrent = s.id === step;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted ? "bg-primary border-primary text-primary-foreground" :
                  isCurrent ? "bg-accent border-accent text-accent-foreground scale-110 shadow-sm" :
                  "bg-white border-gray-200 text-muted-foreground"
                }`}>
                  {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-[10px] font-bold">{s.id}</span>}
                </div>
                {index < STEPS.length - 1 && <div className={`flex-1 h-[2px] mx-1 transition-colors duration-300 ${isCompleted ? "bg-primary" : "bg-gray-200"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <AnimatePresence mode="wait">
          {/* STEP 1: INPUT */}
          {step === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              
              {/* Customer Banner */}
              <div className="flex items-center gap-3 rounded-xl border p-4 bg-white shadow-sm">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {(customer?.fullName || customer?.FullName || sessionUser?.first_name || "C")
                    .split(" ")
                    .map((n) => n?.[0] || "")
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {customer?.fullName || customer?.FullName || sessionUser?.first_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {customer?.customerId || customer?.id || sessionUser?.user_id || sessionUser?.id}
                  </p>
                </div>
              </div>

              {/* API Error Display */}
              {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="font-medium">{apiError}</p>
                </div>
              )}

              {/* Service Header */}
              <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-accent">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Request Cheque Book</h3>
                  <p className="text-xs text-muted-foreground">Issue a new cheque book</p>
                </div>
              </div>

              {/* Account Select */}
              <div className="space-y-2">
                <Label>Select Account *</Label>
                {eligibleAccounts.length === 0 ? (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    No eligible accounts found
                  </div>
                ) : (
                  <Select
                    value={selectedAccount?.account_number || ""}
                    onValueChange={(val) => {
                      const acc = eligibleAccounts.find(a => a.account_number === val);
                      setSelectedAccount(acc);
                      setFormErrors(prev => ({...prev, account: ""}));
                    }}
                  >
                    <SelectTrigger className={formErrors.account ? "border-destructive" : ""}>
                      <SelectValue placeholder="Choose account" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleAccounts.map((acc) => {
                        const currencyId = acc.currency || 2;
                        const currency = getCurrencySymbol(currencyId);
                        const balance = acc.balance || "0.00";
                        
                        return (
                          <SelectItem key={acc.account_number} value={acc.account_number}>
                            {acc.account_number} • {currency} {Number(balance).toLocaleString()}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
                {formErrors.account && <p className="text-xs text-destructive">{formErrors.account}</p>}
              </div>

              {/* Leaves */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Number of Leaves *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {CHEQUE_LEAVES.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setChequeLeaves(opt.value)}
                      className={`rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
                        chequeLeaves === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-white hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Series Preference */}
              <div className="space-y-2">
                <Label>Series Preference</Label>
                <Select value={seriesPref} onValueChange={setSeriesPref}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERIES_PREFS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Option */}
              <div className="space-y-2">
                <Label>Delivery Method *</Label>
                <Select value={deliveryOption} onValueChange={(value) => {
                  setDeliveryOption(value);
                  if (value !== "branch") {
                    setSelectedBranch("");
                    setFormErrors(prev => ({...prev, branch: ""}));
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          {opt.value === "post" ? <Mail className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Branch Selection - Only shows when delivery method is "branch" */}
              {deliveryOption === "branch" && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <Label className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Select Branch *
                  </Label>
                  <Select 
                    value={selectedBranch} 
                    onValueChange={(value) => {
                      setSelectedBranch(value);
                      setFormErrors(prev => ({...prev, branch: ""}));
                    }}
                  >
                    <SelectTrigger className={formErrors.branch ? "border-destructive" : ""}>
                      <SelectValue placeholder="Choose a branch for collection" />
                    </SelectTrigger>
                     <SelectContent>
  {BRANCH_OPTIONS.map((branch) => (
    <SelectItem key={branch.value} value={branch.value}>
      {branch.label} • {branch.value}
    </SelectItem>
  ))}
</SelectContent>
                  </Select>
                  {formErrors.branch && (
                    <p className="text-xs text-destructive">{formErrors.branch}</p>
                  )}
                  <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 border border-blue-200 p-3 mt-2">
                    <MapPin className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-blue-800">Branch Collection Information</p>
                      <p className="text-xs text-blue-700">
                        Your cheque book will be available for pickup at the selected branch within 2-3 business days.
                        Please bring a valid ID for verification.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ETA Info */}
              <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 border p-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">Estimated Delivery Time</p>
                  <p className="text-xs text-muted-foreground">
                    {deliveryOption === "branch" 
                      ? "2-3 business days for branch collection" 
                      : "5-7 business days for postal delivery"}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input 
                    value={contactPhone} 
                    onChange={e => setContactPhone(e.target.value)} 
                    className={formErrors.phone ? "border-destructive" : ""} 
                    placeholder="Enter phone number"
                  />
                  {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    value={contactEmail} 
                    onChange={e => setContactEmail(e.target.value)} 
                    placeholder="Enter email (optional)"
                    type="email"
                  />
                </div>
              </div>

              {/* SMS Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4 bg-gray-50">
                <div>
                  <p className="text-sm font-medium">SMS Notification</p>
                  <p className="text-xs text-muted-foreground">Receive alert when ready</p>
                </div>
                <Switch checked={smsNotify} onCheckedChange={setSmsNotify} />
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>Reason / Notes</Label>
                <Textarea 
                  placeholder="Optional notes or reason for request..." 
                  value={chqReason} 
                  onChange={e => setChqReason(e.target.value)} 
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold" 
                disabled={loading || eligibleAccounts.length === 0}
              >
                {loading ? "Processing..." : "Submit Request"}
              </Button>
            </motion.div>
          )}

          {/* STEP 2: VALIDATION */}
          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">Validating Request...</h3>
            </motion.div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <Check className="h-5 w-5" /> <span className="text-sm font-medium">Validation Passed</span>
              </div>
              
              {requestId && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm">
                  Request ID: <span className="font-mono font-medium">{requestId}</span>
                </div>
              )}

              <div className="rounded-xl border bg-white p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Request Summary</h4>
                <div className="space-y-0">
                  {[
                    { l: "Account", v: selectedAccount?.account_number },
                    { l: "Leaves", v: CHEQUE_LEAVES.find(l => l.value === chequeLeaves)?.label },
                    { l: "Series", v: SERIES_PREFS.find(s => s.value === seriesPref)?.label },
                    { 
                      l: "Delivery", 
                      v: deliveryOption === "post" ? "Collect by Post" : "Nearby Branch" 
                    },
                    ...(deliveryOption === "branch" && selectedBranch ? [
                      { 
                        l: "Branch", 
                        v: BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch 
                      }
                    ] : []),
                    { l: "Contact Phone", v: contactPhone },
                    { l: "Contact Email", v: contactEmail || "-" },
                    { l: "SMS Notifications", v: smsNotify ? "Yes" : "No" },
                    ...(chqReason ? [{ l: "Notes", v: chqReason }] : []),
                  ].map((row) => (
                    <div key={row.l} className="flex justify-between py-2 border-b border-dashed last:border-0">
                      <span className="text-sm text-gray-500">{row.l}</span>
                      <span className="text-sm font-medium text-gray-800">{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={() => setStep(4)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">Proceed</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: PROCESSING */}
          {step === 4 && (
            <motion.div key="step4" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg mb-2">
                <Zap className="h-5 w-5" /> <span className="text-sm font-medium">Processing</span>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-medium">Officer Notes</Label>
                <Textarea placeholder="Optional notes..." value={officerNotes} onChange={e => setOfficerNotes(e.target.value)} />
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
                <Button onClick={() => setStep(5)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">Confirm</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: VERIFICATION */}
          {step === 5 && (
            <motion.div key="step5" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                <Eye className="h-5 w-5" /> <span className="text-sm font-medium">Customer Verification</span>
              </div>
              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Customer ID</p>
                    <p className="font-medium">{customer?.id || customer?.customerId || sessionUser?.id || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery</p>
                    <p className="font-medium">{deliveryOption === "post" ? "Post" : "Branch"}</p>
                  </div>
                  {deliveryOption === "branch" && selectedBranch && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Collection Branch</p>
                      <p className="font-medium">{BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs p-2 rounded border border-green-200 mt-2">
                  <Star className="h-3.5 w-3.5" />
                  <span>Details verified</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">Back</Button>
                <Button onClick={() => setStep(6)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">Verify</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 6: AUTHORIZATION */}
          {step === 6 && (
            
          <motion.div
  key="step6"
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  className="space-y-6 max-w-lg mx-auto text-center py-10"
>
   <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4">
                  <ThumbsUp className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">Request Complete</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Your statement request has been processed successfully.
                </p>  
                <Button 
                onClick={handleFinalComplete} 
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold" 
                disabled={loading}
              >
                {loading ? "Processing..." : "Finish"}
              </Button>
  {/* QR Image
  <div className="flex justify-center">
   
        <img src={qr} alt="AIDA" className="h-100 w-100 object-cover" />
    
  </div>

  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
    Scan this QR code to proceed further.
  </p>

  <Button
    onClick={handleFinalComplete}
    className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
    disabled={loading}
  >
    {loading ? "Processing..." : "Finish"}
  </Button> */}
</motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}