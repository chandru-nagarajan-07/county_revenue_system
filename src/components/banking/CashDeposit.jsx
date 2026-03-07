import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

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

import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

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

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* SESSION USER */

  const sessionUser = JSON.parse(
    sessionStorage.getItem("userData1") || "{}"
  );

  const accounts = sessionUser?.account || [];

  /* INIT CUSTOMER */

  useEffect(() => {

    if (propCustomer) {
      setCustomer(propCustomer);
      return;
    }

    const sessionCustomer = sessionStorage.getItem("customer");

    if (sessionCustomer)
      setCustomer(JSON.parse(sessionCustomer));

  }, [propCustomer]);

  /* ELIGIBLE ACCOUNTS */

  const eligibleAccounts = useMemo(() => {

    return accounts.filter(
      acc => acc?.status === "ACTIVE"
    );

  }, [accounts]);

  /* VALIDATION */

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
const handleSubmit = async () => {
  if (!validate()) return;

  try {
    const response = await fetch("http://127.0.0.1:8000/api/cash-deposits/", {
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

  const handleFinish = async () => {

    setIsSubmitting(true);

    const payload = {
      account_number: selectedAccount.account_number,
      amount: Number(amount),
      reference,
      narration
    };

    console.log("Deposit Payload:", payload);

    await new Promise(r => setTimeout(r, 1500));

    setIsSubmitting(false);

    alert("Deposit Successful");

    if (onComplete)
      onComplete();

  };

  if (!customer && !sessionUser) {
    console.error("Customer or session user data missing", { customer, sessionUser });
    return (
      <div className="min-h-screen flex items-center justify-center">
        Customer not found
      </div>
    );

  }

  return (

    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* HEADER */}

      <DashboardHeader
        customerName={customer?.fullName || sessionUser?.first_name || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => {
          localStorage.removeItem("customer");
          navigate("/");
        }}
      />

      {/* PAGE */}

      <div className="flex-1 px-4 md:px-6 py-8 max-w-5xl mx-auto w-full">

        {/* TITLE */}

        <div className="flex items-center gap-4 mb-6">

          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5"/>
          </Button>

          <div>
            <h1 className="text-xl font-bold">
              Cash Deposit
            </h1>

            <p className="text-sm text-muted-foreground">
              Service Workflow
            </p>
          </div>

        </div>

        {/* STEP BAR */}

        <div className="flex items-center justify-between mb-8">

          {STEPS.map((label, i) => {

            const number = i + 1;

            return (

              <div key={label} className="flex flex-col items-center">

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    step >= number
                      ? "bg-blue-600 text-white"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {number}
                </div>

                <span className="text-xs mt-1">
                  {label}
                </span>

              </div>

            );

          })}

        </div>

        {/* CUSTOMER CARD */}

        <div className="bg-white rounded-xl border p-4 mb-6 flex items-center gap-3">

          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">

            {(customer?.fullName || sessionUser?.first_name || "C")
              .split(" ")
              .map(n => n[0])
              .join("")
              .slice(0,2)}

          </div>

          <div>

            <p className="text-sm font-semibold">
              {customer?.fullName || sessionUser?.first_name}
            </p>

            <p className="text-xs text-muted-foreground">
              {customer?.user_id || sessionUser?.user_id} • {customer?.phone || sessionUser?.phone}
            </p>

          </div>

        </div>

        {/* STEP 1 */}

        {step === 1 && (

          <div className="bg-white border rounded-xl shadow-sm p-6 space-y-5">

            {/* ACCOUNT */}

            <div>

              <Label>Select Account *</Label>

              <Select
                value={selectedAccount?.account_number || ""}
                onValueChange={(val)=>{

                  const acc =
                    eligibleAccounts.find(
                      a => a.account_number === val
                    );

                  setSelectedAccount(acc);

                }}
              >

                <SelectTrigger>
                  <SelectValue placeholder="Choose account to deposit into"/>
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

            {/* AMOUNT */}

            <div>

              <Label>Amount *</Label>

              <Input
                type="number"
                value={amount}
                onChange={(e)=>setAmount(e.target.value)}
                placeholder="0.00"
              />

              {errors.amount &&
                <p className="text-xs text-red-500">
                  {errors.amount}
                </p>
              }

            </div>

            {/* REFERENCE */}

            <div>

              <Label>Reference</Label>

              <Input
                value={reference}
                onChange={(e)=>setReference(e.target.value)}
                placeholder="Enter reference (optional)"
              />

            </div>

            {/* NARRATION */}

            <div>

              <Label>Narration</Label>

              <Input
                value={narration}
                onChange={(e)=>setNarration(e.target.value)}
                placeholder="Enter narration (optional)"
              />

            </div>

            <Button
              onClick={handleSubmit}
              className="w-full"
            >
              Submit for Validation
            </Button>

          </div>

        )}

        {/* STEP 2 */}

        {step === 2 && (

          <div className="text-center py-16">

            <Loader2 className="animate-spin mx-auto mb-4"/>

            Validating transaction...

            {setTimeout(()=>setStep(3),1500)}

          </div>

        )}

        {/* STEP 3 */}

        {step === 3 && (

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

        {/* STEP 4 */}

        {step === 4 && (

          <div className="text-center py-16">

            Customer Verification Required

            <Button
              className="w-full mt-4"
              onClick={()=>setStep(5)}
            >
              Confirm
            </Button>

          </div>

        )}

        {/* STEP 5 */}

        {step === 5 && (

          <div className="text-center py-16">

            Awaiting Authorization

            <Button
              className="w-full mt-4"
              onClick={()=>setStep(6)}
            >
              Authorize
            </Button>

          </div>

        )}

        {/* STEP 6 */}

        {step === 6 && (

          <div className="text-center py-16">

            <CheckCircle2 className="mx-auto text-green-600 mb-4"/>

            Deposit Successful

            <Button
              disabled={isSubmitting}
              onClick={handleFinish}
              className="w-full mt-4"
            >

              {isSubmitting
                ? "Completing..."
                : "Finish"}

            </Button>

          </div>

        )}

      </div>

    </div>

  );

};