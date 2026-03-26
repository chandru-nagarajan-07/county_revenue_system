import { useState, useMemo, useEffect } from "react";
import qr from '@/assets/qr.png';
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
  Receipt,
  Zap,
  Star,
  TrendingUp,
  MapPin,
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
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "block-unblock",
    label: "Block / Unblock Account",
    description: "Restrict or restore account access",
    icon: Lock,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    id: "set-standing-order",
    label: "Set Standing Order",
    description: "Create recurring payment",
    icon: Calendar,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    id: "change-currency",
    label: "Change Account Currency",
    description: "Convert account currency",
    icon: Globe,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    id: "activate-dormant",
    label: "Activate / Set Dormant",
    description: "Change account status",
    icon: Moon,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
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

export function AccountModificationInput({ customer: propCustomer, onBack, formFields }) {

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
 const [stmtEmail, setStmtEmail] = useState("");

  const [step, setStep] = useState(1);

  const [selectedActionId, setSelectedActionId] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState("");

  const [details, setDetails] = useState({});
  const [priorityLevel, setPriorityLevel] = useState(50);
  const [officerNotes, setOfficerNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const serviceFee = useMemo(() => {
    return formFields?.[0]?.service_type?.service_fee || 0;
  }, [formFields]);
  
  const [currencyDetails, setCurrencyDetails] = useState({
    new_currency: "",
  });
  
  const [statusChangeDetails, setStatusChangeDetails] = useState({
    new_status: "",
  });
  
  // let sessionUser = {};

  // try {
  //   sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {};
  // } catch {}

  // const accounts = customer?.accounts || sessionUser?.account || [];

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
  
  console.log("res", customer?.user_id || sessionUser?.user_id,
          "service fee", serviceFee,"branch", selectedBranch);
          
  /* ---------- VALIDATION ---------- */

  const handleStepOneSubmit = () => {
    if (!selectedAccount) {
      alert("Select account");
      return;
    }
    
    if (!selectedBranch) {
      alert("Please select a branch");
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
        !currencyDetails.new_currency
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
  /* INIT CUSTOMER */
  useEffect(() => {
    if (propCustomer) {
      setCustomer(propCustomer);
      setStmtEmail(propCustomer.email || propCustomer.Email || "");
      return;
    }
    const sessionCustomer = sessionStorage.getItem("customer");
    if (sessionCustomer) {
        const c = JSON.parse(sessionCustomer);
        setCustomer(c);
        setStmtEmail(c.email || c.Email || "");
    }
  }, [propCustomer]);

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
        user_id: sessionUser?.user_id || sessionUser?.userId || sessionUser?.id,
        action_type: ACTION_TYPE_MAP[selectedActionId],
        branch: selectedBranch,
        limit_type: selectedActionId === "set-transaction-limit" ? details.limitType : null,
        limit_amount: selectedActionId === "set-transaction-limit" ? details.limitAmount : null,
        action: selectedActionId === "block-unblock" ? details.action : null,
        target: selectedActionId === "block-unblock" ? details.target : null,
        reason: selectedActionId === "block-unblock" ? details.reason : null,
        standing_order: selectedActionId === "set-standing-order" ? {
          beneficiary_name: details.beneficairy_name,
          beneficiary_account: details.beneficiary_account,
          amount: details.amount,
          frequency: details.frequency,
          start_date: details.start_date,
          end_date: details.end_date || null,
        } : null,
        currency_details: selectedActionId === "change-currency" ? { ...currencyDetails, old_currency: selectedAccount?.currency } : null,
        account_status_change: selectedActionId === "activate-dormant" ? { new_status: statusChangeDetails.new_status } : null,   
        remarks: `
Action: ${selectedActionObj?.label}
Account: ${selectedAccount?.account_number}
Branch: ${BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}
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
          user_id: customer?.user_id || sessionUser?.user_id,
          service_amount: serviceFee,
          branch: selectedBranch,
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

  /* ---------- HANDLE FINAL COMPLETE ---------- */
  const handleFinalComplete = () => {
    // Navigate back to dashboard or show success message
    navigate("/dashboard"); // or wherever you want to navigate after completion
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
        customerName={customer?.first_name || sessionUser?.first_name || "Customer"}
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
              Account Modification
            </h1>
            <p className="text-xs text-gray-500">
              Step {step} of 6: {STEPS[step - 1].name}
            </p>
          </div>
        </div>

        {/* STEPPER UI */}
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
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">

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

              {/* Customer Banner */}
              <div className="flex items-center gap-3 rounded-xl border p-4 bg-white shadow-sm">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {(customer?.first_name || sessionUser?.first_name || "C")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{customer?.first_name || sessionUser?.first_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer?.user_id || sessionUser?.user_id}
                  </p>
                </div>
              </div>

              {!selectedActionId && (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Action</Label>
                  {MODIFICATION_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => setSelectedActionId(action.id)}
                        className="w-full flex items-center gap-4 border rounded-xl p-4 bg-white hover:bg-gray-50 transition-all text-left group"
                      >
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${action.bgColor} ${action.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-800">{action.label}</h4>
                          <p className="text-xs text-gray-500">{action.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedActionId && (
                <div className="space-y-5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedActionId(null);
                      setDetails({});
                    }}
                    className="text-xs text-gray-500 px-2"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" /> Change Action
                  </Button>

                  <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">

                    {/* Action Header */}
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <div className={`p-1.5 rounded ${selectedActionObj?.bgColor}`}>
                        {selectedActionObj && (
                          <selectedActionObj.icon className={`h-4 w-4 ${selectedActionObj.color}`} />
                        )}
                      </div>
                      <h3 className="font-semibold text-sm">{selectedActionObj?.label}</h3>
                    </div>

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
                            {acc.account_number} • {acc.currency || "KES"}{" "}
                            {acc.balance?.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Branch Selection - Always visible */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> Select Branch *
                      </Label>
                      <Select 
                        value={selectedBranch} 
                        onValueChange={(value) => setSelectedBranch(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a branch for this modification" />
                        </SelectTrigger>
                      <SelectContent>
  {BRANCH_OPTIONS.map((branch) => (
    <SelectItem key={branch.value} value={branch.value}>
      {branch.label} • {branch.value}
    </SelectItem>
  ))}
</SelectContent>
                      </Select>
                    </div>

                  

                    {/* TRANSACTION LIMIT */}
                    {selectedActionId === "set-transaction-limit" && (
                      <div className="space-y-3">
                        <Select onValueChange={(v) => updateDetail("limitType", v)}>
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
                          onChange={(e) => updateDetail("limitAmount", e.target.value)}
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
                        <Select onValueChange={(v) => updateDetail("frequency", v)}>
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
                        <Select onValueChange={(v) => updateDetail("action", v)}>
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
                        <Select onValueChange={(v) => updateDetail("target", v)}>
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
                        <Textarea
                          placeholder="Reason"
                          onChange={(e) => updateDetail("reason", e.target.value)}
                        />
                      </div>
                    )}
                    
                    {/* ACTIVATE DORMANT */}
                    {selectedActionId === "activate-dormant" && (
                      <div className="space-y-3 bg-white p-5 rounded-xl border">
                        <Label>Select New Status</Label>
                        <Select
                          onValueChange={(v) => setStatusChangeDetails({ new_status: v })}
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
                    
                    {/* CHANGE CURRENCY */}
                    {selectedActionId === "change-currency" && (
                      <div className="space-y-3 bg-white p-5 rounded-xl border">
                        <Input
                          type="text"
                          value={currencyDetails.old_currency || selectedAccount?.currency || ""}
                          placeholder="Old Currency"
                          readOnly
                        />
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
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="Conversion Rate"
                          value={currencyDetails.conversion_rate}
                          onChange={(e) =>
                            setCurrencyDetails((prev) => ({ ...prev, conversion_rate: e.target.value }))
                          }
                        />
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

                  <Button onClick={handleStepOneSubmit} className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold">
                    Validate Request
                  </Button>
                </div>
              )}
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
              <h3 className="font-semibold text-lg">Validating Request...</h3>
              <p className="text-sm text-muted-foreground">Checking account status and compliance</p>
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

              <div className="rounded-xl border bg-white p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Request Summary
                </h4>

                <div className="space-y-0">
                  {[
                    { l: "Customer Name", v: customer?.first_name || sessionUser?.first_name || "N/A" },
                    { l: "Action", v: selectedActionObj?.label },
                    { l: "Account", v: selectedAccount?.account_number },
                    { l: "Branch", v: BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch },
                    { l: "Details", v: Object.values(details).join(" / ") || "N/A" },
                  ].map((row) => (
                    <div key={row.l} className="flex justify-between py-2 border-b border-dashed last:border-0">
                      <span className="text-sm text-gray-500">{row.l}</span>
                      <span className="text-sm font-medium text-gray-800 text-right">{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold"
                >
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
                <Zap className="h-5 w-5" />
                <span className="text-sm font-medium">Officer Review</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase">Action</p>
                    <p className="font-bold text-xs truncate">{selectedActionObj?.label}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-[10px] text-blue-600 uppercase font-semibold">Account</p>
                    <p className="font-bold text-blue-700 text-xs">
                      {selectedAccount?.account_number?.slice(-4)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase">Branch</p>
                    <p className="font-bold text-green-700 text-xs">
                      {BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label?.slice(0, 10) || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-medium">Priority Level</Label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">Low</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={priorityLevel}
                      onChange={(e) => setPriorityLevel(e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-400">High</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Officer Notes</Label>
                <Textarea
                  placeholder="Optional notes for the next approver..."
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(5)}
                  className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold"
                >
                  Confirm Details
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: VERIFICATION */}
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
                <span className="text-sm font-medium">Final Verification</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Request Details
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Action Type</p>
                    <p className="font-semibold">{selectedActionObj?.label}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Account</p>
                    <p className="font-semibold">{selectedAccount?.account_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Branch</p>
                    <p className="font-semibold">{BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Priority</p>
                    <p className="font-bold text-lg">{priorityLevel}%</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Value</p>
                    <p className="font-bold text-primary">
                      {Object.values(details).join(", ") || "Status Change"}
                    </p>
                  </div>
                </div>

                {priorityLevel > 80 && (
                  <div className="flex items-center gap-2 bg-amber-50 text-amber-800 text-xs p-2 rounded border border-amber-200 mt-2">
                    <Star className="h-3.5 w-3.5" />
                    <span>Flagged as high priority transaction</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                  Request Change
                </Button>
                <Button
                  disabled={loading}
                  onClick={async () => {
                    const success = await submitModificationRequest();
                    if (success) {
                      setStep(6);
                    }
                  }}
                  className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold"
                >
                  {loading ? "Submitting..." : "Confirm & Verify"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 6: AUTHORIZATION */}
          {step === 6 && (
            <motion.div
              key="step6"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 max-w-lg mx-auto text-center py-10"
            >
              {/* QR Image */}
              {/* <div className="flex justify-center">
                <img src={qr} alt="AIDA" className="h-100 w-100 object-cover" />
              </div>

              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Scan this QR code to proceed further.
              </p> */}
   <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4">
                <ThumbsUp className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Request Complete</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Your statement request has been processed successfully.
              </p>
              <Button
                onClick={handleFinalComplete}
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
                disabled={loading}
              >
                {loading ? "Processing..." : "Finish"}
              </Button>
            </motion.div>
          )}

        </AnimatePresence>

      </div>

    </div>
  );
}