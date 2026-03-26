import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { DashboardHeader } from "@/components/banking/DashboardHeader";
import qr from '@/assets/qr.png';
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
  Shield,
  Eye,
  ThumbsUp,
  Info,
  ArrowRightLeft,
  MapPin,
} from "lucide-react";

const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
];

// API Base URL - hardcoded to fix the process is not defined error
const API_BASE_URL = "http://127.0.0.1:8000";

// // Branch options for Kenya
// const BRANCH_OPTIONS = [
//   { value: "kenya", label: "Kenya - Head Office", location: "Nairobi, Kenya" },
//   { value: "nairobi", label: "Nairobi - CBD Branch", location: "Nairobi, Kenya" },
//   { value: "kilimini", label: "Kilimini - Mombasa Branch", location: "Mombasa, Kenya" },
//   { value: "westlands", label: "Westlands - Nairobi", location: "Nairobi, Kenya" },
//   { value: "industrial_area", label: "Industrial Area - Nairobi", location: "Nairobi, Kenya" },
//   { value: "nyali", label: "Nyali - Mombasa", location: "Mombasa, Kenya" },
// ];

export const FxTransfer = ({
  customer: propCustomer,
  onBack,
  onComplete,
  formFields,
}) => {
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
  const [customer, setCustomer] = useState(null);

  const [step, setStep] = useState(1);

  // Account and basic fields
  const [fromAccount, setFromAccount] = useState(null);
  const [toAccountNumber, setToAccountNumber] = useState("");
  const [toAccountName, setToAccountName] = useState("");
  const [toBankName, setToBankName] = useState("");
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

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
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [apiError, setApiError] = useState(null);

  /* SESSION USER */
  const sessionUserRaw = sessionStorage.getItem("userData1");
  // const sessionUser = JSON.parse(sessionUserRaw || "{}");
  // console.log("Session User:", sessionUser);

  // // Process accounts - SIMPLE: just use as is
  // const accounts = useMemo(() => {
  //   if (!sessionUser?.account) return [];
  //   return sessionUser.account;
  // }, [sessionUser]);

  // Helper to get currency display
  const getCurrencyDisplay = (currencyId) => {
    const currencyMap = {
      1: "KES",
      2: "USD",
      3: "EUR",
      4: "GBP",
      5: "UGX",
      6: "TZS"
    };
    return currencyMap[currencyId] || `ID: ${currencyId}`;
  };

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
      const response = await fetch(`${API_BASE_URL}/api/currencies/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch currencies");
      }

      const currenciesData = Array.isArray(data) ? data : data.results || [];
      setCurrencies(currenciesData);
      
    } catch (error) {
      console.error("Error fetching currencies:", error);
      setCurrencyError(error.message);
    } finally {
      setLoadingCurrencies(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  /* ELIGIBLE ACCOUNTS - NO CURRENCY FILTER */
  const eligibleAccounts = useMemo(() => {
    console.log("All accounts:", accounts);
    const filtered = accounts.filter((acc) => acc?.status === "ACTIVE");
    console.log("Active accounts:", filtered);
    return filtered;
  }, [accounts]);

  // Calculate exchange rate when both currencies are selected
  useEffect(() => {
    if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
      const targetCurrency = currencies.find(c => c.code === toCurrency);
      
      if (targetCurrency) {
        const numAmount = Number(amount) || 0;
        
        if (fromCurrency === "KES") {
          const rate = Number(targetCurrency.buy_rate) || 0;
          setExchangeRate(rate);
          const charge = numAmount * 0.01;
          setFxCharge(charge);
          const converted = rate > 0 ? numAmount / rate : 0;
          setConvertedAmount(converted);
          setTotalDebit(numAmount + charge);
        }
        else if (toCurrency === "KES") {
          const rate = Number(targetCurrency.sell_rate) || 0;
          setExchangeRate(rate);
          const charge = numAmount * 0.01;
          setFxCharge(charge);
          const converted = numAmount * rate;
          setConvertedAmount(converted);
          setTotalDebit(numAmount);
        }
        else {
          const fromCurrencyData = currencies.find(c => c.code === fromCurrency);
          const toCurrencyData = currencies.find(c => c.code === toCurrency);
          
          if (fromCurrencyData && toCurrencyData) {
            const rate = (toCurrencyData.sell_rate / fromCurrencyData.buy_rate) || 1.5;
            setExchangeRate(rate);
            const charge = numAmount * 0.015;
            setFxCharge(charge);
            const converted = numAmount * rate;
            setConvertedAmount(converted);
            setTotalDebit(numAmount + charge);
          }
        }
      }
    } else {
      setExchangeRate(null);
      setFxCharge(0);
      setConvertedAmount(0);
      setTotalDebit(0);
    }
  }, [fromCurrency, toCurrency, amount, currencies]);

  /* VALIDATION */
  const validate = () => {
    const errs = {};
    if (!fromAccount) errs.fromAccount = "Please select source account";
    if (!toAccountNumber) errs.toAccountNumber = "Please enter destination account number";
    if (!selectedBranch) errs.branch = "Please select a branch";
    if (!fromCurrency) errs.fromCurrency = "Please select from currency";
    if (!toCurrency) errs.toCurrency = "Please select to currency";
    if (fromCurrency === toCurrency) errs.toCurrency = "From and To currencies cannot be same";
    
    const num = Number(amount);
    if (isNaN(num) || num <= 0) errs.amount = "Enter valid amount";
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  
  console.log("res", customer?.user_id || sessionUser?.user_id,
          "service fee", serviceFee,
          "branch", selectedBranch);
          
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);
    
    try {
      const payload = {
        account_number: fromAccount.account_number,
        beneficiary_account_number: toAccountNumber,
        beneficiary_name: toAccountName || null,
        beneficiary_bank: toBankName || null,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        amount: Number(amount),
        exchange_rate: exchangeRate,
        fx_charge: fxCharge,
        converted_amount: convertedAmount,
        total_debit: totalDebit,
        branch: selectedBranch,
        reference: reference || null,
        narration: narration || null,
        // Add customer/user info if needed by backend
        customer_id: customer?.id || sessionUser?.id,
        user_id: sessionUser?.user_id,
      };
      
      console.log("Submitting FX Transfer:", payload);

      // Using the singular endpoint as requested
      const response = await fetch(`${API_BASE_URL}/api/fx-transfer/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add authorization header if your API requires it
          // "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
        },

        body: JSON.stringify({
          from_account_number: fromAccount.account_number,
          beneficiary_account_number: toAccountNumber,
          beneficiary_name: toAccountName,
          beneficiary_bank: toBankName,
          from_currency: fromCurrency,
          to_currency: toCurrency,
          amount: Number(amount),
          exchange_rate: exchangeRate,
          fx_charge: fxCharge,
          converted_amount: convertedAmount,
          total_debit: totalDebit,
          branch: selectedBranch,
          reference,
          narration,
          user_id: customer?.user_id || sessionUser?.user_id,
          service_amount: serviceFee,
        }),

      });

      const data = await response.json();
      console.log("FX Transfer Response:", data);

      if (!response.ok) {
        // Handle different error status codes
        if (response.status === 400) {
          // Validation errors
          const errorMessage = data.message || data.error || "Please check your input";
          setApiError(errorMessage);
          alert(errorMessage);
        } else if (response.status === 401) {
          // Unauthorized
          alert("Session expired. Please login again");
          navigate("/");
        } else if (response.status === 404) {
          // Endpoint not found
          alert("API endpoint not found. Please check the URL configuration.");
        } else {
          alert(data.message || data.error || "Transaction failed");
        }
        setIsSubmitting(false);
        return;
      }

      // Store transaction ID from response if available
      if (data.id || data.transaction_id) {
        setTransactionId(data.id || data.transaction_id);
      }

      // Move to validation step
      setStep(2);
    } catch (error) {
      console.error("Error submitting FX transfer:", error);
      setApiError(error.message);
      alert("Server error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-advance from validation to review
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => setStep(3), 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleFinish = async () => {
    setLoading(true);
    // Simulate final processing
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    alert("FX Transfer Successful");
    
    if (onComplete) {
      onComplete({
        transactionId,
        fromAccount: fromAccount?.account_number,
        toAccount: toAccountNumber,
        amount,
        fromCurrency,
        toCurrency,
        convertedAmount,
      });
    }
  };

  const safeToFixed = (value, digits = 2) => {
    if (value === null || value === undefined || isNaN(value)) return "0.00";
    return Number(value).toFixed(digits);
  };

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

      {/* Header */}
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
              Step {step} of {STEPS.length}: {STEPS[step - 1].name}
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
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
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
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-1 transition-colors ${
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
                    {customer?.user_id || sessionUser?.user_id}
                  </p>
                </div>
              </div>

              {/* API Error Display */}
              {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium">Error: {apiError}</p>
                </div>
              )}

              {/* Form Card */}
              <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
                {/* From Account Selection - ALL ACCOUNTS SHOWN */}
                <div className="space-y-2">
                  <Label>From Account (Source) *</Label>
                  <Select
                    value={fromAccount?.account_number || ""}
                    onValueChange={(val) => {
                      const acc = eligibleAccounts.find((a) => a.account_number === val);
                      setFromAccount(acc);
                    }}
                  >
                    <SelectTrigger className={errors.fromAccount ? "border-destructive" : ""}>
                      <SelectValue placeholder="Choose source account" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleAccounts.length > 0 ? (
                        eligibleAccounts.map((acc) => (
                          <SelectItem key={acc.account_number} value={acc.account_number}>
                            <div className="flex flex-col">
                              <span>{acc.account_number}</span>
                              <span className="text-xs text-muted-foreground">
                                Balance: {getCurrencyDisplay(acc.currency)} {Number(acc.balance).toLocaleString()}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No active accounts found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.fromAccount && <p className="text-xs text-destructive">{errors.fromAccount}</p>}
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* To Account Details */}
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

                {/* Branch Selection - Always visible */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Select Branch *
                  </Label>
                  <Select 
                    value={selectedBranch} 
                    onValueChange={(value) => {
                      setSelectedBranch(value);
                      setErrors(prev => ({...prev, branch: ""}));
                    }}
                  >
                    <SelectTrigger className={errors.branch ? "border-destructive" : ""}>
                      <SelectValue placeholder="Choose a branch" />
                    </SelectTrigger>
                      <SelectContent>
  {BRANCH_OPTIONS.map((branch) => (
    <SelectItem key={branch.value} value={branch.value}>
      {branch.label} • {branch.value}
    </SelectItem>
  ))}
</SelectContent>
                  </Select>
                  {errors.branch && (
                    <p className="text-xs text-destructive">{errors.branch}</p>
                  )}
                </div>

                {/* Currency Selection */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-2">
                    <Label>From Currency</Label>
                    <Select
                      value={fromCurrency}
                      onValueChange={setFromCurrency}
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
                        {currencies.filter(c => c.code !== fromCurrency).map((currency) => (
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
                    placeholder={`Enter amount`}
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
              <h3 className="font-semibold text-lg">Validating FX Transfer...</h3>
              <p className="text-sm text-muted-foreground">Checking exchange rates and account limits</p>
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

              {transactionId && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm">
                  Transaction ID: <span className="font-mono font-medium">{transactionId}</span>
                </div>
              )}

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
                    { l: "Branch", v: BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch },
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
                <Eye className="h-5 w-5" />
                <span className="text-sm font-medium">Customer Verification</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Please verify customer identity and confirm FX transfer details.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600 font-mono space-y-2">
                  <div>ID: {customer?.id_number || sessionUser?.id_number || "N/A"}</div>
                  <div>Branch: {BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}</div>
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

          {/* STEP 5: VERIFICATION with QR Code */}
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
              <h3 className="text-xl font-semibold">Request Complete</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Your statement request has been processed successfully.
              </p>
              {/* <div className="flex justify-center">
                <img src={qr} alt="AIDA" className="h-64 w-64 object-cover" />
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Scan QR Code</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Scan this QR code to complete your FX transfer.
                </p>
              </div> */}

              <Button
                onClick={handleFinish}
                disabled={loading}
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
              >
                {loading ? "Processing..." : "Complete Transaction"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};