import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { DashboardHeader } from "@/components/banking/DashboardHeader";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ArrowLeft,
  Check,
  AlertCircle,
  Shield,
  Eye,
  ThumbsUp,
  Receipt,
  Zap,
  Star,
} from "lucide-react";

import { inferSegment, SEGMENT_LABELS, computeCharges } from "@/data/serviceCharges";

/* STEPS */
const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Authorization" },
];

export const CashWithdrawalWorkflow = ({
  customer: propCustomer,
  onBack,
  onComplete,
}) => {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [customer, setCustomer] = useState(null);

  /* WORKFLOW STATE */
  const [step, setStep] = useState(1);

  /* FORM STATE */
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");
  const [formErrors, setFormErrors] = useState({});
  
  /* PROCESSING STATE */
  const [officerNotes, setOfficerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* SESSION USER */
  const sessionUser = JSON.parse(sessionStorage.getItem("userData1") || "{}");
  const accounts = sessionUser?.account || [];

  /* INIT CUSTOMER */
  useEffect(() => {
    if (propCustomer) {
      setCustomer(propCustomer);
      return;
    }
    const sessionCustomer = sessionStorage.getItem("customer");
    if (sessionCustomer) setCustomer(JSON.parse(sessionCustomer));
  }, [propCustomer]);

  /* DERIVED DATA */
  const eligibleAccounts = useMemo(() => {
    return accounts.filter((acc) => acc?.status === "ACTIVE");
  }, [accounts]);

  const segment = useMemo(() => {
    const safeCustomer = {
      ...customer,
      accounts: accounts,
    };
    return inferSegment(safeCustomer);
  }, [customer, accounts]);

  const withdrawalAmount = Number(amount) || 0;

  // Service Charges
  const charges = useMemo(() => {
    return computeCharges('cash-withdrawal', segment, withdrawalAmount);
  }, [segment, withdrawalAmount]);

  /* HANDLERS */
  const validateForm = () => {
    const errs = {};
    if (!selectedAccount) errs.account = "Select an account";
    if (!amount || withdrawalAmount <= 0) errs.amount = "Enter valid amount";
    
    // Check sufficient funds (basic client-side check)
    if (selectedAccount && withdrawalAmount > Number(selectedAccount.balance)) {
      errs.amount = "Insufficient funds";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStepOneSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/cash-withdrawals/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_number: selectedAccount.account_number,
          amount: withdrawalAmount,
          reference,
          narration,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Validation failed");
        setIsSubmitting(false);
        return;
      }
      setStep(2); // Go to Validation
    } catch (error) {
      console.error(error);
      alert("Server error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-advance Step 2 -> 3
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => setStep(3), 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleFinish = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSubmitting(false);
    alert("Withdrawal Authorized & Completed!");
    if (onComplete) onComplete();
    else onBack();
  };

  /* ANIMATION VARIANTS */
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (!customer && !sessionUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Customer not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        customerName={customer?.fullName || sessionUser?.first_name || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => {
          localStorage.removeItem("customer");
          navigate("/");
        }}
      />

      {/* Sticky Header with Back Button & Stepper */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
              Cash Withdrawal
            </h1>
            <p className="text-xs text-gray-500">
              Step {step} of 6: {STEPS[step - 1].name}
            </p>
          </div>
        </div>

        {/* ========== ROUND STEPPER UI ========== */}
        <div className="flex items-center w-full mt-2 px-1">
          {STEPS.map((s, index) => {
            const isCompleted = s.id < step;
            const isCurrent = s.id === step;

            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-accent border-accent text-accent-foreground scale-110 shadow-sm"
                        : "bg-white border-gray-200 text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-[10px] font-bold">{s.id}</span>
                    )}
                  </div>
                </div>

                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-1 transition-colors duration-300 ${
                      isCompleted ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        {/* ========== END ROUND STEPPER UI ========== */}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <AnimatePresence mode="wait">
          
          {/* ========== STEP 1: INPUT ========== */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 max-w-lg mx-auto"
            >
              {/* Customer Banner */}
              <div className="flex items-center gap-3 rounded-xl border p-4 bg-white shadow-sm">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {(customer?.fullName || sessionUser?.first_name || "C")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{customer?.fullName || sessionUser?.first_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer?.customerId || sessionUser?.user_id} • {SEGMENT_LABELS[segment]}
                  </p>
                </div>
              </div>

              {/* Withdrawal Form */}
              <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
                
                <div className="space-y-2">
                  <Label>Debit Account</Label>
                  <Select
                    value={selectedAccount?.account_number || ""}
                    onValueChange={(val) => {
                      const acc = eligibleAccounts.find((a) => a.account_number === val);
                      setSelectedAccount(acc);
                    }}
                  >
                    <SelectTrigger className={formErrors.account ? "border-destructive" : ""}>
                      <SelectValue placeholder="Choose account" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleAccounts.map((acc) => (
                        <SelectItem key={acc.account_number} value={acc.account_number}>
                          {acc.account_number} • {acc.currency || "KES"} {acc.balance?.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.account && <p className="text-xs text-destructive">{formErrors.account}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Amount (KES)</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={formErrors.amount ? "border-destructive" : ""}
                  />
                  {formErrors.amount && <p className="text-xs text-destructive">{formErrors.amount}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Optional reference"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Narration</Label>
                  <Input
                    value={narration}
                    onChange={(e) => setNarration(e.target.value)}
                    placeholder="Optional narration"
                  />
                </div>
              </div>

              <Button 
                onClick={handleStepOneSubmit} 
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Validate Transaction"}
              </Button>
            </motion.div>
          )}

          {/* ========== STEP 2: VALIDATION ========== */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">Validating Transaction...</h3>
              <p className="text-sm text-muted-foreground">Checking balances and limits</p>
            </motion.div>
          )}

          {/* ========== STEP 3: REVIEW ========== */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 max-w-lg mx-auto"
            >
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">Validation Passed</span>
              </div>

              <div className="rounded-xl border bg-white p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transaction Summary</h4>
                
                <div className="space-y-0">
                  {[
                    { l: "Customer Name", v: customer?.first_name || sessionUser?.first_name || "N/A" },
                    { l: "Customer ID", v: customer?.user_id || sessionUser?.user_id || "N/A" },
                    { l: "Transaction Time", v: new Date().toLocaleString() },
                    { l: "Debit Account", v: selectedAccount?.account_number },
                    { l: "Amount", v: `KES ${withdrawalAmount.toLocaleString()}` },
                    { l: "Reference", v: reference || "-" },
                    { l: "Narration", v: narration || "-" },
                  ].map((row) => (
                    <div key={row.l} className="flex justify-between py-2 border-b border-dashed last:border-0">
                      <span className="text-sm text-gray-500">{row.l}</span>
                      <span className="text-sm font-medium text-gray-800">{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charges Section */}
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5" /> Service Charges
                  </h4>
                  <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full font-medium text-gray-600">
                    {SEGMENT_LABELS[segment]}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Withdrawal Fee</span>
                    <span className="font-medium">KES {charges.serviceFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Excise Duty</span>
                    <span className="font-medium">KES {charges.exciseDuty.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <span className="font-semibold">Total Debit</span>
                    <span className="font-bold text-primary">KES {(withdrawalAmount + charges.totalCharges).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">
                  Proceed
                </Button>
              </div>
            </motion.div>
          )}

          {/* ========== STEP 4: PROCESSING (Officer Review) ========== */}
          {step === 4 && (
            <motion.div
              key="step4"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 max-w-lg mx-auto"
            >
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg mb-2">
                <Zap className="h-5 w-5" />
                <span className="text-sm font-medium">Officer Review</span>
              </div>
   <div className="space-y-0">
                  {[
                    { l: "Customer Name", v: customer?.first_name || sessionUser?.first_name || "N/A" },
                    { l: "Customer ID", v: customer?.user_id || sessionUser?.user_id || "N/A" },
                    { l: "Transaction Time", v: new Date().toLocaleString() },
                    { l: "Debit Account", v: selectedAccount?.account_number },
                    { l: "Amount", v: `KES ${withdrawalAmount.toLocaleString()}` },
                    { l: "Reference", v: reference || "-" },
                    { l: "Narration", v: narration || "-" },
                  ].map((row) => (
                    <div key={row.l} className="flex justify-between py-2 border-b border-dashed last:border-0">
                      <span className="text-sm text-gray-500">{row.l}</span>
                      <span className="text-sm font-medium text-gray-800">{row.v}</span>
                    </div>
                  ))}
                </div>
              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase">Requested</p>
                    <p className="font-bold">KES {withdrawalAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-[10px] text-red-600 uppercase font-semibold">Total Debit</p>
                    <p className="font-bold text-red-700">KES {(withdrawalAmount + charges.totalCharges).toLocaleString()}</p>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account Balance</span>
                    <span className="font-medium">KES {Number(selectedAccount?.balance).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Officer Notes</Label>
                <Textarea 
                  placeholder="Add notes regarding the withdrawal verification..."
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(5)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">
                  Confirm
                </Button>
              </div>
            </motion.div>
          )}

          {/* ========== STEP 5: VERIFICATION ========== */}
          {step === 5 && (
            <motion.div
              key="step5"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 max-w-lg mx-auto"
            >
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                <Eye className="h-5 w-5" />
                <span className="text-sm font-medium">Customer Verification</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Final Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Account</p>
                    <p className="font-semibold">{selectedAccount?.account_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="font-semibold">KES {withdrawalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Debit</p>
                    <p className="font-bold text-red-600">KES {(withdrawalAmount + charges.totalCharges).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reference</p>
                    <p className="font-semibold">{reference || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                  Request Change
                </Button>
                <Button onClick={() => setStep(6)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">
                  Confirm & Verify
                </Button>
              </div>
            </motion.div>
          )}

          {/* ========== STEP 6: AUTHORIZATION ========== */}
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
              
              <h3 className="text-xl font-semibold">Awaiting Authorization</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                This transaction requires supervisor approval to be completed.
              </p>

              <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-6 space-y-4 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">WTH-{Date.now().toString().slice(-8)}</span>
                </div>
                
                <div className="flex items-center gap-2 rounded bg-green-100 p-3 text-green-900 text-xs">
                  <Check className="h-4 w-4" />
                  <span>Customer verification complete</span>
                </div>
              </div>

              <Button 
                onClick={handleFinish} 
                disabled={isSubmitting}
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
              >
                {isSubmitting ? "Authorizing..." : "Authorize Transaction"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};