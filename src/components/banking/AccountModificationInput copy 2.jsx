import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  Shield,
  Eye,
  ThumbsUp,
  AlertCircle,
  ShieldAlert,
  Lock,
  Moon,
  Calendar,
  Globe,
  ChevronRight,
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

import { Textarea } from "@/components/ui/textarea";

/* ---------- ACTION MAP ---------- */

const ACTION_TYPE_MAP = {
  "set-transaction-limit": "SET_LIMIT",
  "block-unblock": "BLOCK_UNBLOCK",
  "set-standing-order": "STANDING_ORDER",
  "change-currency": "CHANGE_CURRENCY",
  "activate-dormant": "ACCOUNT_STATUS",
};

/* ---------- STEPS ---------- */

const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Authorization" },
];

/* ---------- ACTION LIST ---------- */

const MODIFICATION_ACTIONS = [
  {
    id: "set-transaction-limit",
    label: "Set Transaction Limit",
    description: "Configure daily or per-transaction limits",
    icon: ShieldAlert,
  },
  {
    id: "block-unblock",
    label: "Block / Unblock Account",
    description: "Restrict or restore account access",
    icon: Lock,
  },
  {
    id: "set-standing-order",
    label: "Set Standing Order",
    description: "Create recurring payment",
    icon: Calendar,
  },
  {
    id: "change-currency",
    label: "Change Account Currency",
    description: "Convert account currency",
    icon: Globe,
  },
  {
    id: "activate-dormant",
    label: "Activate / Set Dormant",
    description: "Change account status",
    icon: Moon,
  },
];

/* ---------- CURRENCIES ---------- */

const CURRENCIES = ["KES", "USD", "EUR", "GBP", "JPY"];

/* ---------- LIMIT TYPES ---------- */

const LIMIT_TYPES = [
  { value: "Daily", label: "Daily Limit" },
  { value: "Monthly", label: "Monthly Limit" },
  { value: "PerTransaction", label: "Per Transaction Limit" },
];
/* ---------- BLOCK ACTIONS ---------- */

const BLOCK_ACTIONS = [
  { value: "BLOCK", label: "Block" },
  { value: "UNBLOCK", label: "Unblock" },
];

/* ---------- BLOCK TARGETS ---------- */

const BLOCK_TARGETS = [
  { value: "Account", label: "Account" },
  { value: "DebitCard", label: "Debit Card" },
  { value: "CreditCard", label: "Credit Card" },
  { value: "OnlineBanking", label: "Online Banking" },
];

/* ---------- FREQUENCY ACTIONS ---------- */

const FREQUENCIES = [
  { value: "weekly", label: "weekly" },
  { value: "Biweekly", label: "Bi-weekly" },
  { value: "Monthly", label: "Monthly" },
  { value: "Quarterly", label: "Quarterly" },
  { value: "Annually", label: "Annually" },
];

