import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Shield,
  Eye,
  ThumbsUp,
  CreditCard,
  Zap,
  Star,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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
import qr from '@/assets/qr.png';
import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from "@/data/demoCustomers";

/* CONSTANTS */
const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Authorization" },
];


export default function CardIssuance({ customer: propCustomer, onBack, formFields }) {
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

  /* SESSION USER */
  // let sessionUser = {};
  // try {
  //   sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {};
  //   console.log("Session User:", sessionUser);
  // } catch {
  //   sessionUser = {};
  // }
  
  // // Get accounts directly from session
  // const accounts = sessionUser?.account || [];

  /* STATE */
  const [customer, setCustomer] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  /* FORM STATE */
  const [linkedAccount, setLinkedAccount] = useState("");
  const [cardType, setCardType] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [enableContactless, setEnableContactless] = useState(true);
  const [dailyPosLimit, setDailyPosLimit] = useState("200000");
  const [dailyAtmLimit, setDailyAtmLimit] = useState("100000");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const serviceFee = useMemo(() => {
    return formFields?.[0]?.service_type?.service_fee || 0;
  }, [formFields]);
  
  /* PROCESSING STATE */
  const [officerNotes, setOfficerNotes] = useState("");

  /* DERIVED DATA - FIXED: Use accounts directly */
  const eligibleAccounts = useMemo(() => {
    // Just return active accounts from session
    return accounts.filter(acc => acc.status === "ACTIVE");
  }, [accounts]);

  /* INIT CUSTOMER */
  useEffect(() => {
    if (propCustomer) {
      setCustomer(propCustomer);

      if (!nameOnCard) {
        setNameOnCard(propCustomer?.fullName?.toUpperCase() || "");
      }

      return;
    }

    try {
      const sessionCustomer = sessionStorage.getItem("customer");

      if (sessionCustomer) {
        const c = JSON.parse(sessionCustomer);
        setCustomer(c);

        if (!nameOnCard) {
          setNameOnCard(c?.fullName?.toUpperCase() || "");
        }

      } else if (sessionUser) {
        setCustomer(sessionUser);

        if (!nameOnCard) {
          setNameOnCard(sessionUser?.first_name?.toUpperCase() || "");
        }
      }

    } catch (error) {
      console.error("Error parsing customer:", error);
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
    if (!linkedAccount) errs.linkedAccount = "Select account";
    if (!cardType) errs.cardType = "Select card type";
    if (!nameOnCard) errs.nameOnCard = "Name required";
    if (!selectedBranch) errs.branch = "Please select a branch";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };
  
  console.log("res", customer?.user_id || sessionUser?.user_id,
          "service fee", serviceFee,
          "selected branch", selectedBranch);
          
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch(
        "https://snapsterbe.techykarthikbms.com/api/cards/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            account: linkedAccount,
            card_type: cardType,
            name_on_card: nameOnCard,
            contactless_enabled: enableContactless,
            daily_pos_limit: Number(dailyPosLimit),
            daily_atm_limit: Number(dailyAtmLimit),
            branch: selectedBranch,
            officer_notes: officerNotes,
            user_id: customer?.user_id || sessionUser?.user_id,
            service_amount: serviceFee,
          }),
        }
      );

      const data = await response.json();

      console.log("Card API Response:", data);

      if (!response.ok) {
        alert(data.message || "Card request failed");
        return;
      }

      // move to validation step
      setStep(2);

    } catch (error) {
      console.error("Card API Error:", error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };
  
  const handleFinalComplete = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    alert("Card Issuance Request Submitted Successfully");
    if (onBack) onBack();
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (!customer && !sessionUser) return <div className="min-h-screen flex items-center justify-center">Customer not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        customerName={customer?.fullName || customer?.first_name || sessionUser?.first_name || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => { localStorage.removeItem("customer"); navigate("/"); }}
      />

      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Card Issuance</h1>
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
                <div className="relative flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted ? "bg-primary border-primary text-primary-foreground" :
                    isCurrent ? "bg-accent border-accent text-accent-foreground scale-110 shadow-sm" :
                    "bg-white border-gray-200 text-muted-foreground"
                  }`}>
                    {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-[10px] font-bold">{s.id}</span>}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-1 transition-colors duration-300 ${isCompleted ? "bg-primary" : "bg-gray-200"}`} />
                )}
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
              
              <div className="flex items-center gap-3 rounded-xl border p-4 bg-white shadow-sm">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {(customer?.fullName || customer?.first_name || sessionUser?.first_name || "C")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{customer?.fullName || customer?.first_name || sessionUser?.first_name}</p>
                  <p className="text-xs text-muted-foreground">{customer?.customerId || customer?.user_id || sessionUser?.user_id}</p>
                </div>
              </div>

              {/* Account Dropdown */}
              <div className="space-y-2">
                <Label>Link Account</Label>
                <Select value={linkedAccount} onValueChange={setLinkedAccount}>
                  <SelectTrigger className={formErrors.linkedAccount ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleAccounts && eligibleAccounts.length > 0 ? (
                      eligibleAccounts.map((acc) => (
                        <SelectItem 
                          key={acc.accountNumber || acc.account_number} 
                          value={acc.accountNumber || acc.account_number}
                        >
                          {acc.accountNumber || acc.account_number} • {acc.account_type === 2 ? 'Savings Account' : 'Account'} • Balance: {acc.balance || '0.00'}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-accounts" disabled>
                        No active accounts available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formErrors.linkedAccount && <p className="text-xs text-destructive">{formErrors.linkedAccount}</p>}
              </div>

              {/* Card Type */}
              <div className="space-y-2">
                <Label>Card Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Visa Debit", "Mastercard Debit"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCardType(type)}
                      className={`border rounded-lg p-3 text-sm transition-all ${cardType === type ? "border-primary bg-primary/10" : "border-border hover:bg-gray-50"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {formErrors.cardType && <p className="text-xs text-destructive">{formErrors.cardType}</p>}
              </div>

              {/* Name on Card */}
              <div className="space-y-2">
                <Label>Name on Card</Label>
                <Input 
                  value={nameOnCard} 
                  onChange={(e) => setNameOnCard(e.target.value.toUpperCase())} 
                  className={formErrors.nameOnCard ? "border-destructive" : ""}
                />
                {formErrors.nameOnCard && <p className="text-xs text-destructive">{formErrors.nameOnCard}</p>}
              </div>

              {/* Branch Selection - Always visible */}
              <div className="space-y-2">
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
                    <SelectValue placeholder="Choose a branch for card collection" />
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
              </div>

              {/* Contactless Switch */}
              <div className="flex items-center justify-between rounded-lg border p-3 bg-gray-50">
                <Label htmlFor="contactless">Enable Contactless</Label>
                <Switch id="contactless" checked={enableContactless} onCheckedChange={setEnableContactless} />
              </div>

              {/* Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Daily POS Limit</Label>
                  <Input type="number" value={dailyPosLimit} onChange={(e) => setDailyPosLimit(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Daily ATM Limit</Label>
                  <Input type="number" value={dailyAtmLimit} onChange={(e) => setDailyAtmLimit(e.target.value)} />
                </div>
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 border border-blue-200 p-3">
                <MapPin className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-800">Card Collection Information</p>
                  <p className="text-xs text-blue-700">
                    Your card will be available for pickup at the selected branch within 5-7 business days.
                    Please bring a valid ID for verification.
                  </p>
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold" disabled={loading}>
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
              <p className="text-sm text-muted-foreground">Checking account status and eligibility</p>
            </motion.div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">Validation Passed</span>
              </div>

              <div className="rounded-xl border bg-white p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Request Summary</h4>
                <div className="space-y-0">
                  {[
                    { l: "Account", v: linkedAccount },
                    { l: "Card Type", v: cardType },
                    { l: "Name on Card", v: nameOnCard },
                    { l: "Branch", v: BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch },
                    { l: "Contactless", v: enableContactless ? "Enabled" : "Disabled" },
                    { l: "Limits", v: `POS: KES ${Number(dailyPosLimit).toLocaleString()} / ATM: KES ${Number(dailyAtmLimit).toLocaleString()}` },
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
                <Zap className="h-5 w-5" />
                <span className="text-sm font-medium">Processing Center</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Card request is being prepared for printing queue.</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
                  <span className="font-medium">Collection Branch:</span> {BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Officer Notes</Label>
                <Textarea placeholder="Optional notes..." value={officerNotes} onChange={(e) => setOfficerNotes(e.target.value)} />
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
                <Eye className="h-5 w-5" />
                <span className="text-sm font-medium">Customer Verification</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Customer Name</p>
                    <p className="font-semibold">{customer?.fullName || customer?.first_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer ID</p>
                    <p className="font-medium text-gray-700">{customer?.customerId || customer?.user_id}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Collection Branch</p>
                    <p className="font-medium text-gray-700">{BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs p-2 rounded border border-green-200 mt-2">
                  <Star className="h-3.5 w-3.5" />
                  <span>Customer ID and details verified</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">Request Change</Button>
                <Button onClick={() => setStep(6)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">Confirm & Verify</Button>
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
  {/* QR Image
  <div className="flex justify-center">
   
        <img src={qr} alt="AIDA" className="h-100 w-100 object-cover" />
    
  </div>

  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
    Scan this QR code to proceed further.
  </p> */}

  <Button
    onClick={handleFinalComplete}
    className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
    disabled={loading}
  >
    {loading ? "Processing..." : "Finish"}
  </Button>
</motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}