import { useState, useEffect, useMemo } from "react";
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

import {
  ArrowLeft,
  Check,
  AlertCircle,
  Shield,
  Eye,
  ThumbsUp,
  Receipt,
  Loader2,
  RefreshCw,
  Info,
  ArrowRightLeft,
} from "lucide-react";

const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Complete" },
];

export const FxTransfer = ({
  customer: propCustomer,
  onBack,
  onComplete,
  formFields,
}) => {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [customer, setCustomer] = useState(null);

  const [step, setStep] = useState(1);

  // Account and basic fields
  const [fromAccount, setFromAccount] = useState(null);
  const [toAccountNumber, setToAccountNumber] = useState(""); // Text field for external account
  const [toAccountName, setToAccountName] = useState(""); // Optional beneficiary name
  const [toBankName, setToBankName] = useState(""); // Optional bank name
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");

  // FX Transfer specific fields
  const [fromCurrency, setFromCurrency] = useState("KES");
  const [toCurrency, setToCurrency] = useState("");
  const [amount, setAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState(null);
  const [fxCharge, setFxCharge] = useState(0);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);
   const serviceFee = useMemo(() => {
    return formFields?.[0]?.service_type?.service_fee || 0;
  }, [formFields]);
  // Currency data from API
  const [currencies, setCurrencies] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [currencyError, setCurrencyError] = useState(null);

  const [errors, setErrors] = useState({});
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

  /* FETCH CURRENCIES FROM API */
  const fetchCurrencies = async () => {
    setLoadingCurrencies(true);
    setCurrencyError(null);
    
    try {
      const response = await fetch("http://127.0.0.1:8000/api/currencies/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Fetched Currencies:", data);
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch currencies");
      }

      setCurrencies(data);
      
    } catch (error) {
      console.error("Error fetching currencies:", error);
      setCurrencyError(error.message);
    } finally {
      setLoadingCurrencies(false);
    }
  };

  // Fetch currencies when component mounts
  useEffect(() => {
    fetchCurrencies();
  }, []);

  // Calculate exchange rate when both currencies are selected
  useEffect(() => {
    if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
      // Find the target currency
      const targetCurrency = currencies.find(c => c.code === toCurrency);
      
      if (targetCurrency) {
        const numAmount = Number(amount) || 0;
        
        // For KES to Foreign Currency (Buy)
        if (fromCurrency === "KES") {
          const rate = Number(targetCurrency.buy_rate) || 0;
          setExchangeRate(rate);
          
          // FX Charge (example: 1% of amount)
          const charge = numAmount * 0.01;
          setFxCharge(charge);
          
          // Calculate converted amount (KES to Foreign)
          const converted = rate > 0 ? numAmount / rate : 0;
          setConvertedAmount(converted);
          
          // Total Debit = Amount + FX Charge
          setTotalDebit(numAmount + charge);
        }
        // For Foreign Currency to KES (Sell)
        else if (toCurrency === "KES") {
          const rate = Number(targetCurrency.sell_rate) || 0;
          setExchangeRate(rate);
          
          // FX Charge (example: 1% of amount)
          const charge = numAmount * 0.01;
          setFxCharge(charge);
          
          // Calculate converted amount (Foreign to KES)
          const converted = numAmount * rate;
          setConvertedAmount(converted);
          
          // Total Debit = Amount (foreign is debited separately)
          setTotalDebit(numAmount);
        }
        // For Foreign to Foreign (cross currency)
        else {
          // This would need cross rate calculation
          // For now, using a placeholder
          const rate = 1.5;
          setExchangeRate(rate);
          
          const charge = numAmount * 0.015;
          setFxCharge(charge);
          
          setConvertedAmount(numAmount * rate);
          setTotalDebit(numAmount + charge);
        }
      }
    } else {
      setExchangeRate(null);
      setFxCharge(0);
      setConvertedAmount(0);
      setTotalDebit(0);
    }
  }, [fromCurrency, toCurrency, amount, currencies]);

  /* ELIGIBLE ACCOUNTS */
  const eligibleAccounts = useMemo(() => {
    return accounts.filter((acc) => acc?.status === "ACTIVE");
  }, [accounts]);

  // Filter accounts based on from currency
  const fromCurrencyAccounts = useMemo(() => {
    return eligibleAccounts.filter(acc => 
      acc.currency === fromCurrency || (fromCurrency === "KES" && !acc.currency)
    );
  }, [eligibleAccounts, fromCurrency]);

  /* VALIDATION */
  const validate = () => {
    const errs = {};
    if (!fromAccount) errs.fromAccount = "Please select source account";
    if (!toAccountNumber) errs.toAccountNumber = "Please enter destination account number";
    if (!fromCurrency) errs.fromCurrency = "Please select from currency";
    if (!toCurrency) errs.toCurrency = "Please select to currency";
    if (fromCurrency === toCurrency) errs.toCurrency = "From and To currencies cannot be same";
    
    const num = Number(amount);
    if (isNaN(num) || num <= 0) errs.amount = "Enter valid amount";
    
    // Check if from account has sufficient balance
    if (fromAccount) {
      const balance = Number(fromAccount.balance) || 0;
      if (fromCurrency === "KES") {
        if (balance < totalDebit) {
          errs.amount = `Insufficient balance. Required: ${fromCurrency} ${totalDebit.toFixed(2)}`;
        }
      } else {
        if (balance < num) {
          errs.amount = `Insufficient balance. Required: ${fromCurrency} ${num.toFixed(2)}`;
        }
      }
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
 console.log("res", customer?.user_id || sessionUser?.user_id,
          "service fee", serviceFee);
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/fx-transfers/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from_account_number: fromAccount.account_number,
          to_account_number: toAccountNumber,
          to_account_name: toAccountName,
          to_bank_name: toBankName,
          from_currency: fromCurrency,
          to_currency: toCurrency,
          amount: Number(amount),
          exchange_rate: exchangeRate,
          fx_charge: fxCharge,
          converted_amount: convertedAmount,
          total_debit: totalDebit,
          reference,
          narration,
          user_id: customer?.user_id || sessionUser?.user_id,
          service_amount: serviceFee,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Transaction failed");
        setIsSubmitting(false);
        return;
      }

      setStep(2); // Move to validation loading step
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
    // Simulate final processing
    await new Promise((r) => setTimeout(r, 1000));
    setIsSubmitting(false);
    alert("FX Transfer Successful");
    if (onComplete) onComplete();
  };

  // Get available target currencies (exclude fromCurrency)
  const availableTargetCurrencies = useMemo(() => {
    return currencies.filter(c => c.code !== fromCurrency);
  }, [currencies, fromCurrency]);

  // Safe toFixed function to handle null/undefined
  const safeToFixed = (value, digits = 2) => {
    if (value === null || value === undefined || isNaN(value)) return "0.00";
    return Number(value).toFixed(digits);
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
              FX Transfer
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
                  <p className="text-sm font-semibold">
                    {customer?.fullName || sessionUser?.first_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {customer?.user_id || sessionUser?.user_id} • {customer?.phone || sessionUser?.phone}
                  </p>
                </div>
              </div>

              {/* Form Card */}
              <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
                {/* From Account Selection (Dropdown) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <span>From Account (Source) *</span>
                    {fromCurrency && (
                      <span className="text-xs text-muted-foreground">
                        ({fromCurrency} accounts)
                      </span>
                    )}
                  </Label>
                  <Select
                    value={fromAccount?.account_number || ""}
                    onValueChange={(val) => {
                      const acc = eligibleAccounts.find((a) => a.account_number === val);
                      setFromAccount(acc);
                      // Auto-set from currency based on account currency
                      if (acc) {
                        setFromCurrency(acc.currency || "KES");
                      }
                    }}
                  >
                    <SelectTrigger className={errors.fromAccount ? "border-destructive" : ""}>
                      <SelectValue placeholder="Choose source account" />
                    </SelectTrigger>
                    <SelectContent>
                      {fromCurrencyAccounts.length > 0 ? (
                        fromCurrencyAccounts.map((acc) => (
                          <SelectItem key={acc.account_number} value={acc.account_number}>
                            <div className="flex flex-col">
                              <span>{acc.account_number}</span>
                              <span className="text-xs text-muted-foreground">
                                Balance: {acc.currency || "KES"} {acc.balance?.toLocaleString()}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No {fromCurrency} accounts available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.fromAccount && <p className="text-xs text-destructive">{errors.fromAccount}</p>}
                </div>

                {/* Arrow indicating transfer direction */}
                <div className="flex justify-center">
                  <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* To Account (Text Field for external account) */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>To Account Number (Beneficiary) *</Label>
                    <Input
                      value={toAccountNumber}
                      onChange={(e) => setToAccountNumber(e.target.value)}
                      placeholder="Enter beneficiary account number"
                      className={errors.toAccountNumber ? "border-destructive" : ""}
                    />
                    {errors.toAccountNumber && <p className="text-xs text-destructive">{errors.toAccountNumber}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Beneficiary Name</Label>
                      <Input
                        value={toAccountName}
                        onChange={(e) => setToAccountName(e.target.value)}
                        placeholder="Enter beneficiary name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input
                        value={toBankName}
                        onChange={(e) => setToBankName(e.target.value)}
                        placeholder="Enter bank name"
                      />
                    </div>
                  </div>
                </div>

                {/* Currency Selection */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-2">
                    <Label>From Currency</Label>
                    <Select
                      value={fromCurrency}
                      onValueChange={setFromCurrency}
                      disabled={fromAccount} // Disable if account selected
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>To Currency</Label>
                    <Select
                      value={toCurrency}
                      onValueChange={setToCurrency}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTargetCurrencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.toCurrency && <p className="text-xs text-destructive">{errors.toCurrency}</p>}
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Enter amount in ${fromCurrency}`}
                    className={errors.amount ? "border-destructive" : ""}
                  />
                  {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                </div>

                {/* Exchange Rate Display */}
                {exchangeRate !== null && fromCurrency && toCurrency && fromCurrency !== toCurrency && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Info className="h-4 w-4" />
                      <span className="text-sm font-medium">Exchange Details</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Exchange Rate:</span>
                        <span className="font-medium">
                          1 {fromCurrency} = {safeToFixed(exchangeRate, 4)} {toCurrency}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">You Send:</span>
                        <span className="font-medium">{fromCurrency} {Number(amount).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">FX Charge (1%):</span>
                        <span className="font-medium text-amber-600">{fromCurrency} {safeToFixed(fxCharge)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm font-semibold border-t pt-2">
                        <span className="text-gray-700">Recipient Gets:</span>
                        <span className="text-green-600">
                          {toCurrency} {safeToFixed(convertedAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reference and Narration */}
                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Enter reference (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Narration</Label>
                  <Input
                    value={narration}
                    onChange={(e) => setNarration(e.target.value)}
                    placeholder="Enter narration (optional)"
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || exchangeRate === null}
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
              >
                {isSubmitting ? "Processing..." : "Submit for Validation"}
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
              <h3 className="font-semibold text-lg">Validating FX Transfer...</h3>
              <p className="text-sm text-muted-foreground">Checking exchange rates and account limits</p>
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
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  FX Transfer Summary
                </h4>

                <div className="space-y-0">
                  {[
                    { l: "From Account", v: fromAccount?.account_number },
                    { l: "To Account", v: toAccountNumber },
                    ...(toAccountName ? [{ l: "Beneficiary Name", v: toAccountName }] : []),
                    ...(toBankName ? [{ l: "Bank Name", v: toBankName }] : []),
                    { l: "From Currency", v: fromCurrency },
                    { l: "To Currency", v: toCurrency },
                    { l: "Amount to Send", v: `${fromCurrency} ${Number(amount).toLocaleString()}` },
                    { l: "Exchange Rate", v: `1 ${fromCurrency} = ${safeToFixed(exchangeRate, 4)} ${toCurrency}` },
                    { l: "FX Charge", v: `${fromCurrency} ${safeToFixed(fxCharge)}` },
                    { l: "Recipient Gets", v: `${toCurrency} ${safeToFixed(convertedAmount)}` },
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

          {/* ========== STEP 4: PROCESSING (Verification Prompt) ========== */}
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
                <Eye className="h-5 w-5" />
                <span className="text-sm font-medium">Customer Verification</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Please verify customer identity and confirm FX transfer details.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600 font-mono">
                  ID: {customer?.id_number || sessionUser?.id_number || "N/A"}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(5)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">
                  Confirm Identity
                </Button>
              </div>
            </motion.div>
          )}

          {/* ========== STEP 5: VERIFICATION (Authorization) ========== */}
          {step === 5 && (
            <motion.div
              key="step5"
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
                This FX transfer requires supervisor approval to be completed.
              </p>

              <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-6 space-y-4 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">FX-{Date.now().toString().slice(-8)}</span>
                </div>

                <div className="flex items-center gap-2 rounded bg-green-100 p-3 text-green-900 text-xs">
                  <Check className="h-4 w-4" />
                  <span>Identity Verified</span>
                </div>
              </div>

              <Button
                onClick={() => setStep(6)}
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
              >
                Authorize Transfer
              </Button>
            </motion.div>
          )}

          {/* ========== STEP 6: COMPLETE ========== */}
          {step === 6 && (
            <motion.div
              key="step6"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 max-w-lg mx-auto text-center py-10"
            >
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>

              <h3 className="text-xl font-semibold">FX Transfer Successful</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Your foreign exchange transfer has been completed successfully.
              </p>

              <div className="rounded-xl border bg-white p-6 shadow-sm text-left space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">From Account</span>
                  <span className="font-medium">{fromAccount?.account_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">To Account</span>
                  <span className="font-medium">{toAccountNumber}</span>
                </div>
                {toAccountName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Beneficiary</span>
                    <span className="font-medium">{toAccountName}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount Sent</span>
                  <span className="font-medium">{fromCurrency} {Number(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount Received</span>
                  <span className="font-medium text-green-600">{toCurrency} {safeToFixed(convertedAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Rate Applied</span>
                  <span className="font-medium">1 {fromCurrency} = {safeToFixed(exchangeRate, 4)} {toCurrency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">FX Charge</span>
                  <span className="font-medium text-amber-600">{fromCurrency} {safeToFixed(fxCharge)}</span>
                </div>
              </div>

              <Button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
              >
                {isSubmitting ? "Completing..." : "Finish"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};