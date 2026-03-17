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
  { id: 1, name: "Input" }, 
  { id: 2, name: "Validation" }, 
  { id: 3, name: "Review" },
  { id: 4, name: "Processing" }, 
  { id: 5, name: "Verification" }, 
  { id: 6, name: "Authorization" },
];

/* FUNCTION TO FETCH CARDS FROM API */
async function fetchCustomerCards(accountNumber) {
  try {

    const response = await fetch(
      `http://127.0.0.1:8000/api/cards/?account=${accountNumber}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch cards");
    }

    const data = await response.json();
    console.log("Fetched Cards:", data);
    return data || [];

  } catch (error) {

    console.error("Error fetching cards:", error);
    return [];

  }
}

export default function CardReplacement({ customer: propCustomer, onBack, formFields }) {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  /* SESSION USER */
  let sessionUser = {};
  try { 
    sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {}; 
    console.log("Session User:", sessionUser);
  } catch { 
    sessionUser = {}; 
  }

  /* STATE */
  const [customer, setCustomer] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [fetchingCards, setFetchingCards] = useState(false);

  /* FORM STATE */
  const [selectedCard, setSelectedCard] = useState("");
  const [selectedCardDetails, setSelectedCardDetails] = useState(null);
  const [replacementReason, setReplacementReason] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [officerNotes, setOfficerNotes] = useState("");
  const serviceFee = useMemo(() => {
    return formFields?.[0]?.service_type?.service_fee || 0;
  }, [formFields]);
  /* DERIVED DATA */
  const accounts = sessionUser?.account || [];
  const primaryAccount = accounts.find(acc => acc.status === "ACTIVE") || accounts[0];
  const accountNumber = primaryAccount?.accountNumber || primaryAccount?.account_number;

function getExpiryDate(created_at) {
  const date = new Date(created_at);
  date.setFullYear(date.getFullYear() + 5);
  return date.toISOString().split("T")[0];
}

  /* FETCH CARDS WHEN ACCOUNT IS AVAILABLE */
  useEffect(() => {
    async function loadCards() {
      if (accountNumber) {
        setFetchingCards(true);
        const fetchedCards = await fetchCustomerCards(accountNumber);
        setCards(fetchedCards);
        setFetchingCards(false);
      }
    }
    loadCards();
  }, [accountNumber]);

  useEffect(() => {
    if (propCustomer) { 
      setCustomer(propCustomer); 
      return; 
    }
    const sessionCustomer = sessionStorage.getItem("customer");
    if (sessionCustomer) setCustomer(JSON.parse(sessionCustomer));
    else if (sessionUser) setCustomer(sessionUser);
  }, [propCustomer, sessionUser]);

  useEffect(() => {
    if (step === 2) { 
      const timer = setTimeout(() => setStep(3), 1500); 
      return () => clearTimeout(timer); 
    }
  }, [step]);

  /* HANDLERS */
  const validate = () => {
    const errs = {};
    if (!selectedCard) errs.card = "Select a card to replace";
    if (!replacementReason) errs.reason = "Select replacement reason";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCardSelect = (card) => {
    setSelectedCard(card.card_number || card.last4);
    setSelectedCardDetails(card);
  };
 console.log("res", customer?.user_id || sessionUser?.user_id,
          "service fee", serviceFee);
const handleSubmit = async () => {
  if (!validate()) return;

  setLoading(true);

  try {
    const response = await fetch("http://127.0.0.1:8000/api/card-replacements/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_number: accountNumber,
        card_number: selectedCardDetails?.card_number || selectedCard,
        reason: replacementReason,
        officer_notes: officerNotes,
        user_id: customer?.user_id || sessionUser?.user_id,
        service_amount: serviceFee,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to submit card replacement request");
    }

    const data = await response.json();
    console.log("Replacement Request Created:", data);

    setStep(2); // move to validation step
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to submit request");
  } finally {
    setLoading(false);
  }
};

  const handleFinalComplete = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    alert("Card Replacement Request Submitted Successfully");
    if (onBack) onBack();
  };

  const pageVariants = { 
    initial: { opacity: 0, x: 20 }, 
    animate: { opacity: 1, x: 0 }, 
    exit: { opacity: 0, x: -20 } 
  };

  if (!customer && !sessionUser) return <div className="min-h-screen flex items-center justify-center">Customer not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        customerName={customer?.fullName || customer?.first_name || sessionUser?.first_name || "Customer"}
        isDropdownOpen={navDropdownOpen} 
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => { localStorage.removeItem("customer"); navigate("/"); }}
      />

      {/* Header & Stepper */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Card Replacement</h1>
            <p className="text-xs text-gray-500">Step {step} of 6: {STEPS[step - 1].name}</p>
          </div>
        </div>
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
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-1 transition-colors duration-300 ${isCompleted ? "bg-primary" : "bg-gray-200"}`} />
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
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              
              {/* Customer Info Banner */}
              <div className="flex items-center gap-3 rounded-xl border p-4 bg-white shadow-sm">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {(customer?.fullName || customer?.first_name || sessionUser?.first_name || "C")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{customer?.fullName || customer?.first_name || sessionUser?.first_name}</p>
                  <p className="text-xs text-muted-foreground">Account: {accountNumber || 'N/A'}</p>
                </div>
              </div>

              {/* Cards List from API */}
              <div className="space-y-2">
                <Label>Select Card to Replace {fetchingCards && <span className="text-xs text-gray-500">(Loading...)</span>}</Label>
                
                {fetchingCards ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cards.length > 0 ? (
                      cards.map((card) => (
                        <button
                          key={card.id || card.card_number || card.last4}
                          type="button"
                          onClick={() => handleCardSelect(card)}
                          className={`border rounded-lg p-4 w-full flex justify-between items-center transition-all ${
                            selectedCard === (card.card_number || card.last4) 
                              ? "border-primary bg-primary/10" 
                              : "border-border bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-gray-500" />
                            <div className="text-left">
                              <span className="font-mono block">
                                •••• {card.last4 || card.card_number?.slice(-4) || 'N/A'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {card.card_type || card.type || 'Debit Card'} • Exp: {getExpiryDate(card.created_at)}
                              </span>
                            </div>
                          </div>
                          {selectedCard === (card.card_number || card.last4) && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 border rounded-lg">
                        <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No cards found for this account</p>
                      </div>
                    )}
                  </div>
                )}
                {formErrors.card && <p className="text-xs text-destructive">{formErrors.card}</p>}
              </div>

              {/* Replacement Reason */}
              <div className="space-y-2">
                <Label>Replacement Reason</Label>
                <Select value={replacementReason} onValueChange={setReplacementReason}>
                  <SelectTrigger className={formErrors.reason ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lost">Lost / Stolen</SelectItem>
                    <SelectItem value="damaged">Damaged / Not Working</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="upgrade">Upgrade Card Type</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.reason && <p className="text-xs text-destructive">{formErrors.reason}</p>}
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold" 
                disabled={loading || fetchingCards}
              >
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
              <p className="text-sm text-muted-foreground">Verifying card eligibility for replacement</p>
            </motion.div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <Check className="h-5 w-5" /> 
                <span className="text-sm font-medium">Card Verified - Eligible for Replacement</span>
              </div>
              
              <div className="rounded-xl border bg-white p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Replacement Summary</h4>
                <div className="space-y-0">
                  {[
                    { l: "Card", v: selectedCardDetails ? (
                      <span>
                        •••• {selectedCardDetails.last4 || selectedCardDetails.card_number?.slice(-4)} • 
                        {selectedCardDetails.card_type || selectedCardDetails.type}
                      </span>
                    ) : `•••• ${selectedCard}` },
                    { l: "Reason", v: replacementReason },
                    { l: "Current Status", v: selectedCardDetails?.status || "ACTIVE" },
                    { l: "New Card Status", v: "To be issued" },
                    { l: "Old Card Action", v: "Will be blocked" },
                  ].map((row) => (
                    <div key={row.l} className="flex justify-between py-2 border-b border-dashed last:border-0">
                      <span className="text-sm text-gray-500">{row.l}</span>
                      <span className="text-sm font-medium text-gray-800">{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Replacement fee of KES 500 will be applied to your account</span>
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
                <span className="text-sm font-medium">Processing Replacement</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Card Processing Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Delivery Method</p>
                    <p className="font-semibold">Branch Pickup</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estimated Time</p>
                    <p className="font-bold text-lg">3-5 Days</p>
                  </div>
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
                <span className="text-sm font-medium">Final Verification</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Customer Name</p>
                    <p className="font-semibold">{customer?.fullName || customer?.first_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer ID</p>
                    <p className="font-medium text-gray-700">{customer?.customerId || customer?.user_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Card to Replace</p>
                    <p className="font-medium text-gray-700">•••• {selectedCardDetails?.last4 || selectedCard.slice(-4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reason</p>
                    <p className="font-medium text-gray-700">{replacementReason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs p-2 rounded border border-green-200 mt-2">
                  <Star className="h-3.5 w-3.5" />
                  <span>All details verified - Ready for authorization</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">Request Change</Button>
                <Button onClick={() => setStep(6)} className="flex-1 gold-gradient text-accent-foreground font-semibold shadow-gold">Verify & Approve</Button>
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
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Card replacement has been approved and queued for processing
              </p>

              <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-6 space-y-4 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Request ID</span>
                  <span className="font-mono text-xs">REP-{Date.now().toString().slice(-8)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Card</span>
                  <span className="font-mono text-xs">•••• {selectedCardDetails?.last4 || selectedCard.slice(-4)}</span>
                </div>
              </div>

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