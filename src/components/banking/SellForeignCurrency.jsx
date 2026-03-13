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
} from "lucide-react";

const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Complete" },
];

export const SellForeignCurrency = ({
  customer: propCustomer,
  onBack,
  onComplete,
}) => {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [customer, setCustomer] = useState(null);

  const [step, setStep] = useState(1);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");
  
  // New state for currency exchange
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState(null);
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
      
      // If there's a default currency (e.g., USD), select it using sell_rate
      const defaultCurrency = data.find(c => c.code === "USD") || data[0];
      if (defaultCurrency) {
        setSelectedCurrency(defaultCurrency);
        // Use sell_rate for exchange rate when selling foreign currency
        setExchangeRate(defaultCurrency.sell_rate);
      }
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

  // Calculate converted amount when amount or exchange rate changes
  useEffect(() => {
    if (amount && exchangeRate && selectedCurrency) {
      const numAmount = Number(amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        // CORRECTED: When selling foreign currency:
        // Customer gives FOREIGN CURRENCY (e.g., 100 EURO)
        // Bank buys at SELL RATE (e.g., 1 EURO = 102 KES)
        // Customer receives: FOREIGN AMOUNT × SELL RATE = KES
        // Example: 100 EURO × 102 = 10,200 KES
        setConvertedAmount((numAmount * exchangeRate).toFixed(2));
      } else {
        setConvertedAmount(null);
      }
    } else {
      setConvertedAmount(null);
    }
  }, [amount, exchangeRate, selectedCurrency]);

  // Handle currency selection
  const handleCurrencyChange = (currencyCode) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (currency) {
      setSelectedCurrency(currency);
      // Use sell_rate for exchange rate when selling
      setExchangeRate(currency.sell_rate);
    }
  };

  /* ELIGIBLE ACCOUNTS */
  const eligibleAccounts = useMemo(() => {
    return accounts.filter((acc) => acc?.status === "ACTIVE");
  }, [accounts]);

  /* VALIDATION */
  const validate = () => {
    const errs = {};
    if (!selectedAccount) errs.account = "Please select account";
    if (!selectedCurrency) errs.currency = "Please select currency";
    const num = Number(amount);
    if (isNaN(num) || num <= 0) errs.amount = "Enter valid amount";
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Post the foreign currency sale transaction
      const response = await fetch("http://127.0.0.1:8000/api/fx-sell/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_number: selectedAccount.account_number,
          amount: Number(amount),
          foreign_currency: selectedCurrency.code,
          exchange_rate: exchangeRate, // This is the sell_rate
          exchange_rate_type: "sell_rate",
          kes_equivalent: Number(convertedAmount), // Amount in KES received
          reference,
          narration,
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
    alert("Foreign Currency Sale Successful");
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

      {/* Sticky Header with Back Button & Stepper */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
              Sell Foreign Currency
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
                {/* Currency Selection with Refresh Button */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Select Currency to Sell *</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchCurrencies}
                      disabled={loadingCurrencies}
                      className="h-8 px-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingCurrencies ? 'animate-spin' : ''}`} />
                      <span className="ml-1 text-xs">Refresh</span>
                    </Button>
                  </div>
                  
                  {loadingCurrencies ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading currencies...</span>
                    </div>
                  ) : currencyError ? (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      {currencyError}
                    </div>
                  ) : (
                    <Select
                      value={selectedCurrency?.code || ""}
                      onValueChange={handleCurrencyChange}
                    >
                      <SelectTrigger className={errors.currency ? "border-destructive" : ""}>
                        <SelectValue placeholder="Choose currency to sell" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name} (Bank buys at: {currency.sell_rate} KES)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.currency && <p className="text-xs text-destructive">{errors.currency}</p>}
                </div>

                {/* Account Selection */}
                <div className="space-y-2">
                  <Label>Select Account for KES Deposit *</Label>
                  <Select
                    value={selectedAccount?.account_number || ""}
                    onValueChange={(val) => {
                      const acc = eligibleAccounts.find((a) => a.account_number === val);
                      setSelectedAccount(acc);
                    }}
                  >
                    <SelectTrigger className={errors.account ? "border-destructive" : ""}>
                      <SelectValue placeholder="Choose account to credit" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleAccounts.map((acc) => (
                        <SelectItem key={acc.account_number} value={acc.account_number}>
                          {acc.account_number} • {acc.currency || "KES"} {acc.balance?.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.account && <p className="text-xs text-destructive">{errors.account}</p>}
                </div>

                {/* Amount in Foreign Currency */}
                <div className="space-y-2">
                  <Label>Amount in {selectedCurrency?.code || "Foreign Currency"} *</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Enter amount in ${selectedCurrency?.code || "FC"}`}
                    className={errors.amount ? "border-destructive" : ""}
                  />
                  {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                </div>

                {/* Converted Amount Display using sell_rate */}
                {convertedAmount && selectedCurrency && (
                  <div className="bg-green-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-green-700 font-medium">You will receive:</p>
                    <p className="text-2xl font-bold text-green-800">
                      KES {Number(convertedAmount).toLocaleString()}
                    </p>
                    <div className="text-xs text-green-600 space-y-1">
                      <p>
                        {amount} {selectedCurrency.code} × {exchangeRate} = {Number(convertedAmount).toLocaleString()} KES
                      </p>
                      <p className="text-gray-500">
                        Bank buys 1 {selectedCurrency.code} at {exchangeRate} KES
                      </p>
                    </div>
                  </div>
                )}

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
                disabled={isSubmitting || loadingCurrencies || !convertedAmount}
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
              <h3 className="font-semibold text-lg">Validating Transaction...</h3>
              <p className="text-sm text-muted-foreground">Checking foreign currency balance and rates</p>
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
                  Sale Summary
                </h4>

                <div className="space-y-0">
                  {[
                    { l: "Credit Account (KES)", v: selectedAccount?.account_number },
                    { l: "Currency Sold", v: selectedCurrency?.code },
                    { l: "Amount Sold", v: `${selectedCurrency?.code} ${Number(amount).toLocaleString()}` },
                    { l: "Exchange Rate", v: `1 ${selectedCurrency?.code} = ${exchangeRate} KES` },
                    { l: "You Receive", v: `KES ${Number(convertedAmount).toLocaleString()}` },
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
                  Please verify customer identity and confirm transaction details.
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
                This transaction requires supervisor approval to be completed.
              </p>

              <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-6 space-y-4 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">FCS-{Date.now().toString().slice(-8)}</span>
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
                Authorize Transaction
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

              <h3 className="text-xl font-semibold">Sale Successful</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                You have successfully sold {selectedCurrency?.code} {Number(amount).toLocaleString()}
              </p>

              <div className="rounded-xl border bg-white p-6 shadow-sm text-left space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount Sold</span>
                  <span className="font-medium">{selectedCurrency?.code} {Number(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Rate Applied</span>
                  <span className="font-medium">{exchangeRate} KES per {selectedCurrency?.code}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-500">KES Received</span>
                  <span className="font-bold text-primary">KES {Number(convertedAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">New KES Balance</span>
                  <span className="font-bold text-primary">
                    KES {(Number(selectedAccount?.balance || 0) + Number(convertedAmount)).toLocaleString()}
                  </span>
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