import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Shield,
  Eye,
  ThumbsUp,
  BookOpen,
  Zap,
  Star,
  Hash,
  Building2,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { DashboardHeader } from "@/components/banking/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* CONSTANTS */
const STEPS = [
  { id: 1, name: "Input" },
  { id: 2, name: "Validation" },
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" },
  { id: 5, name: "Verification" },
  { id: 6, name: "Authorization" },
];

const CHEQUE_LEAVES = [
  { value: "25", label: "25 Leaves" },
  { value: "50", label: "50 Leaves" },
  { value: "100", label: "100 Leaves" },
];

const SERIES_PREFS = [
  { value: "continue", label: "Continue from last series" },
  { value: "new", label: "New series" },
];

const BRANCHES = [
  "Head Office", "Westlands", "Mombasa Road", "Kisumu", "Nakuru", "Eldoret", "Thika", "Nyeri",
];

export default function ChequeBookRequest({ customer: propCustomer, onBack }) {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  /* SESSION USER */
  let sessionUser = {};
  try {
    sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {};
  } catch {
    sessionUser = {};
  }
  const accounts = sessionUser?.account || [];

  /* STATE */
  const [customer, setCustomer] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  /* FORM STATE */
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [chequeLeaves, setChequeLeaves] = useState("50");
  const [seriesPref, setSeriesPref] = useState("continue");
  const [chqBranch, setChqBranch] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [smsNotify, setSmsNotify] = useState(true);
  const [chqReason, setChqReason] = useState("");
  const [formErrors, setFormErrors] = useState({});

  /* PROCESSING STATE */
  const [officerNotes, setOfficerNotes] = useState("");

  /* DERIVED DATA */
  // Filter for Current Accounts usually required for Cheque Books
  const eligibleAccounts = useMemo(() => {
    return accounts.filter((acc) => acc?.status === "ACTIVE" && (acc.type === 'current' || acc.type === 'CURRENT'));
  }, [accounts]);

  /* INIT CUSTOMER */
  useEffect(() => {
    if (propCustomer) {
      setCustomer(propCustomer);
      setContactPhone(propCustomer.phone || "");
      setContactEmail(propCustomer.email || "");
      return;
    }
    const sessionCustomer = sessionStorage.getItem("customer");
    if (sessionCustomer) {
        const c = JSON.parse(sessionCustomer);
        setCustomer(c);
        setContactPhone(c.phone || "");
        setContactEmail(c.email || "");
    }
  }, [propCustomer]);

  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => setStep(3), 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  /* HANDLERS */
  const validate = () => {
    const errs = {};
    if (!selectedAccount) errs.account = "Select account";
    if (!chqBranch) errs.branch = "Select collection branch";
    if (!contactPhone.trim()) errs.phone = "Phone required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setStep(2);
  };

  const handleFinalComplete = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    alert("Cheque Book Request Submitted Successfully");
    if (onBack) onBack();
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  if (!customer && !sessionUser) return <div className="min-h-screen flex items-center justify-center">Customer not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        customerName={customer?.fullName || sessionUser?.first_name || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => { localStorage.removeItem("customer"); navigate("/"); }}
      />

      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Cheque Book Request</h1>
            <p className="text-xs text-gray-500">Step {step} of 6: {STEPS[step - 1].name}</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center w-full mt-2 px-1">
          {STEPS.map((s, index) => {
            const isCompleted = s.id < step;
            const isCurrent = s.id === step;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted ? "bg-primary border-primary text-primary-foreground" :
                  isCurrent ? "bg-accent border-accent text-accent-foreground scale-110 shadow-sm" :
                  "bg-white border-gray-200 text-muted-foreground"
                }`}>
                  {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-[10px] font-bold">{s.id}</span>}
                </div>
                {index < STEPS.length - 1 && <div className={`flex-1 h-[2px] mx-1 transition-colors duration-300 ${isCompleted ? "bg-primary" : "bg-gray-200"}`} />}
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
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              
              {/* Customer Banner */}
              <div className="flex items-center gap-3 rounded-xl border p-4 bg-white shadow-sm">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {(customer?.fullName || sessionUser?.first_name || "C").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{customer?.fullName || sessionUser?.first_name}</p>
                  <p className="text-xs text-muted-foreground">{customer?.customerId || sessionUser?.user_id}</p>
                </div>
              </div>

              {/* Service Header */}
              <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-accent">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Request Cheque Book</h3>
                  <p className="text-xs text-muted-foreground">Issue a new cheque book</p>
                </div>
              </div>

              {/* Account Select */}
              <div className="space-y-2">
                <Label>Select Account *</Label>
                <Select
                  value={selectedAccount?.account_number || ""}
                  onValueChange={(val) => {
                    setSelectedAccount(eligibleAccounts.find(a => a.account_number === val));
                    setFormErrors(prev => ({...prev, account: ""}));
                  }}
                >
                  <SelectTrigger className={formErrors.account ? "border-destructive" : ""}>
                    <SelectValue placeholder="Choose current account" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleAccounts.map((acc) => (
                      <SelectItem key={acc.account_number} value={acc.account_number}>
                        {acc.account_number} • {acc.currency || "KES"} {acc.balance?.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.account && <p className="text-xs text-destructive">{formErrors.account}</p>}
              </div>

              {/* Leaves */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Number of Leaves *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {CHEQUE_LEAVES.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setChequeLeaves(opt.value)}
                      className={`rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
                        chequeLeaves === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-white hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Series Preference */}
              <div className="space-y-2">
                <Label>Series Preference</Label>
                <Select value={seriesPref} onValueChange={setSeriesPref}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERIES_PREFS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Branch */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Collection Branch *</Label>
                <Select value={chqBranch} onValueChange={(v) => { setChqBranch(v); setFormErrors(p => ({...p, branch: ""})); }}>
                  <SelectTrigger className={formErrors.branch ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formErrors.branch && <p className="text-xs text-destructive">{formErrors.branch}</p>}
              </div>

              {/* ETA Info */}
              <div className="flex items-start gap-2.5 rounded-lg bg-muted/40 border p-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">Estimated Processing Time</p>
                  <p className="text-xs text-muted-foreground">3-5 business days.</p>
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className={formErrors.phone ? "border-destructive" : ""} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                </div>
              </div>

              {/* SMS Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4 bg-gray-50">
                <div>
                  <p className="text-sm font-medium">SMS Notification</p>
                  <p className="text-xs text-muted-foreground">Receive alert when ready</p>
                </div>
                <Switch checked={smsNotify} onCheckedChange={setSmsNotify} />
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>Reason / Notes</Label>
                <Textarea placeholder="Optional..." value={chqReason} onChange={e => setChqReason(e.target.value)} />
              </div>

              <Button onClick={handleSubmit} className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold" disabled={loading}>
                {loading ? "Processing..." : "Submit Request"}
              </Button>
            </motion.div>
          )}

          {/* STEP 2: VALIDATION */}
          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg">Validating Request...</h3>
            </motion.div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <Check className="h-5 w-5" /> <span className="text-sm font-medium">Validation Passed</span>
              </div>
              <div className="rounded-xl border bg-white p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Request Summary</h4>
                <div className="space-y-0">
                  {[
                    { l: "Account", v: selectedAccount?.account_number },
                    { l: "Leaves", v: CHEQUE_LEAVES.find(l => l.value === chequeLeaves)?.label },
                    { l: "Collection", v: chqBranch },
                    { l: "Contact", v: contactPhone },
                  ].map((row) => (
                    <div key={row.l} className="flex justify-between py-2 border-b border-dashed last:border-0">
                      <span className="text-sm text-gray-500">{row.l}</span>
                      <span className="text-sm font-medium text-gray-800">{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={() => setStep(4)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">Proceed</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: PROCESSING */}
          {step === 4 && (
            <motion.div key="step4" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg mb-2">
                <Zap className="h-5 w-5" /> <span className="text-sm font-medium">Processing</span>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Officer Notes</Label>
                <Textarea placeholder="Optional notes..." value={officerNotes} onChange={e => setOfficerNotes(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
                <Button onClick={() => setStep(5)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">Confirm</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: VERIFICATION */}
          {step === 5 && (
            <motion.div key="step5" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                <Eye className="h-5 w-5" /> <span className="text-sm font-medium">Customer Verification</span>
              </div>
              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                 <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs p-2 rounded border border-green-200 mt-2">
                  <Star className="h-3.5 w-3.5" />
                  <span>Details verified and ready for printing queue</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">Back</Button>
                <Button onClick={() => setStep(6)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">Verify</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 6: AUTHORIZATION */}
          {step === 6 && (
            <motion.div key="step6" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto text-center py-10">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4">
                <ThumbsUp className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Request Authorized</h3>
              <Button onClick={handleFinalComplete} className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold" disabled={loading}>
                {loading ? "Processing..." : "Finish"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}