import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Shield,
  Eye,
  ThumbsUp,
  Calendar,
  Star,
  Zap,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* CONSTANTS */
const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Authorization" },
];

const FREQUENCY_OPTIONS = [
  { value: "Weekly", label: "Weekly" },
  { value: "BiWeekly", label: "Bi-Weekly" },
  { value: "Monthly", label: "Monthly" },
  { value: "Quarterly", label: "Quarterly" },
  { value: "Annually", label: "Annually" },
];

// Branch options for Kenya
const BRANCH_OPTIONS = [
  { value: "kenya", label: "Kenya - Head Office", location: "Nairobi, Kenya" },
  { value: "nairobi", label: "Nairobi - CBD Branch", location: "Nairobi, Kenya" },
  { value: "kilimini", label: "Kilimini - Mombasa Branch", location: "Mombasa, Kenya" },
  { value: "westlands", label: "Westlands - Nairobi", location: "Nairobi, Kenya" },
  { value: "industrial_area", label: "Industrial Area - Nairobi", location: "Nairobi, Kenya" },
  { value: "nyali", label: "Nyali - Mombasa", location: "Mombasa, Kenya" },
];

export default function StandingOrderWorkflow({ customer: propCustomer, onBack, onComplete, formFields }) {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  /* SESSION USER */
  let sessionUser = {};
  try {
    sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {};
  } catch {
    sessionUser = {};
  }
  const accounts = sessionUser?.account || [];

  /* STATE */
  const [customer, setCustomer] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  /* FORM STATE */
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [beneficiary, setBeneficiary] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
    if (!selectedAccount) errs.account = "Select source account";
    if (!beneficiary.trim()) errs.beneficiary = "Enter beneficiary account";
    if (!selectedBranch) errs.branch = "Please select a branch";
    if (!amount || Number(amount) <= 0) errs.amount = "Enter valid amount";
    if (!frequency) errs.frequency = "Select frequency";
    if (!startDate) errs.startDate = "Select start date";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };
  
  console.log("res", customer?.user_id || sessionUser?.user_id,
          "service fee", serviceFee,
          "branch", selectedBranch);
          
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/standing-orders/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            source_account: selectedAccount?.account_number,
            beneficiary_account: beneficiary,
            beneficiary_name: beneficiaryName,
            amount: Number(amount),
            currency: selectedAccount?.currency || "KES",
            frequency: frequency,
            start_date: startDate,
            end_date: endDate || null,
            branch: selectedBranch,
            officer_notes: officerNotes,
            user_id: customer?.user_id || sessionUser?.user_id,
            service_amount: serviceFee,
          }),
        }
      );

      const data = await response.json();

      console.log("Standing Order API Response:", data);

      if (!response.ok) {
        alert(data.message || "Standing order creation failed");
        setLoading(false);
        return;
      }

      // Move to Validation Step
      setStep(2);

    } catch (error) {
      console.error("Standing order error:", error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalComplete = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    alert("Standing Order Created Successfully");
    if (onComplete) onComplete();
    if (onBack) onBack();
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
              Standing Order
            </h1>
            <p className="text-xs text-gray-500">
              Step {step} of 6: {STEPS[step - 1].name}
            </p>
          </div>
        </div>

        {/* ROUND STEPPER UI */}
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
                    {customer?.customerId || sessionUser?.user_id} • {customer?.phone || sessionUser?.phone}
                  </p>
                </div>
              </div>

              {/* Header Info */}
              <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-[hsl(var(--accent))]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Set Standing Order</h3>
                  <p className="text-xs text-muted-foreground">
                    Create recurring payment instructions
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-2">
                <Label>Source Account *</Label>
                <Select
                  value={selectedAccount?.account_number || ""}
                  onValueChange={(val) => {
                    const acc = eligibleAccounts.find((a) => a.account_number === val);
                    setSelectedAccount(acc);
                    setFormErrors((prev) => ({ ...prev, account: "" }));
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
                <Label>Beneficiary Account *</Label>
                <Input
                  placeholder="Enter beneficiary account"
                  value={beneficiary}
                  onChange={(e) => {
                    setBeneficiary(e.target.value);
                    setFormErrors((prev) => ({ ...prev, beneficiary: "" }));
                  }}
                  className={formErrors.beneficiary ? "border-destructive" : ""}
                />
                {formErrors.beneficiary && <p className="text-xs text-destructive">{formErrors.beneficiary}</p>}
              </div>

              <div className="space-y-2">
                <Label>Beneficiary Name</Label>
                <Input
                  placeholder="Enter beneficiary name"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                />
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
                    <SelectValue placeholder="Choose a branch for this standing order" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCH_OPTIONS.map((branch) => (
                      <SelectItem key={branch.value} value={branch.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{branch.label}</span>
                          <span className="text-xs text-muted-foreground">{branch.location}</span>
                        </div>
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
                  <p className="text-xs font-medium text-blue-800">Standing Order Branch Information</p>
                  <p className="text-xs text-blue-700">
                    This standing order will be managed under the selected branch. 
                    All recurring payments will be processed and recorded against this branch.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount ({selectedAccount?.currency || "KES"}) *</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setFormErrors((prev) => ({ ...prev, amount: "" }));
                  }}
                  className={formErrors.amount ? "border-destructive" : ""}
                />
                {formErrors.amount && <p className="text-xs text-destructive">{formErrors.amount}</p>}
              </div>

              <div className="space-y-2">
                <Label>Frequency *</Label>
                <Select
                  value={frequency}
                  onValueChange={(v) => {
                    setFrequency(v);
                    setFormErrors((prev) => ({ ...prev, frequency: "" }));
                  }}
                >
                  <SelectTrigger className={formErrors.frequency ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.frequency && <p className="text-xs text-destructive">{formErrors.frequency}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setFormErrors((prev) => ({ ...prev, startDate: "" }));
                    }}
                    className={formErrors.startDate ? "border-destructive" : ""}
                  />
                  {formErrors.startDate && <p className="text-xs text-destructive">{formErrors.startDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
                disabled={loading}
              >
                {loading ? "Processing..." : "Submit for Validation"}
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
              <h3 className="font-semibold text-lg">Validating Instruction...</h3>
              <p className="text-sm text-muted-foreground">Checking account status and limits</p>
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
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Instruction Summary</h4>
                <div className="space-y-0">
                  {[
                    { l: "Customer Name", v: customer?.fullName || sessionUser?.first_name },
                    { l: "Source Account", v: selectedAccount?.account_number },
                    { l: "Beneficiary", v: `${beneficiary} (${beneficiaryName || 'N/A'})` },
                    { l: "Amount", v: `${selectedAccount?.currency || 'KES'} ${Number(amount).toLocaleString()}` },
                    { l: "Frequency", v: FREQUENCY_OPTIONS.find(f => f.value === frequency)?.label },
                    { l: "Start Date", v: startDate },
                    { l: "End Date", v: endDate || "Until Cancelled" },
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

          {/* ========== STEP 4: PROCESSING ========== */}
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

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Please verify the standing order details and schedule.</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
                  <span className="font-medium">Branch:</span> {BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Officer Notes</Label>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Customer Name</p>
                    <p className="font-semibold">{customer?.fullName || sessionUser?.first_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer ID</p>
                    <p className="font-medium text-gray-700">{customer?.customerId || sessionUser?.user_id}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Branch</p>
                    <p className="font-medium text-gray-700">{BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs p-2 rounded border border-green-200 mt-2">
                  <Star className="h-3.5 w-3.5" />
                  <span>Instruction verified and ready for activation</span>
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
              {/* QR Image */}
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
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}