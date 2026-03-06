import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Bot,
  Landmark,
  Wallet,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { DashboardHeader } from "@/components/banking/DashboardHeader";
import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from "@/data/demoCustomers";

const STEPS = [
  "Input",
  "Validate",
  "Review",
  "Process",
  "Approve",
  "Complete",
];

export const CashDepositWorkflow = ({
  customer: propCustomer,
  onBack,
  onComplete,
}) => {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState(null);

  // Form State
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");
  const [errors, setErrors] = useState({});
  
  // Review/Feedback State
  const [officerNotes, setOfficerNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(null);

  // Initialize customer
  useEffect(() => {
    if (propCustomer) {
      setCustomer(propCustomer);
      return;
    }
    try {
      const sessionData = sessionStorage.getItem("customer");
      if (sessionData) setCustomer(JSON.parse(sessionData));
    } catch (e) {
      console.error("Error parsing session customer:", e);
    }
  }, [propCustomer]);

  // Get Eligible Accounts for Deposit
  const eligibleAccounts = useMemo(() => {
    if (!customer) return [];
    try {
      // Assuming "cash-deposit" type or similar logic
      return getEligibleAccounts(customer, "cash-deposit") || [];
    } catch {
      return [];
    }
  }, [customer]);

  const getCustomerId = () => {
    if (!customer) return null;
    return (
      customer.id ||
      customer.customer_id ||
      customer.customerId ||
      customer.user_id
    );
  };

  // Validation Logic
  const validate = () => {
    const errs = {};
    if (!selectedAccount) {
      errs.account = "Please select an account to credit";
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      errs.amount = "Enter a valid positive amount";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step Handlers
  const handleInputSubmit = () => {
    if (validate()) {
      setStep(2);
    }
  };

  const handleFinalSubmit = async () => {
    if (!customer) return;
    
    setIsSubmitting(true);
    const customerId = getCustomerId();

    try {
      // Simulate API call
      const payload = {
        customer: customerId,
        account_number: selectedAccount.accountNumber,
        amount: Number(amount),
        reference,
        narration,
        officer_notes: officerNotes,
        rating: rating,
        status: "APPROVED",
      };

      console.log("Submitting Cash Deposit:", payload);

      // Mock API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // const response = await fetch("http://127.0.0.1:8000/api/cash-deposit/", { ... });
      
      setTransactionId(`TXN-${Date.now()}`);
      alert("Transaction completed successfully!");
      if (onComplete) onComplete();
      
    } catch (error) {
      console.error("Deposit Error:", error);
      alert("Transaction failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={() => setRating(star)}
        type="button"
        className={`text-2xl transition-colors ${
          star <= rating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"
        }`}
      >
        ★
      </button>
    ));
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Customer Data Missing</h2>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

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

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Cash Deposit</h1>
              <p className="text-sm text-gray-500">Service Workflow</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 md:px-6 py-8 max-w-5xl mx-auto w-full">
        
        {/* Step Indicator */}
        <div className="mb-8 px-2">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" style={{ marginLeft: '2rem', marginRight: '2rem' }} />
            <div 
              className="absolute top-4 left-0 h-0.5 bg-blue-600 transition-all duration-500" 
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%`, marginLeft: '2rem' }} 
            />
            {STEPS.map((label, index) => {
              const number = index + 1;
              const active = step === number;
              const completed = step > number;
              return (
                <div key={label} className="flex flex-col items-center relative z-10 w-16 md:w-24">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
                    completed ? "bg-blue-600 border-blue-600 text-white" :
                    active ? "bg-white border-blue-600 text-blue-600 ring-4 ring-blue-100" :
                    "bg-white border-gray-300 text-gray-400"
                  }`}>
                    {completed ? <CheckCircle2 className="w-5 h-5" /> : number}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${active || completed ? 'text-blue-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-blue-600">
            {(customer.fullName || customer.name || "U").split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold">{customer.fullName || customer.name}</p>
            <p className="text-xs text-muted-foreground">{customer.customerId || customer.user_id} • {customer.phone || customer.email}</p>
          </div>
        </div>

        {/* STEP 1 - INPUT */}
        {step === 1 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5">
            <div className="space-y-2">
              <Label>Select Account *</Label>
              <Select
                value={selectedAccount?.accountNumber || ""}
                onValueChange={(val) => {
                  const acc = eligibleAccounts.find(a => a.accountNumber === val) || null;
                  setSelectedAccount(acc);
                  setErrors(prev => ({...prev, account: null}));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose account to deposit into" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleAccounts.map(acc => (
                    <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                      {acc.accountNumber} • {ACCOUNT_TYPE_LABELS?.[acc.type] || acc.type} • {acc.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.account && <p className="text-xs text-destructive">{errors.account}</p>}
            </div>

            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors(prev => ({...prev, amount: null}));
                }}
                placeholder="0.00"
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>

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

            <Button onClick={handleInputSubmit} className="w-full bg-blue-600 hover:bg-blue-700">
              Submit for Validation
            </Button>
          </div>
        )}

        {/* STEP 2 - VALIDATE */}
        {step === 2 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-green-50 border-b border-green-100 p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900 text-sm">Validation Passed</h3>
                <p className="text-xs text-green-700">Ready for review</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Credit Account</span>
                <span className="text-sm font-medium text-gray-800">{selectedAccount?.accountNumber}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-sm font-bold text-blue-600">{Number(amount).toLocaleString()} {selectedAccount?.currency}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Reference</span>
                <span className="text-sm font-medium text-gray-800">{reference || "N/A"}</span>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200">
              <Button onClick={() => setStep(3)} className="w-full bg-yellow-500 hover:bg-yellow-600">
                Proceed to Review
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 - REVIEW (Loading) */}
        {step === 3 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800">Reviewing Transaction</h2>
            <p className="text-sm text-gray-500 mt-2">System checks in progress...</p>
            {setTimeout(() => setStep(4), 2000) && null}
          </div>
        )}

        {/* STEP 4 - PROCESS / VERIFY */}
        {step === 4 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-yellow-50 border-b border-yellow-100 p-4 text-center">
              <span className="text-yellow-700 text-sm font-medium">⚠️ Customer verification required</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                <span className="text-gray-500">Depositor</span>
                <span className="font-medium">{customer.fullName || customer.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                <span className="text-gray-500">Target Account</span>
                <span className="font-medium">{selectedAccount?.accountNumber}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-green-600">{Number(amount).toLocaleString()}</span>
              </div>
            </div>
            <div className="p-6 flex gap-3 border-t border-gray-200 bg-gray-50">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(5)} className="flex-1 bg-green-600 hover:bg-green-700">Confirm & Verify</Button>
            </div>
          </div>
        )}

        {/* STEP 5 - APPROVE (Supervisor) */}
        {step === 5 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden text-center p-8">
            <div className="inline-block p-4 bg-purple-100 rounded-full mb-4 mx-auto">
              <Bot className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Awaiting Authorization</h2>
            <p className="text-sm text-gray-500 mb-6">Supervisor approval is required</p>
            <Button onClick={() => setStep(6)} className="w-full bg-purple-600 hover:bg-purple-700">
              Authorize Transaction
            </Button>
          </div>
        )}

        {/* STEP 6 - COMPLETE (Success & Feedback) */}
        {step === 6 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-green-50 p-8 text-center border-b border-green-100">
              <div className="inline-block p-3 bg-green-100 rounded-full mb-4 ring-4 ring-green-50">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-green-800 mb-1">Deposit Successful!</h2>
              <p className="text-sm text-green-600">The funds have been credited to the account.</p>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="font-semibold mb-2">Rate your experience</h3>
                <div className="flex justify-center gap-1">{renderStars()}</div>
              </div>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Additional comments (optional)"
                className="w-full border border-gray-200 rounded-lg p-3 text-sm mb-4"
                rows="3"
              />

              <Button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Completing...</> : "Finish & Submit Feedback"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};