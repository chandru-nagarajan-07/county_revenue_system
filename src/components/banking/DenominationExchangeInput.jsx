import { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Check,
  Shield,
  Eye,
  ThumbsUp
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

import { Slider } from "@/components/ui/slider";

import { inferSegment } from "@/data/serviceCharges";

/* FX PAIRS */

const FX_PAIRS = [
  { code: "USD", label: "US Dollar", midRate: 129.45 },
  { code: "EUR", label: "Euro", midRate: 141.8 },
  { code: "GBP", label: "British Pound", midRate: 164.2 },
];

/* STEPS */

const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Authorization" },
];

export default function DenominationExchange({ customer, onBack }) {

  const navigate = useNavigate();

  /* SESSION USER */

  let sessionUser = {};

  try {
    sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {};
  } catch {
    sessionUser = {};
  }

  const accounts = sessionUser?.account || [];

  /* NAV STATE */

  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  /* WORKFLOW */

  const [step, setStep] = useState(1);

  /* FORM */

  const [direction, setDirection] = useState("BUY");
  const [selectedPair, setSelectedPair] = useState(null);
  const [fcyAmount, setFcyAmount] = useState("");

  const [sourceAccNum, setSourceAccNum] = useState("");
  const [settlementAccNum, setSettlementAccNum] = useState("");

  const [adjustedRate, setAdjustedRate] = useState(null);

  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  /* CUSTOMER SEGMENT */

  const segment = useMemo(() => {

    const safeCustomer = {
      ...customer,
      accounts: accounts
    };

    return inferSegment(safeCustomer);

  }, [customer, accounts]);

  /* ACTIVE ACCOUNTS */

  const activeAccounts = useMemo(() => {

    return accounts.filter(acc => acc?.status === "ACTIVE");

  }, [accounts]);

  /* CALCULATIONS */

  const fcyNum = Number(fcyAmount) || 0;

  const midRate = selectedPair?.midRate || 0;

  const spread = direction === "BUY" ? 0.015 : -0.015;

  const systemOfferedRate = midRate + midRate * spread;

  const finalRate = adjustedRate || systemOfferedRate;

  const kesTotal = fcyNum * finalRate;

  /* VALIDATION */

  const validateForm = () => {

    const errs = {};

    if (!selectedPair)
      errs.currency = "Select currency";

    if (!fcyAmount || fcyNum <= 0)
      errs.amount = "Enter amount";

    if (!sourceAccNum)
      errs.source = "Select source account";

    if (!settlementAccNum)
      errs.settlement = "Select settlement account";

    setFormErrors(errs);

    return Object.keys(errs).length === 0;

  };

  /* STEP 1 SUBMIT */

  const handleStepOneSubmit = async () => {

    if (!validateForm()) return;

    setLoading(true);

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/api/denomination-exchange/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({

            direction: direction,
            currency: selectedPair?.code,
            fcy_amount: Number(fcyAmount),

            source_account: sourceAccNum,
            settlement_account: settlementAccNum,

            mid_rate: midRate,
            system_rate: systemOfferedRate,
            final_rate: finalRate,

            kes_total: kesTotal,
          }),
        }
      );

      const data = await response.json();

      console.log("API RESPONSE:", data);

      if (!response.ok) {

        alert(data.message || "Transaction failed");

        setLoading(false);
        return;

      }

      setStep(2);

    } catch (error) {

      console.error("Error:", error);
      alert("Server error");

    } finally {

      setLoading(false);

    }

  };

  /* AUTO STEP */

  useEffect(() => {

    if (step === 2) {

      const timer = setTimeout(() => setStep(3), 1500);

      return () => clearTimeout(timer);

    }

  }, [step]);

  /* ANIMATION */

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (

    <div className="min-h-screen bg-gray-50 flex flex-col">

      <DashboardHeader
        customerName={customer?.fullName || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => {
          localStorage.removeItem("customer");
          navigate("/");
        }}
      />

      <div className="flex-1 overflow-y-auto p-6">

        <AnimatePresence mode="wait">

{/* STEP 1 */}

{step === 1 && (

<motion.div
key="step1"
variants={pageVariants}
initial="initial"
animate="animate"
exit="exit"
className="space-y-6 max-w-lg mx-auto"
>

{/* BUY SELL */}

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
? "Buy FCY"
: "Sell FCY"}

</p>

</button>

))}

