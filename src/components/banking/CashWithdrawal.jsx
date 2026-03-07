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
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { DashboardHeader } from "@/components/banking/DashboardHeader";

const STEPS = [
  "Input",
  "Validate",
  "Review",
  "Process",
  "Approve",
  "Complete",
];

export const CashWithdrawalWorkflow = ({
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

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [officerNotes, setOfficerNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(null);

  /* ---------------- SESSION USER ACCOUNTS ---------------- */

  const sessionUser = JSON.parse(
    sessionStorage.getItem("userData1") || "{}"
  );

  const accounts = sessionUser?.account || [];

  /* ---------------- CUSTOMER INIT ---------------- */

  useEffect(() => {

    if (propCustomer) {
      setCustomer(propCustomer);
      return;
    }

    try {
      const sessionData = sessionStorage.getItem("customer");
      if (sessionData) setCustomer(JSON.parse(sessionData));
    } catch (e) {
      console.error("Customer session parse error", e);
    }

  }, [propCustomer]);

  /* ---------------- ACCOUNTS FROM SESSION ---------------- */

  const eligibleAccounts = useMemo(() => {

    return accounts.filter(
      acc => acc?.status === "ACTIVE"
    );

  }, [accounts]);

  const getCustomerId = () => {
    if (!customer) return null;
    return (
      customer.id ||
      customer.customer_id ||
      customer.customerId ||
      customer.user_id
    );
  };

  /* ---------------- VALIDATION ---------------- */

  const validate = () => {

    const errs = {};

    if (!selectedAccount)
      errs.account = "Please select account";

    const num = Number(amount);

    if (isNaN(num) || num <= 0)
      errs.amount = "Enter valid amount";

    setErrors(errs);

    return Object.keys(errs).length === 0;

  };

  const handleInputSubmit = async () => {
  if (!validate()) return;

  try {
    const response = await fetch("http://127.0.0.1:8000/api/cash-withdrawals/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_number: selectedAccount.account_number,
        amount: Number(amount),
        reference,
        narration,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "OTP verification failed");
      return;
    }

    setStep(2);
  } catch (error) {
    console.error(error);
  }
};

  /* ---------------- FINAL SUBMIT ---------------- */

  const handleFinalSubmit = async () => {

    setIsSubmitting(true);

    const payload = {
      customer: getCustomerId(),
      account_number: selectedAccount.account_number,
      amount: Number(amount),
      reference,
      narration,
      officer_notes: officerNotes,
      rating,
      status: "APPROVED",
    };

    console.log("Withdrawal Payload:", payload);

    await new Promise(r => setTimeout(r,1500));

    alert("Transaction Completed");

    if (onComplete)
      onComplete();

    setIsSubmitting(false);

  };

  /* ---------------- RATING ---------------- */

  const renderStars = () => {

    return [1,2,3,4,5].map(star => (

      <button
        key={star}
        onClick={()=>setRating(star)}
        type="button"
        className={`text-2xl ${
          star <= rating
            ? "text-yellow-400"
            : "text-gray-300"
        }`}
      >
        ★
      </button>

    ));

  };

  if (!customer) {

    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl text-center">
          Customer Data Missing
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );

  }

  return (

    <div className="min-h-screen bg-gray-50 flex flex-col">

      <DashboardHeader
        customerName={customer?.fullName || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={()=>{
          localStorage.removeItem("customer");
          navigate("/");
        }}
      />

      {/* HEADER */}

      <div className="bg-white border-b sticky top-0 z-20">

        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">

          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5"/>
          </Button>

          <div>

            <h1 className="text-xl font-bold">
              Cash Withdrawal
            </h1>

            <p className="text-sm text-gray-500">
              Service Workflow
            </p>

          </div>

        </div>

      </div>

      {/* MAIN */}

      <div className="flex-1 px-4 md:px-6 py-8 max-w-5xl mx-auto w-full">

        {/* STEP BAR */}

        <div className="mb-8 flex justify-between">

          {STEPS.map((label,i)=>{

            const number = i+1;

            const active = step===number;
            const completed = step>number;

            return(

              <div key={label} className="flex flex-col items-center">

                <div className={`w-8 h-8 rounded-full border flex items-center justify-center
                  ${completed
                    ? "bg-blue-600 text-white"
                    : active
                    ? "border-blue-600 text-blue-600"
                    : "border-gray-300 text-gray-400"}
                `}>

                  {completed
                    ? <CheckCircle2 className="w-5 h-5"/>
                    : number}

                </div>

                <span className="text-xs mt-1">
                  {label}
                </span>

              </div>

            );

          })}

        </div>

        {/* CUSTOMER CARD */}

        <div className="bg-white rounded-xl border p-4 mb-6 flex items-center gap-4">

          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">

            {(customer.fullName || "U")
              .split(" ")
              .map(n=>n[0])
              .join("")
              .slice(0,2)}

          </div>

          <div>

            <p className="text-sm font-semibold">
              {customer.fullName}
            </p>

            <p className="text-xs text-gray-500">
              {customer.customerId} • {customer.phone}
            </p>

          </div>

        </div>

        {/* STEP 1 */}

        {step===1 && (

          <div className="bg-white border rounded-xl shadow-sm p-6 space-y-5">

            <div className="space-y-2">

              <Label>Select Account *</Label>

              <Select
                value={selectedAccount?.account_number || ""}
                onValueChange={(val)=>{

                  const acc =
                    eligibleAccounts.find(
                      a => a.account_number===val
                    );

                  setSelectedAccount(acc);

                  setErrors(prev=>({
                    ...prev,
                    account:null
                  }));

                }}
              >

                <SelectTrigger>
                  <SelectValue placeholder="Choose account"/>
                </SelectTrigger>

                <SelectContent>

                  {eligibleAccounts.map(acc => (

                    <SelectItem
                      key={acc.account_number}
                      value={acc.account_number}
                    >

                      {acc.account_number} • {acc.balance}

                    </SelectItem>

                  ))}

                </SelectContent>

              </Select>

              {errors.account &&
                <p className="text-xs text-red-500">
                  {errors.account}
                </p>
              }

            </div>

            <div className="space-y-2">

              <Label>Amount *</Label>

              <Input
                type="number"
                value={amount}
                onChange={(e)=>{

                  setAmount(e.target.value);

                  setErrors(prev=>({
                    ...prev,
                    amount:null
                  }));

                }}
                placeholder="0.00"
              />

              {errors.amount &&
                <p className="text-xs text-red-500">
                  {errors.amount}
                </p>
              }

            </div>

            <div className="space-y-2">

              <Label>Reference</Label>

              <Input
                value={reference}
                onChange={(e)=>setReference(e.target.value)}
                placeholder="Enter reference"
              />

            </div>

            <div className="space-y-2">

              <Label>Narration</Label>

              <Input
                value={narration}
                onChange={(e)=>setNarration(e.target.value)}
                placeholder="Enter narration"
              />

            </div>

            <Button
              onClick={handleInputSubmit}
              className="w-full bg-blue-600"
            >
              Submit for Validation
            </Button>

          </div>

        )}

        {/* STEP 2 */}

        {step===2 && (

          <div className="text-center py-16">

            <Loader2 className="animate-spin mx-auto mb-4"/>

            Validating Transaction...

            {setTimeout(()=>setStep(3),1500)}

          </div>

        )}

        {/* STEP 3 */}

        {step===3 && (

          <div className="bg-white p-6 rounded-xl border">

            <p>Account: {selectedAccount?.account_number}</p>

            <p>Amount: {amount}</p>

            <Button
              className="w-full mt-4"
              onClick={()=>setStep(4)}
            >
              Proceed
            </Button>

          </div>

        )}

      </div>

    </div>

  );

};