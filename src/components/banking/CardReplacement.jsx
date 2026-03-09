import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Shield,
  Eye,
  ThumbsUp,
  CreditCard,
  Zap,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { DashboardHeader } from "@/components/banking/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* CONSTANTS */
const STEPS = [
  { id: 1, name: "Input" }, { id: 2, name: "Validation" }, { id: 3, name: "Review" },
  { id: 4, name: "Processing" }, { id: 5, name: "Verification" }, { id: 6, name: "Authorization" },
];

/* MOCK CARDS HELPER */
function getCustomerCards(customer, sessionUser) {
  const accounts = customer?.accounts || sessionUser?.account || [];
  const active = accounts.filter((a) => a?.status === "ACTIVE");
  if (active.length === 0) return [];
  return [
    { last4: "4521", type: "Visa Debit", account: active[0]?.accountNumber || active[0]?.account_number },
    { last4: "8832", type: "Mastercard", account: active[1]?.accountNumber || active[1]?.account_number || active[0]?.accountNumber }
  ];
}

export default function CardReplacement({ customer: propCustomer, onBack }) {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  /* SESSION USER */
  let sessionUser = {};
  try { sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {}; } catch { sessionUser = {}; }

  /* STATE */
  const [customer, setCustomer] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  /* FORM STATE */
  const [selectedCard, setSelectedCard] = useState("");
  const [replacementReason, setReplacementReason] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [officerNotes, setOfficerNotes] = useState("");

  /* DERIVED DATA */
  const existingCards = useMemo(() => getCustomerCards(customer, sessionUser), [customer, sessionUser]);

  useEffect(() => {
    if (propCustomer) { setCustomer(propCustomer); return; }
    const sessionCustomer = sessionStorage.getItem("customer");
    if (sessionCustomer) setCustomer(JSON.parse(sessionCustomer));
  }, [propCustomer]);

  useEffect(() => {
    if (step === 2) { const timer = setTimeout(() => setStep(3), 1500); return () => clearTimeout(timer); }
  }, [step]);

  /* HANDLERS */
  const validate = () => {
    const errs = {};
    if (!selectedCard) errs.card = "Select card";
    if (!replacementReason) errs.reason = "Select reason";
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
    alert("Card Replacement Request Submitted");
    if (onBack) onBack();
  };

  const pageVariants = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

  if (!customer && !sessionUser) return <div className="min-h-screen flex items-center justify-center">Customer not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        customerName={customer?.fullName || sessionUser?.first_name || "Customer"}
        isDropdownOpen={navDropdownOpen} setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => { localStorage.removeItem("customer"); navigate("/"); }}
      />

      {/* Header & Stepper */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Card Replacement</h1>
            <p className="text-xs text-gray-500">Step {step} of 6: {STEPS[step - 1].name}</p>
          </div>
        </div>
        <div className="flex items-center w-full mt-2 px-1">
          {STEPS.map((s, index) => {
            const isCompleted = s.id < step; const isCurrent = s.id === step;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted ? "bg-primary border-primary text-primary-foreground" : isCurrent ? "bg-accent border-accent text-accent-foreground scale-110 shadow-sm" : "bg-white border-gray-200 text-muted-foreground"}`}>
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
              
              <div className="flex items-center gap-3 rounded-xl border p-4 bg-white shadow-sm">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {(customer?.fullName || sessionUser?.first_name || "C").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{customer?.fullName || sessionUser?.first_name}</p>
                  <p className="text-xs text-muted-foreground">{customer?.customerId || sessionUser?.user_id}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Card to Replace</Label>
                <div className="space-y-2">
                  {existingCards.map((card) => (
                    <button
                      key={card.last4}
                      type="button"
                      onClick={() => setSelectedCard(card.last4)}
                      className={`border rounded-lg p-4 w-full flex justify-between items-center transition-all ${selectedCard === card.last4 ? "border-primary bg-primary/10" : "border-border bg-white hover:bg-gray-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-gray-500" />
                        <span className="font-mono">•••• {card.last4}</span>
                        <span className="text-xs text-gray-500">{card.type}</span>
                      </div>
                      {selectedCard === card.last4 && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Replacement Reason</Label>
                <Select value={replacementReason} onValueChange={setReplacementReason}>
                  <SelectTrigger className={formErrors.reason ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="stolen">Stolen</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
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
              <h3 className="font-semibold text-lg">Checking Card Status...</h3>
            </motion.div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <Check className="h-5 w-5" /> <span className="text-sm font-medium">Card Verified</span>
              </div>
              <div className="rounded-xl border bg-white p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Replacement Summary</h4>
                <div className="space-y-0">
                  {[
                    { l: "Card", v: `•••• ${selectedCard}` },
                    { l: "Reason", v: replacementReason },
                    { l: "Old Card Status", v: "To be blocked" },
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
                <Textarea placeholder="Optional notes..." value={officerNotes} onChange={(e) => setOfficerNotes(e.target.value)} />
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
                <Eye className="h-5 w-5" /> <span className="text-sm font-medium">Verification</span>
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