</div>

{/* CURRENCY */}

<div className="space-y-2">

<Label>Currency</Label>

<Select
value={selectedPair?.code || ""}
onValueChange={(val) =>
setSelectedPair(
FX_PAIRS.find(p => p.code === val)
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

{formErrors.currency && (
<p className="text-red-500 text-xs">{formErrors.currency}</p>
)}

</div>

{/* AMOUNT */}

<div className="space-y-2">

<Label>Amount (FCY)</Label>

<Input
type="number"
value={fcyAmount}
onChange={(e) => setFcyAmount(e.target.value)}
/>

{formErrors.amount && (
<p className="text-red-500 text-xs">{formErrors.amount}</p>
)}

</div>

{/* SOURCE ACCOUNT */}

<div className="space-y-2">

<Label>Source Account</Label>

<Select
value={sourceAccNum}
onValueChange={setSourceAccNum}
>

<SelectTrigger>
<SelectValue placeholder="Select account" />
</SelectTrigger>

<SelectContent>

{activeAccounts.map(acc => (

<SelectItem
key={acc.account_number}
value={acc.account_number}
>

{acc.account_number} • {acc.balance}

</SelectItem>

))}

</SelectContent>

</Select>

{formErrors.source && (
<p className="text-red-500 text-xs">{formErrors.source}</p>
)}

</div>

{/* SETTLEMENT ACCOUNT */}

<div className="space-y-2">

<Label>Settlement Account</Label>

<Select
value={settlementAccNum}
onValueChange={setSettlementAccNum}
>

<SelectTrigger>
<SelectValue placeholder="Select account" />
</SelectTrigger>

<SelectContent>

{activeAccounts.map(acc => (

<SelectItem
key={acc.account_number}
value={acc.account_number}
>

{acc.account_number} • {acc.balance}

</SelectItem>

))}

</SelectContent>

</Select>

{formErrors.settlement && (
<p className="text-red-500 text-xs">{formErrors.settlement}</p>
)}

</div>

{/* CALCULATION PREVIEW */}

<div className="bg-muted p-3 rounded-lg text-sm">

<p>Rate: {finalRate.toFixed(4)}</p>
<p>FCY: {fcyNum}</p>
<p>KES Total: {kesTotal.toFixed(2)}</p>

</div>

<Button
onClick={handleStepOneSubmit}
className="w-full"
disabled={loading}
>

{loading ? "Processing..." : "Validate Transaction"}

</Button>

</motion.div>

)}

{/* STEP 2 */}

{step === 2 && (

<div className="flex flex-col items-center py-20">

<Shield className="h-10 w-10 text-blue-600 animate-pulse" />

<p className="mt-4">
Validating Transaction...
</p>

</div>

)}

{/* STEP 3 */}

{step === 3 && (

<div className="max-w-lg mx-auto space-y-4">

<div className="flex items-center gap-2 text-green-600">

<Check className="h-5 w-5" />
Validation Passed

</div>

<Button
onClick={() => setStep(4)}
className="w-full"
>

Proceed

</Button>

</div>

)}

{/* STEP 4 */}

{step === 4 && (

<div className="max-w-lg mx-auto space-y-4">

<Label>Adjust Rate</Label>

<Slider
min={midRate * 0.98 * 10000}
max={midRate * 1.02 * 10000}
step={1}
value={[(adjustedRate || systemOfferedRate) * 10000]}
onValueChange={(val) => {
setAdjustedRate(val[0] / 10000);
}}
/>

<p className="text-sm">Final Rate: {finalRate.toFixed(4)}</p>

<Button
onClick={() => setStep(5)}
className="w-full"
>

Confirm Rate

</Button>

</div>

)}

{/* STEP 5 */}

{step === 5 && (

<div className="max-w-lg mx-auto space-y-4">

<Eye />

<p>Customer Verification</p>

<Button
onClick={() => setStep(6)}
className="w-full"
>

Confirm

</Button>

</div>

)}

{/* STEP 6 */}

{step === 6 && (

<div className="max-w-lg mx-auto text-center space-y-4">

<ThumbsUp className="h-10 w-10 mx-auto" />

<p>Awaiting Authorization</p>

<Button
onClick={() => {

alert("Transaction Completed");
onBack();

}}
>

Authorize

</Button>

</div>

)}

</AnimatePresence>

</div>

</div>

);

}