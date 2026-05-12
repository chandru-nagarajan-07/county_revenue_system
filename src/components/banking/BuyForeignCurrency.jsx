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
  AlertCircle,
  Shield,
  Eye,
  ThumbsUp,
  Receipt,
  Loader2,
  RefreshCw,
  MapPin,
} from "lucide-react";

const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
];



export const BuyForeignCurrency = ({
  customer: propCustomer,
  onBack,
  onComplete,
  formFields,
}) => {
  const navigate = useNavigate();
  /* SESSION USER */
  const sessionUser = JSON.parse(sessionStorage.getItem("userData1") || "{}");
  const accounts = sessionUser?.account || [];
  // const branches = sessionUser?.branch || [];
  // const BRANCH_OPTIONS = useMemo(() => {
  //   return branches.map((b) => ({
  //     value: b.branch_id,
  //     label: b.branch_name,
  //   }));
  // }, [branches]);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [customer, setCustomer] = useState(null);

  const [step, setStep] = useState(1);
  const serviceFee = useMemo(() => {
    return formFields?.[0]?.service_type?.service_fee || 0;
  }, [formFields]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");
  // const [selectedBranch, setSelectedBranch] = useState("");
  
  // New state for currency exchange
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [currencyError, setCurrencyError] = useState(null);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  /* SESSION USER */
  // const sessionUser = JSON.parse(sessionStorage.getItem("userData1") || "{}");
  // const accounts = sessionUser?.account || [];

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
      
      // If there's a default currency (e.g., USD), select it
      const defaultCurrency = data.find(c => c.code === "USD") || data[0];
      if (defaultCurrency) {
        setSelectedCurrency(defaultCurrency);
        // Store the buy_rate (how many KES for 1 unit of foreign currency)
        setExchangeRate(defaultCurrency.buy_rate);
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
        // CORRECTED: When buying foreign currency with KES:
        // Customer gives KES, receives foreign currency
        // Formula: Foreign Amount = KES Amount ÷ Buy Rate
        // Example: 100 KES ÷ 80 = 1.25 USD
        
        const foreignAmount = numAmount / exchangeRate;
        setConvertedAmount(foreignAmount.toFixed(2));
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
      setExchangeRate(currency.buy_rate);
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
    // if (!selectedBranch) errs.branch = "Please select a branch";
    const num = Number(amount);
    if (isNaN(num) || num <= 0) errs.amount = "Enter valid amount";
    
    // Check if account has sufficient balance
    if (selectedAccount && Number(selectedAccount.balance) < num) {
      errs.amount = "Insufficient balance";
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  
  console.log("res", customer?.user_id || sessionUser?.user_id,
          "service fee", serviceFee,
         );
          
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Post the foreign currency purchase transaction
      const response = await fetch("http://127.0.0.1:8000/api/fx-buy/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_number: selectedAccount.account_number,
          amount: Number(amount),
          source_currency: "KES",
          target_currency: selectedCurrency.code,
          exchange_rate: exchangeRate, // This is the buy_rate (KES per 1 foreign currency)
          exchange_rate_type: "buy_rate",
          kes_equivalent: Number(convertedAmount),
          // branch: selectedBranch,
          reference,
          narration,
          user_id: customer?.user_id || sessionUser?.user_id,
          service_amount: serviceFee,
          // branch: selectedBranch,
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
    setLoading(true);
    // Simulate final processing
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    alert("Foreign Currency Purchase requested successfully!");
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
              Buy Foreign Currency
            </h1>
            <p className="text-xs text-gray-500">
              Step {step} of {STEPS.length}: {STEPS[step - 1].name}
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
                    <Label>Select Currency to Buy *</Label>
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
                        <SelectValue placeholder="Choose currency to buy" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name} (1 {currency.code} = {currency.buy_rate} KES)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.currency && <p className="text-xs text-destructive">{errors.currency}</p>}
                </div>

                {/* Account Selection */}
                <div className="space-y-2">
                  <Label>Select Account to Debit (KES) *</Label>
                  <Select
                    value={selectedAccount?.account_number || ""}
                    onValueChange={(val) => {
                      const acc = eligibleAccounts.find((a) => a.account_number === val);
                      setSelectedAccount(acc);
                    }}
                  >
                    <SelectTrigger className={errors.account ? "border-destructive" : ""}>
                      <SelectValue placeholder="Choose account to debit" />
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

                {/* Branch Selection - Always visible */}
                {/* <div className="space-y-2">
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
                </div> */}

                {/* Amount in KES */}
                <div className="space-y-2">
                  <Label>Amount in KES *</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount in KES"
                    className={errors.amount ? "border-destructive" : ""}
                  />
                  {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                </div>

                {/* Converted Amount Display using buy_rate */}
                {convertedAmount && selectedCurrency && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm text-blue-700 font-medium">You will receive:</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {selectedCurrency.symbol || selectedCurrency.code} {Number(convertedAmount).toLocaleString()}
                    </p>
                    <div className="text-xs text-blue-600 space-y-1">
                      <p>
                        {amount} KES ÷ {exchangeRate} = {convertedAmount} {selectedCurrency.code}
                      </p>
                      <p className="text-gray-500">
                        1 {selectedCurrency.code} = {exchangeRate} KES
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
              <p className="text-sm text-muted-foreground">Checking account status and exchange rates</p>
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
                  Purchase Summary
                </h4>

                <div className="space-y-0">
                  {[
                    { l: "Debit Account (KES)", v: selectedAccount?.account_number },
                    { l: "You Pay", v: `KES ${Number(amount).toLocaleString()}` },
                    { l: "Currency to Buy", v: selectedCurrency?.code },
                    { l: "Exchange Rate", v: `1 ${selectedCurrency?.code} = ${exchangeRate} KES` },
                    { l: "You Receive", v: `${selectedCurrency?.code} ${Number(convertedAmount).toLocaleString()}` },
                    // { l: "Branch", v: BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch },
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
                <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600 font-mono space-y-2">
                  <div>ID: {customer?.id_number || sessionUser?.id_number || "N/A"}</div>
                  {/* <div>Branch: {BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}</div> */}
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

          {/* ========== STEP 5: VERIFICATION with QR Code ========== */}
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
                  Scan this QR code to complete your foreign currency purchase.
                </p>
              </div> */}

              <div className="rounded-xl border bg-white p-5 shadow-sm text-left space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Transaction Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-medium">KES {Number(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Currency Received</span>
                    <span className="font-medium">{selectedCurrency?.code} {Number(convertedAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Exchange Rate</span>
                    <span className="font-medium">1 {selectedCurrency?.code} = {exchangeRate} KES</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleFinish}
                disabled={loading}
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
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