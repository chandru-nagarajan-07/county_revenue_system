import { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
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
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardHeader } from "@/components/banking/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
<<<<<<< HEAD

import { inferSegment, SEGMENT_LABELS } from "@/data/serviceCharges";

/* FX PAIRS */
=======
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ACCOUNT_TYPE_LABELS } from "@/data/demoCustomers";
import { inferSegment, SEGMENT_LABELS, computeCharges } from "@/data/serviceCharges";
>>>>>>> 55dd31778740765dbd0bf9549fc87e00a838f6ac

/* FX PAIRS & HELPERS */
const FX_PAIRS = [
  { code: "USD", label: "US Dollar", midRate: 129.45 },
  { code: "EUR", label: "Euro", midRate: 141.8 },
  { code: "GBP", label: "British Pound", midRate: 164.2 },
];

const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Authorization" },
];

<<<<<<< HEAD
  /* SESSION USER */

  const sessionUser = JSON.parse(sessionStorage.getItem("userData1") || "{}");

  const accounts = sessionUser?.account || [];

  console.log("SESSION USER:", sessionUser);
  console.log("ACCOUNTS:", accounts);
=======
export function DenominationExchangeInput({ customer, onBack }) {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
>>>>>>> 55dd31778740765dbd0bf9549fc87e00a838f6ac

  /* WORKFLOW STATE */
  const [step, setStep] = useState(1); // 1 to 6
  
  /* FORM STATE (Step 1) */
  const [direction, setDirection] = useState("BUY");
  const [selectedPair, setSelectedPair] = useState(null);
  const [fcyAmount, setFcyAmount] = useState("");
  const [sourceAccNum, setSourceAccNum] = useState("");
  const [settlementAccNum, setSettlementAccNum] = useState("");
  const [settlementMethod, setSettlementMethod] = useState("account-credit");
  const [formErrors, setFormErrors] = useState({});

  /* PROCESSING STATE (Step 4) */
  const [officerRate, setOfficerRate] = useState(null);
  const [rateImproved, setRateImproved] = useState(false);
  const [officerNotes, setOfficerNotes] = useState("");

  /* DERIVED DATA */
  const accounts = customer?.accounts || [];

<<<<<<< HEAD
  /* CUSTOMER SEGMENT */

=======
>>>>>>> 55dd31778740765dbd0bf9549fc87e00a838f6ac
  const segment = useMemo(() => {
    const safeCustomer = {
      ...customer,
<<<<<<< HEAD
      accounts: accounts
    });

  }, [customer, accounts]);

  /* ACCOUNT FILTERS */

  const activeAccounts = useMemo(() =>
    accounts.filter(
      acc => acc?.status === "ACTIVE"
    ),
    [accounts]
  );

  /* For now both use same accounts */

  const kesAccounts = activeAccounts;
  const fxAccounts = activeAccounts;
=======
      accounts: customer?.accounts || [],
    };
    return inferSegment(safeCustomer);
  }, [customer]);

  const kesAccounts = useMemo(
    () =>
      accounts.filter(
        (acc) =>
          acc?.status === "active" &&
          acc?.currency === "KES" &&
          (acc?.type === "current" || acc?.type === "savings")
      ),
    [accounts]
  );

  const fxAccounts = useMemo(
    () => accounts.filter((acc) => acc?.status === "active" && acc?.type === "fx"),
    [accounts]
  );
