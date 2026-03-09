import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Shield,
  Eye,
  ThumbsUp,
  Zap,
  Star,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { DashboardHeader } from "@/components/banking/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

/* MOCK CARDS HELPER */
function getCustomerCards(customer, sessionUser) {
  const accounts = customer?.accounts || sessionUser?.account || [];
  const active = accounts.filter((a) => a?.status === "ACTIVE");
  if (active.length === 0) return [];
  return [
    { last4: "4521", type: "Visa Debit", posLimit: 200000, atmLimit: 100000 },
    { last4: "8832", type: "Mastercard", posLimit: 150000, atmLimit: 80000 }
  ];
}

export default function CardLimitUpdate({ customer: propCustomer, onBack }) {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  /* SESSION USER */
  let sessionUser = {};
  try {
    sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {};
  } catch {
    sessionUser = {};
  }

  /* STATE */
  const [customer, setCustomer] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  /* FORM STATE */
  const [limitCard, setLimitCard] = useState("");
  const [newPosLimit, setNewPosLimit] = useState("");
  const [newAtmLimit, setNewAtmLimit] = useState("");
  const [formErrors, setFormErrors] = useState({});
  
  /* PROCESSING STATE */
  const [officerNotes, setOfficerNotes] = useState("");

  /* DERIVED DATA */
  const existingCards = useMemo(() => getCustomerCards(customer, sessionUser), [customer, sessionUser]);
  const selectedCardDetails = existingCards.find(c => c.last4 === limitCard);

  /* INIT */
  useEffect(() => {
    if (propCustomer) { setCustomer(propCustomer); return; }
    const c = sessionStorage.getItem("customer");
    if (c) setCustomer(JSON.parse(c));
  }, [propCustomer]);

  useEffect(() => {
    if (step === 2) { const t = setTimeout(() => setStep(3), 1500); return () => clearTimeout(t); }
  }, [step]);

  /* HANDLERS */
  const validate = () => {
    const e = {};
    if (!limitCard) e.card = "Select card";
    if (!newPosLimit || Number(newPosLimit) <= 0) e.pos = "Valid POS limit required";
    if (!newAtmLimit || Number(newAtmLimit) <= 0) e.atm = "Valid ATM limit required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setStep(2);
  };

  const handleFinalComplete = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    alert("Card Limits Updated Successfully");
    if (onBack) onBack();
  };

  const pageVariants = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

  if (!customer && !sessionUser) return <div className="min-h-screen flex items-center justify-center">Customer not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        customerName={customer?.fullName || sessionUser?.first_name}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => { localStorage.removeItem("customer"); navigate("/"); }}
      />

      {/* Header & Stepper */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Card Limit Update</h1>
            <p className="text-xs text-gray-500">Step {step} of 6: {STEPS[step - 1].name}</p>
          </div>
        </div>
        <div className="flex items-center w-full mt-2 px-1">
          {STEPS.map((s, i) => {
            const comp = s.id < step;
            const curr = s.id === step;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${comp ? "bg-primary border-primary text-primary-foreground" : curr ? "bg-accent border-accent text-accent-foreground scale-110 shadow-sm" : "bg-white border-gray-200 text-muted-foreground"}`}>
                  {comp ? <Check className="h-4 w-4" /> : <span className="text-[10px] font-bold">{s.id}</span>}
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-[2px] mx-1 transition-colors duration-300 ${comp ? "bg-primary" : "bg-gray-200"}`} />}
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
                  {(customer?.fullName || sessionUser?.first_name || "C").split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{customer?.fullName || sessionUser?.first_name}</p>
                  <p className="text-xs text-muted-foreground">{customer?.customerId || sessionUser?.user_id}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Card</Label>
                <div className="space-y-2">
                  {existingCards.map(card => (
                    <button
                      key={card.last4}
                      type="button"
                      onClick={() => setLimitCard(card.last4)}
                      className={`border rounded-lg p-4 w-full flex justify-between items-center transition-all ${limitCard === card.last4 ? "border-primary bg-primary/10" : "border-border bg-white hover:bg-gray-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5 text-gray-500" />
                        <div className="text-left">
                          <span className="font-mono block">•••• {card.last4}</span>
                          <span className="text-[10px] text-gray-400">Current: POS {card.posLimit?.toLocaleString()} / ATM {card.atmLimit?.toLocaleString()}</span>
                        </div>
                      </div>
                      {limitCard === card.last4 && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New POS Limit</Label>
                  <Input
                    type="number"
                    value={newPosLimit}
                    onChange={e => setNewPosLimit(e.target.value)}
                    placeholder="e.g. 500000"
                    className={formErrors.pos ? "border-destructive" : ""}
                  />
                  {formErrors.pos && <p className="text-xs text-destructive">{formErrors.pos}</p>}
                </div>
                <div className="space-y-2">
                  <Label>New ATM Limit</Label>
                  <Input
                    type="number"
                    value={newAtmLimit}
                    onChange={e => setNewAtmLimit(e.target.value)}
                    placeholder="e.g. 100000"
                    className={formErrors.atm ? "border-destructive" : ""}
                  />
                  {formErrors.atm && <p className="text-xs text-destructive">{formErrors.atm}</p>}
                </div>
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
              <p className="text-sm text-muted-foreground">Checking limit parameters</p>
            </motion.div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">Validation Passed</span>
              </div>

              <div className="rounded-xl border bg-white p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Limit Change Summary</h4>
                <div className="space-y-0">
                  {[
                    { l: "Card", v: `•••• ${limitCard}` },
                    { l: "Current POS", v: `KES ${selectedCardDetails?.posLimit?.toLocaleString()}` },
                    { l: "New POS", v: `KES ${Number(newPosLimit).toLocaleString()}` },
                    { l: "Current ATM", v: `KES ${selectedCardDetails?.atmLimit?.toLocaleString()}` },
                    { l: "New ATM", v: `KES ${Number(newAtmLimit).toLocaleString()}` },
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
                <Zap className="h-5 w-5" />
                <span className="text-sm font-medium">Officer Review</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Verify requested limits against customer profile risk.</span>
                </div>
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
                <Eye className="h-5 w-5" />
                <span className="text-sm font-medium">Customer Verification</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs p-2 rounded border border-green-200 mt-2">
                  <Star className="h-3.5 w-3.5" />
                  <span>Customer has authorized limit change</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">Request Change</Button>
                <Button onClick={() => setStep(6)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">Confirm & Verify</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 6: AUTHORIZATION */}
          {step === 6 && (
            <motion.div key="step6" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto text-center py-10">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4">
                <ThumbsUp className="h-8 w-8 text-accent" />
              </div>
            
              <h3 className="text-xl font-semibold">Limits Updated</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                New card limits are now active.
              </p>

              <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-6 space-y-4 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Request ID</span>
                  <span className="font-mono text-xs">LIM-{Date.now().toString().slice(-8)}</span>
                </div>
                
                <div className="flex items-center gap-2 rounded bg-green-100 p-3 text-green-900 text-xs">
                  <Check className="h-4 w-4" />
                  <span>Update Successful</span>
                </div>
              </div>

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