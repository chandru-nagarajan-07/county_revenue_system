import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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
  CreditCard,
  MapPin,
} from "lucide-react";

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
import qr from '@/assets/qr.png';
/* CONSTANTS */
const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Authorization" },
];

const BILLERS = [
  { id: "electricity", name: "Kenya Power", icon: Zap },
  { id: "water", name: "Nairobi Water", icon: Receipt },
  { id: "tv", name: "DSTV/GOtv", icon: CreditCard },
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

// defining the component with 'export const' ensures it is a Named Export immediately
export const BillPaymentInput = ({ customer: propCustomer, onBack, onComplete, formFields }) => {
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
  // const sessionUser = JSON.parse(sessionStorage.getItem("userData1") || "{}");
  // const accounts = sessionUser?.account || [];

  /* STATE */
  const [customer, setCustomer] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  /* FORM STATE */
  const [selectedBiller, setSelectedBiller] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const serviceFee = useMemo(() => {
    return formFields?.[0]?.service_type?.service_fee || 0;
  }, [formFields]);
  
  /* PROCESSING STATE */
  const [officerNotes, setOfficerNotes] = useState("");

  /* DERIVED DATA */
  const eligibleAccounts = useMemo(() => {
    return accounts.filter((acc) => acc?.status === "ACTIVE");
  }, [accounts]);

  /* INIT CUSTOMER */
  useEffect(() => {
    if (propCustomer) {
      setCustomer(propCustomer);
      return;
    }
    const sessionCustomer = sessionStorage.getItem("customer");
    if (sessionCustomer) setCustomer(JSON.parse(sessionCustomer));
  }, [propCustomer]);

  // Auto-advance Step 2 -> 3
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => setStep(3), 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  /* HANDLERS */
  const validate = () => {
    const errs = {};
    if (!selectedBiller) errs.biller = "Select a biller";
    if (!selectedAccount) errs.account = "Select payment account";
    if (!accountNumber) errs.accNum = "Enter account number";
    if (!selectedBranch) errs.branch = "Please select a branch";
    const num = Number(amount);
    if (isNaN(num) || num <= 0) errs.amount = "Enter valid amount";
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
        "http://127.0.0.1:8000/api/bill-payments/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: customer?.user_id || sessionUser?.user_id,
            service_amount: serviceFee,
            biller: selectedBiller?.id,
            biller_name: selectedBiller?.name,
            biller_account_number: accountNumber,
            amount: Number(amount),
            source_account: selectedAccount?.account_number,
            currency: selectedAccount?.currency || "KES",
            branch: selectedBranch,
            officer_notes: officerNotes,
          }),
        }
      );

      const data = await response.json();

      console.log("Bill Payment API Response:", data);

      if (!response.ok) {
        alert(data.message || "Bill payment failed");
        setLoading(false);
        return;
      }

      // go to validation step
      setStep(2);

    } catch (error) {
      console.error("Bill payment error:", error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalComplete = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    alert("Bill Payment service requested successfully!");
    if (onComplete) onComplete();
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

      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
              Bill Payment
            </h1>
            <p className="text-xs text-gray-500">
              Step {step} of 6: {STEPS[step - 1].name}
            </p>
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
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-accent border-accent text-accent-foreground scale-110 shadow-sm"
                        : "bg-white border-gray-200 text-muted-foreground"
                    }`}
                  >
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
                    {customer?.user_id || sessionUser?.user_id}
                  </p>
                </div>
              </div>

              {/* Biller Selection */}
              <div className="space-y-2">
                <Label>Select Biller *</Label>
                <Select
                  value={selectedBiller?.id || ""}
                  onValueChange={(val) => setSelectedBiller(BILLERS.find((b) => b.id === val) || null)}
                >
                  <SelectTrigger className={formErrors.biller ? "border-destructive" : ""}>
                    <SelectValue placeholder="Choose Biller" />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLERS.map((biller) => (
                      <SelectItem key={biller.id} value={biller.id}>
                        {biller.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.biller && <p className="text-xs text-destructive">{formErrors.biller}</p>}
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <Label>Account Number *</Label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 123456789"
                  className={formErrors.accNum ? "border-destructive" : ""}
                />
                {formErrors.accNum && <p className="text-xs text-destructive">{formErrors.accNum}</p>}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={formErrors.amount ? "border-destructive" : ""}
                />
                {formErrors.amount && <p className="text-xs text-destructive">{formErrors.amount}</p>}
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
                    <SelectValue placeholder="Choose a branch for this payment" />
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

              {/* Info Box */}
              <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 border border-blue-200 p-3">
                <MapPin className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-800">Payment Branch Information</p>
                  <p className="text-xs text-blue-700">
                    This bill payment will be processed under the selected branch. 
                    The branch will be recorded for audit and reconciliation purposes.
                  </p>
                </div>
              </div>

              {/* Source Account */}
              <div className="space-y-2">
                <Label>Pay From *</Label>
                <Select
                  value={selectedAccount?.account_number || ""}
                  onValueChange={(val) => {
                    const acc = eligibleAccounts.find((a) => a.account_number === val);
                    setSelectedAccount(acc);
                  }}
                >
                  <SelectTrigger className={formErrors.account ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select Account" />
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

              <Button
                onClick={handleSubmit}
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
                disabled={loading}
              >
                {loading ? "Processing..." : "Validate Payment"}
              </Button>
            </motion.div>
          )}

          {/* STEP 2: VALIDATION */}
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
              <h3 className="font-semibold text-lg">Validating Details...</h3>
              <p className="text-sm text-muted-foreground">Verifying biller account</p>
            </motion.div>
          )}

          {/* STEP 3: REVIEW */}
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
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Summary</h4>
                <div className="space-y-0">
                  {[
                    { l: "Biller", v: selectedBiller?.name },
                    { l: "Account No", v: accountNumber },
                    { l: "Amount", v: `KES ${Number(amount).toLocaleString()}` },
                    { l: "Paid From", v: selectedAccount?.account_number },
                    { l: "Branch", v: BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch },
                  ].map((row) => (
                    <div key={row.l} className="flex justify-between py-2 border-b border-dashed last:border-0">
                      <span className="text-sm text-gray-500">{row.l}</span>
                      <span className="text-sm font-medium text-gray-800">{row.v}</span>
                    </div>
                  ))}
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

          {/* STEP 4: PROCESSING */}
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
                <span className="text-sm font-medium">Processing Payment</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirm Details</h4>
                <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Payment is being routed to {selectedBiller?.name}.</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
                  <span className="font-medium">Branch:</span> {BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Notes</Label>
                <Textarea
                  placeholder="Optional notes..."
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

          {/* STEP 5: VERIFICATION */}
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
                <span className="text-sm font-medium">Verification</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Customer Name</p>
                    <p className="font-semibold">{customer?.fullName || sessionUser?.first_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer ID</p>
                    <p className="font-medium text-gray-700">{customer?.user_id || sessionUser?.user_id}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Branch</p>
                    <p className="font-medium text-gray-700">{BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs p-2 rounded border border-green-200 mt-2">
                  <Star className="h-3.5 w-3.5" />
                  <span>Payment verified successfully</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                  Request Change
                </Button>
                <Button onClick={() => setStep(6)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">
                  Confirm
                </Button>
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
  {/* QR Image */}
  {/* <div className="flex justify-center">
   
        <img src={qr} alt="AIDA" className="h-100 w-100 object-cover" />
    
  </div>

  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
    Scan this QR code to proceed further.
  </p> */}
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
    {loading ? "Processing..." : "Add to Cart"}
  </Button>
</motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};