export function AccountModificationInput({ customer, onBack }) {

  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [selectedActionId, setSelectedActionId] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [details, setDetails] = useState({});
  const [priorityLevel, setPriorityLevel] = useState(50);
  const [officerNotes, setOfficerNotes] = useState("");

  const [loading, setLoading] = useState(false);

  const [currencyDetails, setCurrencyDetails] = useState({
  // old_currency: "",      // can prefill with account currency
  new_currency: "",
  // conversion_rate: "",
  // effective_date: "",
  });
  const [statusChangeDetails, setStatusChangeDetails] = useState({
  new_status: "",
  });
  let sessionUser = {};

  try {
    sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {};
  } catch {}

  const accounts = customer?.accounts || sessionUser?.account || [];

  const activeAccounts = useMemo(() => {
    return accounts.filter(
      (a) => a.status === "ACTIVE" || a.status === "DORMANT"
    );
  }, [accounts]);

  const selectedActionObj = useMemo(() => {
    return MODIFICATION_ACTIONS.find((a) => a.id === selectedActionId);
  }, [selectedActionId]);

  /* ---------- UPDATE DETAILS ---------- */

  const updateDetail = (key, value) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /* ---------- VALIDATION ---------- */

  const handleStepOneSubmit = () => {

    if (!selectedAccount) {
      alert("Select account");
      return;
    }

    if (
      selectedActionId === "set-transaction-limit" &&
      (!details.limitType || !details.limitAmount)
    ) {
      alert("Enter limit type and amount");
      return;
    }
    if (
      selectedActionId === "block-unblock" &&
      (!details.action || !details.target)
    ) {
      alert("Select action and target");
      return;
    }
    if (selectedActionId === "set-standing-order") {
    if (
      !details.amount ||
      !details.frequency ||
      !details.beneficairy_name ||
      !details.beneficiary_account ||
      !details.start_date
    ) {
      alert("Please fill all required standing order fields");
      return;
    }
  }
  if (selectedActionId === "change-currency") {
  if (
    !currencyDetails.new_currency ||
    !currencyDetails.conversion_rate ||
    !currencyDetails.effective_date
  ) {
    alert("Please fill all currency change fields");
    return;
  }
}
  if (selectedActionId === "activate-dormant") {
  if (!statusChangeDetails.new_status) {
    alert("Please select a new status");
    return;
  }
  }
    setStep(2);
  };

  /* ---------- AUTO VALIDATION ---------- */

  useEffect(() => {

    if (step === 2) {
      const timer = setTimeout(() => setStep(3), 1200);
      return () => clearTimeout(timer);
    }

  }, [step]);

  /* ---------- API CALL ---------- */

  const submitModificationRequest = async () => {

    try {

      setLoading(true);

      const payload = {
        account: selectedAccount?.id,
        action_type: ACTION_TYPE_MAP[selectedActionId],

        limit_type:
          selectedActionId === "set-transaction-limit"
            ? details.limitType
            : null,

        limit_amount:
          selectedActionId === "set-transaction-limit"
            ? details.limitAmount
            : null,

        action:
          selectedActionId === "block-unblock"
            ? details.action
            : null,

        target:
          selectedActionId === "block-unblock"
            ? details.target
            : null,

        reason:
          selectedActionId === "block-unblock"
            ? details.reason
            : null,
              // STANDING ORDER FIELDS
        standing_order: selectedActionId === "set-standing-order" ? {
          beneficiary_name: details.beneficairy_name,
          beneficiary_account: details.beneficiary_account,
          amount: details.amount,
          frequency: details.frequency,
          start_date: details.start_date,
          end_date: details.end_date || null,
        } : null,
      currency_details:
      selectedActionId === "change-currency"
      ? { ...currencyDetails, old_currency: selectedAccount?.currency }
      : null,
      
      account_status_change:
      selectedActionId === "activate-dormant"
      ? { new_status: statusChangeDetails.new_status }
      : null,   
        remarks: `
Action: ${selectedActionObj?.label}
Account: ${selectedAccount?.account_number}
Priority: ${priorityLevel}
Officer Notes: ${officerNotes}
Details: ${JSON.stringify(details)}
`,
      };

      console.log("Submitting payload:", payload);

      const res = await fetch(
        "http://127.0.0.1:8000/api/account-modification-requests/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      console.log("Response:", data);

      if (!res.ok) {
        alert("Failed to create request");
        return false;
      }

      return true;

    } catch (err) {

      console.error("API ERROR:", err);
      alert("Network error");
      return false;

    } finally {
      setLoading(false);
    }
  };

  /* ---------- ANIMATION ---------- */

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <DashboardHeader
        customerName={customer?.first_name || "Customer"}
        onLogout={() => navigate("/")}
      />

      <div className="flex-1 p-6">

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

              {!selectedActionId && (

                <div className="space-y-3">

                  <Label>Select Action</Label>

                  {MODIFICATION_ACTIONS.map((action) => {

                    const Icon = action.icon;

                    return (
                      <button
                        key={action.id}
                        onClick={() => setSelectedActionId(action.id)}
                        className="w-full border p-4 rounded-xl flex items-center gap-3 bg-white"
                      >

                        <Icon className="h-5 w-5" />

                        <div className="flex-1 text-left">
                          <h4 className="font-semibold">{action.label}</h4>
                          <p className="text-xs text-gray-500">
                            {action.description}
                          </p>
                        </div>

                        <ChevronRight className="h-4 w-4" />

                      </button>
                    );

                  })}

                </div>
              )}

              {selectedActionId && (

                <div className="space-y-5">

                  <Button
                    variant="ghost"
                    onClick={() => setSelectedActionId(null)}
                  >
                    ← Change Action
                  </Button>

                  <div className="bg-white p-5 rounded-xl border space-y-4">

                    <Label>Select Account</Label>

                    <Select
                      value={selectedAccount?.id?.toString() || ""}
                      onValueChange={(val) => {
                        const acc = activeAccounts.find(
                          (a) => a.id === Number(val)
                        );
                        setSelectedAccount(acc);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose account" />
                      </SelectTrigger>

                      <SelectContent>
                        {activeAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id.toString()}>
                            {acc.account_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* TRANSACTION LIMIT */}

                    {selectedActionId === "set-transaction-limit" && (

                      <div className="space-y-3">

                        <Select
                          onValueChange={(v) =>
                            updateDetail("limitType", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Limit Type" />
                          </SelectTrigger>

                          <SelectContent>
                            {LIMIT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          type="number"
                          placeholder="Limit Amount"
                          onChange={(e) =>
                            updateDetail("limitAmount", e.target.value)
                          }
                        />

                      </div>
                    )}

                    {/* STANDING ORDER */}

{selectedActionId === "set-standing-order" && (

  <div className="space-y-3">

    <Input
      type="text"
      placeholder="Beneficiary Name"
      onChange={(e) => updateDetail("beneficairy_name", e.target.value)}
    />

    <Input
      type="number"
      placeholder="Beneficiary Account Number"
      onChange={(e) => updateDetail("beneficiary_account", e.target.value)}
    />

    <Input
      type="number"
      placeholder="Amount"
      onChange={(e) => updateDetail("amount", e.target.value)}
    />

    <Select
      onValueChange={(v) => updateDetail("frequency", v)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Frequency" />
      </SelectTrigger>

      <SelectContent>
        {FREQUENCIES.map((f) => (
          <SelectItem key={f.value} value={f.value}>
            {f.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Input
      type="date"
      placeholder="Start Date"
      onChange={(e) => updateDetail("start_date", e.target.value)}
    />

    <Input
      type="date"
      placeholder="End Date"
      onChange={(e) => updateDetail("end_date", e.target.value)}
    />

  </div>

)}
{/* BLOCK / UNBLOCK */}

{selectedActionId === "block-unblock" && (

  <div className="space-y-3">

    {/* BLOCK OR UNBLOCK */}

    <Select
      onValueChange={(v) => updateDetail("action", v)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select Action" />
      </SelectTrigger>

      <SelectContent>
        {BLOCK_ACTIONS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    {/* TARGET */}

    <Select
      onValueChange={(v) => updateDetail("target", v)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select Target" />
      </SelectTrigger>

      <SelectContent>
        {BLOCK_TARGETS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    {/* REASON */}

    <Textarea
      placeholder="Reason"
      onChange={(e) =>
        updateDetail("reason", e.target.value)
      }
    />

  </div>

)}
{selectedActionId === "activate-dormant" && (
  <div className="space-y-3 bg-white p-5 rounded-xl border">

    <Label>Select New Status</Label>

    <Select
      onValueChange={(v) =>
        setStatusChangeDetails({ new_status: v })
      }
      value={statusChangeDetails.new_status}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select Status" />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="ACTIVE">Active</SelectItem>
        <SelectItem value="DORMANT">Dormant</SelectItem>
      </SelectContent>
    </Select>
  </div>
)}

{selectedActionId === "change-currency" && (
  <div className="space-y-3 bg-white p-5 rounded-xl border">

    {/* Old Currency (read-only or pre-filled) */}
    <Input
      type="text"
      value={currencyDetails.old_currency || selectedAccount?.currency || ""}
      placeholder="Old Currency"
      readOnly
    />

    {/* New Currency */}
    <Select
      onValueChange={(v) =>
        setCurrencyDetails((prev) => ({ ...prev, new_currency: v }))
      }
    >
      <SelectTrigger>
        <SelectValue placeholder="Select New Currency" />
      </SelectTrigger>

      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    {/* Conversion Rate */}
    <Input
      type="number"
      step="0.0001"
      placeholder="Conversion Rate"
      value={currencyDetails.conversion_rate}
      onChange={(e) =>
        setCurrencyDetails((prev) => ({ ...prev, conversion_rate: e.target.value }))
      }
    />

    {/* Effective Date */}
    <Input
      type="date"
      placeholder="Effective Date"
      value={currencyDetails.effective_date}
      onChange={(e) =>
        setCurrencyDetails((prev) => ({ ...prev, effective_date: e.target.value }))
      }
    />
  </div>
)}
                  </div>

                  <Button onClick={handleStepOneSubmit}>
                    Validate Request
                  </Button>

                </div>

              )}

            </motion.div>

          )}

          {/* REVIEW */}

          {step === 3 && (

            <div className="max-w-lg mx-auto space-y-4">

              <h3 className="font-semibold">Review Request</h3>

              <p>Action: {selectedActionObj?.label}</p>
              <p>Account: {selectedAccount?.account_number}</p>

              <Button onClick={() => setStep(4)}>
                Proceed
              </Button>

            </div>

          )}

          {/* PROCESSING */}

          {step === 4 && (

            <div className="max-w-lg mx-auto space-y-4">

              <Label>Priority</Label>

              <input
                type="range"
                min="0"
                max="100"
                value={priorityLevel}
                onChange={(e) => setPriorityLevel(e.target.value)}
              />

              <Textarea
                placeholder="Officer notes"
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
              />

              <Button onClick={() => setStep(5)}>
                Confirm Details
              </Button>

            </div>

          )}

          {/* SUBMIT */}

          {step === 5 && (

            <div className="max-w-lg mx-auto space-y-4">

              <Button
                disabled={loading}
                onClick={async () => {

                  const success = await submitModificationRequest();

                  if (success) {
                    setStep(6);
                  }

                }}
              >

                {loading ? "Submitting..." : "Confirm & Verify"}

              </Button>

            </div>

          )}

          {/* DONE */}

          {step === 6 && (

            <div className="text-center space-y-4 py-10">

              <ThumbsUp className="mx-auto" />

              <h3 className="font-semibold">
                Awaiting Authorization
              </h3>

              <Button
                onClick={() => {
                  alert("Request Submitted");
                  onBack();
                }}
              >
                Finish
              </Button>

            </div>

          )}

        </AnimatePresence>

      </div>

    </div>
  );
}