>>>>>>> 55dd31778740765dbd0bf9549fc87e00a838f6ac

  const sourceOptions = direction === "BUY" ? kesAccounts : fxAccounts;
  const settlementOptions = direction === "BUY" ? fxAccounts : kesAccounts;

  const fcyNum = Number(fcyAmount) || 0;
  const midRate = selectedPair?.midRate || 0;
  
  // Logic for rates
  const spread = direction === "BUY" ? 0.015 : -0.015;
  const systemOfferedRate = midRate + (midRate * spread);
  const finalRate = officerRate || systemOfferedRate;
  const kesTotal = fcyNum * finalRate;

  // Corridor for slider (Step 4)
  const corridor = {
    min: midRate * 0.98,
    max: midRate * 1.02,
  };

  // Service Charges
  const charges = useMemo(() => {
    return computeCharges('denomination-exchange', segment, fcyNum);
  }, [segment, fcyNum]);

  /* HANDLERS */
  const validateForm = () => {
    const errs = {};
    if (!selectedPair) errs.currency = "Select currency";
    if (!fcyAmount || fcyNum <= 0) errs.amount = "Enter valid amount";
    if (!sourceAccNum) errs.source = "Select source account";
    if (!settlementAccNum) errs.settlement = "Select settlement account";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStepOneSubmit = () => {
    if (validateForm()) {
      setStep(2); // Go to Validation
    }
  };

  // Auto-advance Step 2 -> 3
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => setStep(3), 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleRateChange = (val) => {
    const rate = val[0] / 10000; // Slider value logic
    setOfficerRate(rate);
    setRateImproved(Math.abs(rate - systemOfferedRate) > 0.0001);
  };

  /* RENDER HELPERS */
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        customerName={customer?.fullName || customer?.name || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => {
          localStorage.removeItem("customer");
          navigate("/");
        }}
      />

<<<<<<< HEAD
    <div className="space-y-5 max-w-lg mx-auto">

      {/* CUSTOMER BANNER */}

      {customer && (

        <div className="flex items-center gap-3 rounded-xl border p-4">

          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">

            {(customer?.fullName || "")
              .split(" ")
              .map(n => n[0])
              .join("")
              .slice(0, 2)}

          </div>

          <div>

            <p className="text-sm font-semibold">
              {customer?.fullName}
            </p>

            <p className="text-xs text-muted-foreground">
              {customer?.customerId} • {customer?.phone}
            </p>

          </div>

          <span className="px-2 py-1 text-xs rounded bg-accent/10 text-accent">
            {SEGMENT_LABELS?.[segment]}
          </span>

        </div>

      )}

      {/* BUY / SELL */}

      <div className="grid grid-cols-2 gap-3">

        {["BUY", "SELL"].map(dir => (

          <button
            key={dir}
            onClick={() => {
              setDirection(dir);
              setSourceAccNum("");
              setSettlementAccNum("");
            }}
            className={`p-4 rounded-xl border ${
              direction === dir
                ? "border-primary bg-primary/10"
                : "border-border"
            }`}
          >

            {dir === "BUY"
              ? <TrendingUp className="h-4 w-4" />
              : <TrendingDown className="h-4 w-4" />}

            <p className="text-sm font-semibold mt-1">

              {dir === "BUY"
                ? "Buy Foreign Currency"
                : "Sell Foreign Currency"}

            </p>

          </button>

        ))}

      </div>

      {/* CURRENCY */}

      <div className="space-y-2">

        <Label>Currency *</Label>

        <Select
          value={selectedPair?.code || ""}
          onValueChange={(val) =>
            setSelectedPair(
              FX_PAIRS.find(p => p.code === val) || null
            )
          }
        >

          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>

          <SelectContent>

            {FX_PAIRS.map(pair => (

              <SelectItem
                key={pair.code}
                value={pair.code}
              >

                {pair.code} — {pair.label}

              </SelectItem>

            ))}

          </SelectContent>

        </Select>

        {errors.currency && (
          <p className="text-xs text-destructive">
            {errors.currency}
          </p>
        )}

      </div>

      {/* AMOUNT */}

      <div className="space-y-2">

        <Label>Foreign Amount *</Label>

        <Input
          type="number"
          value={fcyAmount}
          onChange={(e) => setFcyAmount(e.target.value)}
        />

        {errors.amount && (
          <p className="text-xs text-destructive">
            {errors.amount}
          </p>
        )}

      </div>

      {/* SOURCE ACCOUNT */}

      <div className="space-y-2">

        <Label>Source Account *</Label>

        <Select
          value={sourceAccNum}
          onValueChange={setSourceAccNum}
        >

          <SelectTrigger>
            <SelectValue placeholder="Select account" />
          </SelectTrigger>

          <SelectContent>

            {sourceOptions.map(acc => (

              <SelectItem
                key={acc.account_number}
                value={acc.account_number}
              >

                {acc.account_number} • {acc.balance}

              </SelectItem>

            ))}

          </SelectContent>

        </Select>

        {errors.source && (
          <p className="text-xs text-destructive">
            {errors.source}
          </p>
        )}

      </div>

      {/* SUMMARY */}

      {selectedPair && fcyNum > 0 && (

        <div className="rounded-xl border p-4">

          <div className="flex justify-between text-sm">

            <span>Rate</span>
            <span>{selectedPair.midRate}</span>

=======
      {/* Sticky Header with Back Button & Stepper */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
              Denomination Exchange
            </h1>
            <p className="text-xs text-gray-500">
              Step {step} of 6: {STEPS[step - 1].name}
            </p>
>>>>>>> 55dd31778740765dbd0bf9549fc87e00a838f6ac
          </div>
        </div>
        
        {/* ========== NEW ROUND STEPPER UI ========== */}
        <div className="flex items-center w-full mt-2 px-1">
          {STEPS.map((s, index) => {
            const isCompleted = s.id < step;
            const isCurrent = s.id === step;

            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                {/* Circle Container */}
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

                {/* Connector Line */}
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
                  {(customer?.fullName || "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{customer?.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer?.customerId} • {SEGMENT_LABELS[segment]}
                  </p>
                </div>
              </div>

              {/* Direction Toggle */}
              <div className="grid grid-cols-2 gap-3">
                {["BUY", "SELL"].map((dir) => (
                  <button
                    key={dir}
                    onClick={() => {
                      setDirection(dir);
                      setSourceAccNum("");
                      setSettlementAccNum("");
                    }}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      direction === dir
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-white hover:bg-gray-50"
                    }`}
                  >
                    {dir === "BUY" ? (
                      <TrendingUp className="h-4 w-4 mb-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mb-1" />
                    )}
                    <p className="text-sm font-semibold">
                      {dir === "BUY" ? "Buy FCY" : "Sell FCY"}
                    </p>
                  </button>
                ))}
              </div>

              {/* Currency & Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={selectedPair?.code || ""}
                    onValueChange={(val) =>
                      setSelectedPair(FX_PAIRS.find((p) => p.code === val) || null)
                    }
                  >
                    <SelectTrigger className={formErrors.currency ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FX_PAIRS.map((pair) => (
                        <SelectItem key={pair.code} value={pair.code}>
                          {pair.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (FCY)</Label>
                  <Input
                    type="number"
                    value={fcyAmount}
                    onChange={(e) => setFcyAmount(e.target.value)}
                    placeholder="0.00"
                    className={formErrors.amount ? "border-destructive" : ""}
                  />
                </div>
              </div>

              {/* Accounts */}
              <div className="space-y-2">
                <Label>Source Account</Label>
                <Select value={sourceAccNum} onValueChange={setSourceAccNum}>
                  <SelectTrigger className={formErrors.source ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((acc) => (
                      <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                        {acc.accountNumber} • {acc.currency} {acc.balance?.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-2">
                <Label>Settlement Method</Label>
                <Select value={settlementMethod} onValueChange={setSettlementMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account-credit">Account Credit</SelectItem>
                    <SelectItem value="cash-collection">Cash Collection</SelectItem>
                    <SelectItem value="wire-transfer">Wire Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleStepOneSubmit} className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold">
                Validate Transaction
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
              <p className="text-sm text-muted-foreground">Checking compliance and limits</p>
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
                    { l: "Direction", v: direction },
                    { l: "Currency", v: selectedPair?.label },
                    { l: "Amount", v: `${fcyNum.toLocaleString()} ${selectedPair?.code}` },
                    { l: "Source Acc", v: sourceAccNum },
                    { l: "Settlement Acc", v: settlementAccNum },
                    { l: "Method", v: settlementMethod.replace('-', ' ') },
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
                    <span className="text-gray-500">Service Fee</span>
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

          {/* ========== STEP 4: PROCESSING (Rate Adjustment) ========== */}
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
                <span className="text-sm font-medium">Officer Rate Review</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase">Market Rate</p>
                    <p className="font-bold">{midRate.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-[10px] text-blue-600 uppercase font-semibold">System Rate</p>
                    <p className="font-bold text-blue-700">{systemOfferedRate.toFixed(4)}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${rateImproved ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <p className="text-[10px] text-gray-500 uppercase">Final Rate</p>
                    <p className={`font-bold ${rateImproved ? 'text-green-700' : ''}`}>{finalRate.toFixed(4)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-medium">Adjust Rate (Corridor)</Label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{corridor.min.toFixed(4)}</span>
                    <Slider
                      min={corridor.min * 10000}
                      max={corridor.max * 10000}
                      step={1}
                      value={[(officerRate || systemOfferedRate) * 10000]}
                      onValueChange={handleRateChange}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-400">{corridor.max.toFixed(4)}</span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">FCY Amount</span>
                    <span className="font-medium">{fcyNum.toLocaleString()} {selectedPair?.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">KES Equivalent</span>
                    <span className="font-bold text-lg">KES {kesTotal.toLocaleString()}</span>
                  </div>
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
                  {rateImproved ? "Submit for Approval" : "Confirm Rate"}
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
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Final Deal Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Direction</p>
                    <p className="font-semibold capitalize">{direction}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="font-semibold">{fcyNum.toLocaleString()} {selectedPair?.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rate</p>
                    <p className="font-bold text-primary">{finalRate.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total (KES)</p>
                    <p className="font-bold text-lg">{kesTotal.toLocaleString()}</p>
                  </div>
                </div>

                {rateImproved && (
                  <div className="flex items-center gap-2 bg-amber-50 text-amber-800 text-xs p-2 rounded border border-amber-200 mt-2">
                    <Star className="h-3.5 w-3.5" />
                    <span>Preferential rate applied</span>
                  </div>
                )}
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
                  <span className="font-mono text-xs">FX-{Date.now().toString().slice(-8)}</span>
                </div>
                
                {rateImproved ? (
                  <div className="flex items-center gap-2 rounded bg-amber-100 p-3 text-amber-900 text-xs">
                    <AlertCircle className="h-4 w-4" />
                    <span>Rate requires Supervisor override approval</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded bg-green-100 p-3 text-green-900 text-xs">
                    <Check className="h-4 w-4" />
                    <span>Within standard limits</span>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => {
                  alert("Transaction Authorized & Completed!");
                  onBack();
                }} 
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
              >
                Authorize Transaction
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}