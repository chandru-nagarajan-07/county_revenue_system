import { useState, useMemo, useEffect } from "react";
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
  ArrowLeftRight,
  Clock,
  Smartphone,
  MapPin,
} from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import qr from '@/assets/qr.png';
import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from "@/data/demoCustomers";
import { recommendChannels } from "@/data/paymentChannels";
import { inferSegment, SEGMENT_LABELS, computeCharges } from "@/data/serviceCharges";

/* CONSTANTS */
const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Authorization" },
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

const ICON_MAP = {
  ArrowLeftRight: <ArrowLeftRight className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  Smartphone: <Smartphone className="h-4 w-4" />
};

export function FundsTransferInput({ customer: propCustomer, onBack, formFields=[] }) {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  /* SESSION USER */
  let sessionUser = {};
  try {
    sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {};
    console.log("Session User:", sessionUser);
  } catch {
    sessionUser = {};
  }
  
  // 1. Extract accounts safely
  const accounts = sessionUser?.account || [];
  
  // 2. Determine customer
  const customer = propCustomer || sessionUser;

  /* WORKFLOW STATE */
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  /* FORM STATE */
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [destination, setDestination] = useState("other-bank");
  const [beneficiaryAccount, setBeneficiaryAccount] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const serviceFee = useMemo(() => {
    return formFields?.[0]?.service_type?.service_fee || 0;
  }, [formFields]);
  
  /* PROCESSING STATE */
  const [officerNotes, setOfficerNotes] = useState("");

  /* DERIVED DATA */
  // FIXED: Use accounts directly from session
  const eligibleAccounts = useMemo(() => {
    return accounts || [];
  }, [accounts]);

  const numAmount = useMemo(() => {
    const n = Number(amount);
    return isNaN(n) || n <= 0 ? 0 : n;
  }, [amount]);

  const recommendations = useMemo(() => {
    if (numAmount === 0) return [];
    try {
      return recommendChannels(numAmount, destination) || [];
    } catch {
      return [];
    }
  }, [numAmount, destination]);

  const recommendedId = recommendations.find(r => r.recommended)?.channel?.id;
  const effectiveChannelId = selectedChannelId ?? recommendedId ?? null;
  const selectedRec = recommendations.find(r => r.channel?.id === effectiveChannelId);

  const segment = useMemo(() => {
    const safeCustomer = {
      ...customer,
      accounts: accounts
    };
    return inferSegment(safeCustomer);
  }, [customer, accounts]);

  const charges = useMemo(() => {
    return computeCharges('funds-transfer', segment, numAmount);
  }, [segment, numAmount]);

  /* HANDLERS */
  const validate = () => {
    const errs = {};
    if (!selectedAccount) errs.account = "Please select a source account";
    if (!beneficiaryAccount.trim()) errs.beneficiaryAccount = "Beneficiary account is required";
    if (!beneficiaryName.trim()) errs.beneficiaryName = "Beneficiary name is required";
    if (numAmount <= 0) errs.amount = "Enter a valid amount";
    if (!selectedBranch) errs.branch = "Please select a branch";
    if (!effectiveChannelId) errs.channel = "Please select a payment channel";
    if (selectedRec && !selectedRec.eligible) errs.channel = selectedRec.ineligibleReason || "Channel not available";
    
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };
  
  console.log("res", customer?.user_id || sessionUser?.user_id,
          "service fee", serviceFee,
          "selected branch", selectedBranch);
          
  const handleStepOneSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/fund-transfer/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: customer?.user_id || sessionUser?.user_id,
            service_amount: serviceFee,
            source_account: selectedAccount?.accountNumber || selectedAccount?.account_number,
            beneficiary_account: beneficiaryAccount,
            beneficiary_name: beneficiaryName,
            amount: numAmount,
            destination: destination,
            channel_id: effectiveChannelId,
            branch: selectedBranch,
            reference: reference,
            officer_notes: officerNotes,
          }),
        }
      );

      const data = await response.json();

      console.log("Fund Transfer Response:", data);

      if (!response.ok) {
        alert(data.message || "Transfer failed");
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep(2);

    } catch (error) {
      console.error("Transfer error:", error);
      alert("Network error");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => setStep(3), 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleFinalComplete = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    alert("Transfer Authorized & Processed!");
    if (onBack) onBack();
  };

  /* ANIMATION VARIANTS */
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Customer not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        customerName={customer?.first_name || customer?.fullName || "Customer"}
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
              Funds Transfer
            </h1>
            <p className="text-xs text-gray-500">
              Step {step} of 6: {STEPS[step - 1].name}
            </p>
          </div>
        </div>

        {/* Stepper UI */}
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
                  {(customer?.fullName || customer?.first_name || "C")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{customer?.fullName || customer?.first_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer?.customerId || customer?.user_id} • {SEGMENT_LABELS[segment]}
                  </p>
                </div>
              </div>

              {/* FIXED: Source Account Dropdown */}
              <div className="space-y-2">
                <Label>Source Account *</Label>
                <Select
                  value={selectedAccount?.accountNumber || selectedAccount?.account_number || ""}
                  onValueChange={(val) => {
                    const acc = accounts.find(a => (a.accountNumber || a.account_number) === val);
                    setSelectedAccount(acc);
                  }}
                >
                  <SelectTrigger className={formErrors.account ? "border-destructive" : ""}>
                    <SelectValue placeholder="Choose account"/>
                  </SelectTrigger>
                  <SelectContent>
                    {accounts && accounts.length > 0 ? (
                      accounts.map(acc => (
                        <SelectItem 
                          key={acc.accountNumber || acc.account_number} 
                          value={acc.accountNumber || acc.account_number}
                        >
                          {acc.accountNumber || acc.account_number} • {acc.account_type === 2 ? 'Savings Account' : 'Account'} • KES • Balance: {acc.balance || '0.00'}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-accounts" disabled>
                        No accounts available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formErrors.account && <p className="text-xs text-destructive">{formErrors.account}</p>}
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label>Destination *</Label>
                <Select
                  value={destination}
                  onValueChange={(val) => {
                    setDestination(val);
                    setSelectedChannelId(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="same-bank">Same Bank</SelectItem>
                    <SelectItem value="other-bank">Other Bank</SelectItem>
                    <SelectItem value="mobile-wallet">Mobile Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Beneficiary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Beneficiary Account *</Label>
                  <Input
                    value={beneficiaryAccount}
                    onChange={(e)=>setBeneficiaryAccount(e.target.value)}
                    className={formErrors.beneficiaryAccount ? "border-destructive" : ""}
                  />
                  {formErrors.beneficiaryAccount && <p className="text-xs text-destructive">{formErrors.beneficiaryAccount}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Beneficiary Name *</Label>
                  <Input
                    value={beneficiaryName}
                    onChange={(e)=>setBeneficiaryName(e.target.value)}
                    className={formErrors.beneficiaryName ? "border-destructive" : ""}
                  />
                  {formErrors.beneficiaryName && <p className="text-xs text-destructive">{formErrors.beneficiaryName}</p>}
                </div>
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
                    <SelectValue placeholder="Choose a branch for this transaction" />
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
                  <p className="text-xs font-medium text-blue-800">Transaction Branch Information</p>
                  <p className="text-xs text-blue-700">
                    This transaction will be processed under the selected branch. 
                    Please ensure the branch is correct for authorization purposes.
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e)=>setAmount(e.target.value)}
                  className={formErrors.amount ? "border-destructive" : ""}
                />
                {formErrors.amount && <p className="text-xs text-destructive">{formErrors.amount}</p>}
              </div>

              {/* Channels */}
              {recommendations.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-500 uppercase">Select Channel</Label>
                  <RadioGroup
                    value={effectiveChannelId || ""}
                    onValueChange={(val)=>setSelectedChannelId(val)}
                    className="space-y-2"
                  >
                    {recommendations.map(rec => (
                      <label
                        key={rec.channel.id}
                        className={`flex gap-3 border rounded-xl p-4 cursor-pointer transition-all ${
                          effectiveChannelId === rec.channel.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-white hover:bg-gray-50"
                        } ${!rec.eligible ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <RadioGroupItem value={rec.channel.id} disabled={!rec.eligible} className="mt-1" />
                        <div className="flex-1 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{rec.channel.name}</p>
                              {rec.recommended && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-700 border-green-200">
                                  <Star className="h-2.5 w-2.5 mr-1"/>Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              SLA: {rec.channel.sla} • Cost: {rec.estimatedCost}
                            </p>
                          </div>
                          <div className="text-muted-foreground">
                            {ICON_MAP[rec.channel.icon] || <Zap className="h-4 w-4"/>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                  {formErrors.channel && <p className="text-xs text-destructive">{formErrors.channel}</p>}
                </div>
              )}

              <Button 
                onClick={handleStepOneSubmit} 
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
                disabled={loading}
              >
                {loading ? "Processing..." : "Validate Transaction"}
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
              <h3 className="font-semibold text-lg">Validating Transaction...</h3>
              <p className="text-sm text-muted-foreground">Checking compliance and limits</p>
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
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transaction Summary</h4>
                <div className="space-y-0">
                  {[
                    { l: "Source Account", v: selectedAccount?.accountNumber || selectedAccount?.account_number },
                    { l: "Beneficiary", v: `${beneficiaryName} (${beneficiaryAccount})` },
                    { l: "Destination", v: destination.replace('-', ' ') },
                    { l: "Amount", v: `KES ${numAmount.toLocaleString()}` },
                    { l: "Channel", v: selectedRec?.channel?.name || "N/A" },
                    { l: "Branch", v: BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch },
                    { l: "Reference", v: reference || "-" },
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
                    <span className="text-gray-500">Transfer Fee</span>
                    <span className="font-medium">KES {charges.serviceFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Excise Duty</span>
                    <span className="font-medium">KES {charges.exciseDuty.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">KES {charges.totalCharges.toLocaleString()}</span>
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
                <span className="text-sm font-medium">Processing Details</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Channel Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Channel</p>
                    <p className="font-semibold">{selectedRec?.channel?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estimated Time</p>
                    <p className="font-bold text-lg">{selectedRec?.channel?.sla || 'Immediate'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Branch</p>
                    <p className="font-medium">{BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Transaction will be processed via the selected payment rail under the assigned branch.</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Officer Notes</Label>
                <Textarea
                  placeholder="Optional notes regarding the transaction..."
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
                <span className="text-sm font-medium">Customer Verification</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Final Deal Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Beneficiary</p>
                    <p className="font-semibold">{beneficiaryName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="font-bold text-lg">KES {numAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Source</p>
                    <p className="font-medium text-gray-700">{selectedAccount?.accountNumber || selectedAccount?.account_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Destination</p>
                    <p className="font-medium text-gray-700">{beneficiaryAccount}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Branch</p>
                    <p className="font-medium text-gray-700">{BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs p-2 rounded border border-green-200 mt-2">
                  <Star className="h-3.5 w-3.5" />
                  <span>Ready for final authorization</span>
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