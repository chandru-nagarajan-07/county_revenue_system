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

export default function CardLimitUpdate({ customer: propCustomer, onBack,formFields }) {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  /* SESSION USER */
  const [sessionUser, setSessionUser] = useState({});
  
  useEffect(() => {
    try {
      const userData = JSON.parse(sessionStorage.getItem("userData1")) || {};
      console.log("Session User:", userData);
      setSessionUser(userData);
    } catch (error) {
      console.error("Error parsing session user:", error);
      setSessionUser({});
    }
  }, []);

  /* STATE */
  const [customer, setCustomer] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [existingCards, setExistingCards] = useState([]);

  /* FORM STATE */
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [newPosLimit, setNewPosLimit] = useState("");
  const [newAtmLimit, setNewAtmLimit] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const serviceFee = useMemo(() => {
    return formFields?.[0]?.service_type?.service_fee || 0;
  }, [formFields]);
  /* PROCESSING STATE */
  const [officerNotes, setOfficerNotes] = useState("");

  /* Get account number from session user */
  const accountNumber = useMemo(() => {
    if (sessionUser?.account && Array.isArray(sessionUser.account) && sessionUser.account.length > 0) {
      return sessionUser.account[0].account_number;
    }
    if (customer?.accountNumber) {
      return customer.accountNumber;
    }
    return null;
  }, [sessionUser, customer]);

  /* Process cards to add last4 field */
  const processedCards = useMemo(() => {
    return existingCards.map(card => ({
      ...card,
      last4: card.card_number?.slice(-4) || "****",
      posLimit: parseFloat(card.daily_pos_limit) || 0,
      atmLimit: parseFloat(card.daily_atm_limit) || 0
    }));
  }, [existingCards]);

  /* DERIVED DATA */
  const selectedCardDetails = useMemo(() => 
    processedCards.find(c => c.id === selectedCardId), 
    [processedCards, selectedCardId]
  );

  /* INIT - Set customer from props or session */
  useEffect(() => {
    if (propCustomer) { 
      setCustomer(propCustomer); 
      return; 
    }
    
    try {
      const c = sessionStorage.getItem("customer");
      if (c) setCustomer(JSON.parse(c));
    } catch (error) {
      console.error("Error parsing customer data:", error);
    }
  }, [propCustomer]);

  /* FETCH CARDS */
  useEffect(() => {
    const fetchCards = async () => {
      try {
        if (!accountNumber) {
          console.log("No account number available");
          return;
        }

        console.log("Fetching cards for account:", accountNumber);

        const response = await fetch(
          `http://127.0.0.1:8000/api/cards/?account=${accountNumber}`
        );

        console.log("API Response status:", response.status);

        if (!response.ok) {
          throw new Error("Failed to fetch cards");
        }

        const data = await response.json();
        console.log("Raw API Response:", data);

        setExistingCards(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Card fetch error:", error);
        setExistingCards([]);
      }
    };

    fetchCards();
  }, [accountNumber]);

  /* AUTO ADVANCE FROM STEP 2 TO 3 */
  useEffect(() => {
    if (step === 2) { 
      const t = setTimeout(() => setStep(3), 1500); 
      return () => clearTimeout(t); 
    }
  }, [step]);

  /* HANDLERS */
  const validate = () => {
    const e = {};
    if (!selectedCardId) e.card = "Select card";
    if (!newPosLimit || Number(newPosLimit) <= 0) e.pos = "Valid POS limit required";
    if (!newAtmLimit || Number(newAtmLimit) <= 0) e.atm = "Valid ATM limit required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };
 console.log("res", customer?.user_id || sessionUser?.user_id,
          "service fee", serviceFee);
  const handleSubmit = async () => {
  if (!validate()) return;

  setLoading(true);

  try {
    const payload = {
      card_number: selectedCardDetails?.card_number,
      old_pos_limit: selectedCardDetails?.posLimit,
      new_pos_limit: Number(newPosLimit),
      old_atm_limit: selectedCardDetails?.atmLimit,
      new_atm_limit: Number(newAtmLimit),
    };

    const response = await fetch(
      "http://127.0.0.1:8000/api/card-limit-updates/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
          user_id: customer?.user_id || sessionUser?.user_id,
          service_amount: serviceFee,
      }
    );

    console.log("API Status:", response.status);

    if (!response.ok) {
      throw new Error("Failed to update card limits");
    }

    const data = await response.json();
    console.log("Limit update response:", data);

    setStep(2);

  } catch (error) {
    console.error("Error updating limits:", error);
    alert("Limit update failed");
  } finally {
    setLoading(false);
  }
};

  const handleFinalComplete = async () => {
    setLoading(true);
    
    // Here you would make the actual API call to update limits
    // const response = await fetch(`http://127.0.0.1:8000/api/cards/${selectedCardId}/`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     daily_pos_limit: newPosLimit,
    //     daily_atm_limit: newAtmLimit
    //   })
    // });
    
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    alert("Card Limits Updated Successfully");
    if (onBack) onBack();
  };

  const pageVariants = { 
    initial: { opacity: 0, x: 20 }, 
    animate: { opacity: 1, x: 0 }, 
    exit: { opacity: 0, x: -20 } 
  };

  // Get display name from session user or customer
  const displayName = useMemo(() => {
    return customer?.fullName || sessionUser?.first_name || "Customer";
  }, [customer, sessionUser]);

  // Get customer ID from session user or customer
  const customerId = useMemo(() => {
    return customer?.customerId || sessionUser?.user_id || "";
  }, [customer, sessionUser]);

  // Get initials for avatar
  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [displayName]);

  if (!customer && !sessionUser?.first_name) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Customer not found</p>
          <Button onClick={onBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        customerName={displayName}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => { 
          localStorage.removeItem("customer"); 
          sessionStorage.removeItem("userData1");
          navigate("/"); 
        }}
      />

      {/* Header & Stepper */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
              Card Limit Update
            </h1>
            <p className="text-xs text-gray-500">
              Step {step} of 6: {STEPS[step - 1].name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center w-full mt-2 px-1">
          {STEPS.map((s, i) => {
            const completed = s.id < step;
            const current = s.id === step;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                  completed 
                    ? "bg-primary border-primary text-primary-foreground" 
                    : current 
                    ? "bg-accent border-accent text-accent-foreground scale-110 shadow-sm" 
                    : "bg-white border-gray-200 text-muted-foreground"
                }`}>
                  {completed ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-[10px] font-bold">{s.id}</span>
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-1 transition-colors duration-300 ${
                    completed ? "bg-primary" : "bg-gray-200"
                  }`} />
                )}
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
            <motion.div 
              key="step1" 
              variants={pageVariants} 
              initial="initial" 
              animate="animate" 
              exit="exit" 
              className="space-y-6 max-w-lg mx-auto"
            >
              <div className="flex items-center gap-3 rounded-xl border p-4 bg-white shadow-sm">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {customerId}
                  </p>
                  {accountNumber && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Account: {accountNumber}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Card</Label>
                <div className="space-y-2">
                  {processedCards.length > 0 ? (
                    processedCards.map(card => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setSelectedCardId(card.id)}
                        className={`border rounded-lg p-4 w-full flex justify-between items-center transition-all ${
                          selectedCardId === card.id 
                            ? "border-primary bg-primary/10" 
                            : "border-border bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Settings className="h-5 w-5 text-gray-500" />
                          <div className="text-left">
                            <span className="font-mono block">•••• {card.last4}</span>
                            <span className="text-xs text-gray-600">
                              {card.card_type} • {card.name_on_card}
                            </span>
                            <span className="text-[10px] text-gray-400 block">
                              Current: POS {card.posLimit?.toLocaleString()} / ATM {card.atmLimit?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {selectedCardId === card.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-center p-8 border rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-500">No cards found for this customer</p>
                      <p className="text-xs text-gray-400 mt-1">Account: {accountNumber || 'Not available'}</p>
                    </div>
                  )}
                </div>
                {formErrors.card && (
                  <p className="text-xs text-destructive">{formErrors.card}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New POS Limit (KES)</Label>
                  <Input
                    type="number"
                    value={newPosLimit}
                    onChange={e => setNewPosLimit(e.target.value)}
                    placeholder="e.g. 500000"
                    className={formErrors.pos ? "border-destructive" : ""}
                  />
                  {formErrors.pos && (
                    <p className="text-xs text-destructive">{formErrors.pos}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>New ATM Limit (KES)</Label>
                  <Input
                    type="number"
                    value={newAtmLimit}
                    onChange={e => setNewAtmLimit(e.target.value)}
                    placeholder="e.g. 100000"
                    className={formErrors.atm ? "border-destructive" : ""}
                  />
                  {formErrors.atm && (
                    <p className="text-xs text-destructive">{formErrors.atm}</p>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-semibold shadow-lg" 
                disabled={loading || processedCards.length === 0}
              >
                {loading ? "Processing..." : "Submit Request"}
              </Button>
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
              <p className="text-sm text-muted-foreground">Checking limit parameters</p>
            </motion.div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && selectedCardDetails && (
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
                  Limit Change Summary
                </h4>
                <div className="space-y-0">
                  {[
                    { l: "Card", v: `•••• ${selectedCardDetails.last4} (${selectedCardDetails.card_type})` },
                    { l: "Card Holder", v: selectedCardDetails.name_on_card },
                    { l: "Current POS Limit", v: `KES ${selectedCardDetails.posLimit?.toLocaleString()}` },
                    { l: "New POS Limit", v: `KES ${Number(newPosLimit).toLocaleString()}` },
                    { l: "Current ATM Limit", v: `KES ${selectedCardDetails.atmLimit?.toLocaleString()}` },
                    { l: "New ATM Limit", v: `KES ${Number(newAtmLimit).toLocaleString()}` },
                  ].map((row) => (
                    <div key={row.l} className="flex justify-between py-2 border-b border-dashed last:border-0">
                      <span className="text-sm text-gray-500">{row.l}</span>
                      <span className="text-sm font-medium text-gray-800">{row.v}</span>
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
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-semibold shadow-lg"
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
                <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Verify requested limits against customer profile risk.</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Officer Notes</Label>
                <Textarea 
                  placeholder="Optional notes..." 
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
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-semibold shadow-lg"
                >
                  Confirm
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
                <span className="text-sm font-medium">Customer Verification</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs p-2 rounded border border-green-200 mt-2">
                  <Star className="h-3.5 w-3.5" />
                  <span>Customer has authorized limit change</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                  Request Change
                </Button>
                <Button 
                  onClick={() => setStep(6)} 
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-semibold shadow-lg"
                >
                  Confirm & Verify
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
                  <span className="font-mono text-xs">
                    LIM-{Date.now().toString().slice(-8)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 rounded bg-green-100 p-3 text-green-900 text-xs">
                  <Check className="h-4 w-4" />
                  <span>Update Successful</span>
                </div>
              </div>

              <Button 
                onClick={handleFinalComplete} 
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-semibold shadow-lg" 
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