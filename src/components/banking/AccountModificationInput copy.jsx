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
  Sun,
  Calendar,
  Globe,
  ChevronRight,
  Receipt,
  Zap,
  Star,
  TrendingUp,
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

/* CONSTANTS */
const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Authorization" },
];

const MODIFICATION_ACTIONS = [
  {
    id: "set-transaction-limit",
    label: "Set Transaction Limit",
    description: "Configure daily, per-transaction, or monthly limits",
    icon: ShieldAlert,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "block-unblock",
    label: "Block / Unblock Account",
    description: "Temporarily restrict or restore account access",
    icon: Lock,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    id: "set-standing-order",
    label: "Set Standing Order",
    description: "Create or modify recurring payment instructions",
    icon: Calendar,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    id: "change-currency",
    label: "Change Account Currency",
    description: "Convert account to another currency",
    icon: Globe,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    id: "activate-dormant",
    label: "Activate / Set Dormant",
    description: "Change account active status",
    icon: Moon,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
];

const CURRENCIES = ["KES", "USD", "EUR", "GBP", "JPY"];

export function AccountModificationInput({ customer, onBack }) {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  /* SESSION USER */
  let sessionUser = {};
  try {
    sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {};
  } catch {
    sessionUser = {};
  }
  const accounts = customer?.accounts || sessionUser?.account || [];

  /* WORKFLOW STATE */
  const [step, setStep] = useState(1);

  /* FORM STATE (Step 1) */
  const [selectedActionId, setSelectedActionId] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [details, setDetails] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  /* PROCESSING STATE (Step 4) */
  const [priorityLevel, setPriorityLevel] = useState(50);
  const [officerNotes, setOfficerNotes] = useState("");

  /* DERIVED DATA */
  const activeAccounts = useMemo(() => {
    return accounts.filter((acc) => acc?.status === "ACTIVE" || acc?.status === "DORMANT");
  }, [accounts]);

  const selectedActionObj = useMemo(() => {
    return MODIFICATION_ACTIONS.find((a) => a.id === selectedActionId);
  }, [selectedActionId]);

  /* HANDLERS */
  const updateDetail = (key, value) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateForm = () => {
    const errs = {};
    if (!selectedAccount) errs.account = "Select an account";
    if (selectedActionId === "set-transaction-limit") {
      if (!details.limitAmount || Number(details.limitAmount) <= 0)
        errs.limitAmount = "Enter a valid limit amount";
    }
    if (selectedActionId === "set-standing-order") {
      if (!details.amount || Number(details.amount) <= 0)
        errs.amount = "Enter valid amount";
      if (!details.frequency) errs.frequency = "Select frequency";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStepOneSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 800);
  };

  // Auto-advance Step 2 -> 3
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => setStep(3), 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  /* RENDER HELPERS */
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

              {/* If no action selected, show list. If selected, show form. */}
              {!selectedActionId ? (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Select Action
                  </Label>
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
              ) : (
                <div className="space-y-5">
                  {/* Action Header */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedActionId(null);
                        setDetails({});
                        setFormErrors({});
                      }}
                      className="text-xs text-gray-500 px-2"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" /> Change Action
                    </Button>
                  </div>

                  <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <div className={`p-1.5 rounded ${selectedActionObj?.bgColor}`}>
                        {selectedActionObj && (
                          <selectedActionObj.icon className={`h-4 w-4 ${selectedActionObj.color}`} />
                        )}
                      </div>
                      <h3 className="font-semibold text-sm">{selectedActionObj?.label}</h3>
                    </div>

                    {/* Account Select */}
                    <div className="space-y-2">
                      <Label>Select Account</Label>
                      <Select
                        value={selectedAccount?.account_number || ""}
                        onValueChange={(val) => {
                          const acc = activeAccounts.find((a) => a.account_number === val);
                          setSelectedAccount(acc || null);
                          setFormErrors((prev) => ({ ...prev, account: "" }));
                        }}
                      >
                        <SelectTrigger className={formErrors.account ? "border-destructive" : ""}>
                          <SelectValue placeholder="Choose account" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeAccounts.map((acc) => (
                            <SelectItem key={acc.account_number} value={acc.account_number}>
                              {acc.account_number} • {acc.currency || "KES"}{" "}
                              {acc.balance?.toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.account && (
                        <p className="text-xs text-destructive">{formErrors.account}</p>
                      )}
                    </div>

                    {/* Dynamic Inputs based on Action */}
                    {selectedActionId === "set-transaction-limit" && (
                      <div className="space-y-2">
                        <Label>New Limit Amount</Label>
                        <Input
                          type="number"
                          value={details.limitAmount || ""}
                          onChange={(e) => updateDetail("limitAmount", e.target.value)}
                          placeholder="e.g. 50000"
                          className={formErrors.limitAmount ? "border-destructive" : ""}
                        />
                        {formErrors.limitAmount && (
                          <p className="text-xs text-destructive">{formErrors.limitAmount}</p>
                        )}
                      </div>
                    )}

                    {selectedActionId === "set-standing-order" && (
                      <>
                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            value={details.amount || ""}
                            onChange={(e) => updateDetail("amount", e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Frequency</Label>
                          <Select
                            value={details.frequency || ""}
                            onValueChange={(val) => updateDetail("frequency", val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {selectedActionId === "change-currency" && (
                      <div className="space-y-2">
                        <Label>New Currency</Label>
                        <Select
                          value={details.newCurrency || ""}
                          onValueChange={(val) => updateDetail("newCurrency", val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedActionId === "block-unblock" && (
                      <div className="space-y-2">
                        <Label>Action</Label>
                        <Select
                          value={details.blockStatus || ""}
                          onValueChange={(val) => updateDetail("blockStatus", val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="block">Block Account</SelectItem>
                            <SelectItem value="unblock">Unblock Account</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedActionId === "activate-dormant" && (
                      <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>
                          This will change the account status. Please ensure proper
                          documentation is attached.
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleStepOneSubmit}
                    className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Validate Request"}
                  </Button>
                </div>
              )}
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
              <h3 className="font-semibold text-lg">Validating Request...</h3>
              <p className="text-sm text-muted-foreground">Checking account status and compliance</p>
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
                  Request Summary
                </h4>

                <div className="space-y-0">
                  {[
                    { l: "Customer Name", v: customer?.first_name || sessionUser?.first_name || "N/A" },
                    { l: "Action", v: selectedActionObj?.label },
                    { l: "Account", v: selectedAccount?.account_number },
                    { l: "Details", v: Object.values(details).join(" / ") || "N/A" },
                  ].map((row) => (
                    <div key={row.l} className="flex justify-between py-2 border-b border-dashed last:border-0">
                      <span className="text-sm text-gray-500">{row.l}</span>
                      <span className="text-sm font-medium text-gray-800 text-right">{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5" /> Applicable Fees
                  </h4>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Processing Fee</span>
                    <span className="font-medium">KES 0.00</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">KES 0.00</span>
                  </div>
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

          {/* ========== STEP 4: PROCESSING ========== */}
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
                    <p className="text-[10px] text-gray-500 uppercase">Status</p>
                    <p className="font-bold text-green-700 text-xs">Pending</p>
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

          {/* ========== STEP 5: VERIFICATION ========== */}
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
                    <p className="text-xs text-gray-500">Value</p>
                    <p className="font-bold text-primary">
                      {Object.values(details).join(", ") || "Status Change"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Priority</p>
                    <p className="font-bold text-lg">{priorityLevel}%</p>
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
                  onClick={() => setStep(6)}
                  className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold"
                >
                  Confirm & Verify
                </Button>
              </div>
            </motion.div>
          )}

          {/* ========== STEP 6: AUTHORIZATION ========== */}
          {step === 6 && (
            <motion.div
              key="step6"
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
                This modification request requires supervisor approval to be completed.
              </p>

              <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-6 space-y-4 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Request ID</span>
                  <span className="font-mono text-xs">MOD-{Date.now().toString().slice(-8)}</span>
                </div>

                {priorityLevel > 80 ? (
                  <div className="flex items-center gap-2 rounded bg-amber-100 p-3 text-amber-900 text-xs">
                    <AlertCircle className="h-4 w-4" />
                    <span>High Priority request requires immediate approval</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded bg-green-100 p-3 text-green-900 text-xs">
                    <Check className="h-4 w-4" />
                    <span>Standard approval workflow</span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => {
                  alert("Request Authorized Successfully!");
                  onBack();
                }}
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
              >
                Authorize Request
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}