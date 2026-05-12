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
  KeyRound,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import qr from '@/assets/qr.png';   
import { DashboardHeader } from "@/components/banking/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
    console.log("Fetched Cards for PIN Management:", data);
    return data || [];

  } catch (error) {
    console.error("Error fetching cards:", error);
    return [];
  }
}

export default function PinManagement({ customer: propCustomer, onBack, formFields }) {
  const navigate = useNavigate();
    const sessionUser = JSON.parse(sessionStorage.getItem("userData1") || "{}");
  const accounts = sessionUser?.account || [];
  // const branches = sessionUser?.branch || [];

  /* FORMAT BRANCHES */
  // const BRANCH_OPTIONS = useMemo(() => {
  //   return branches.map((b) => ({
  //     value: b.branch_id,
  //     label: b.branch_name,
  //   }));
  // }, [branches]);

  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  /* SESSION USER */
  // let sessionUser = {};
  // try {
  //   sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {};
  // } catch {
  //   sessionUser = {};
  // }

  /* STATE */
  const [customer, setCustomer] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [fetchingCards, setFetchingCards] = useState(false);
  const [selectedCardDetails, setSelectedCardDetails] = useState(null);
  const serviceFee = useMemo(() => {
    return formFields?.[0]?.service_type?.service_fee || 0;
  }, [formFields]);

  /* FORM STATE */
  const [pinCard, setPinCard] = useState("");
  const [pinAction, setPinAction] = useState("");
  // const [selectedBranch, setSelectedBranch] = useState("");
  const [formErrors, setFormErrors] = useState({});
  
  /* ACTION SPECIFIC STATE */
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [unblockReason, setUnblockReason] = useState("");

  /* PROCESSING STATE */
  const [officerNotes, setOfficerNotes] = useState("");

  /* DERIVED DATA */
  // const accounts = sessionUser?.account || [];
  const primaryAccount = accounts.find(acc => acc.status === "ACTIVE") || accounts[0];
  const accountNumber = primaryAccount?.accountNumber || primaryAccount?.account_number;

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

  /* INIT */
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
      const t = setTimeout(() => setStep(3), 1500); 
      return () => clearTimeout(t); 
    }
  }, [step]);

  /* HANDLERS */
  const validate = () => {
    const e = {};
    if (!pinCard) e.card = "Select card";
    if (!pinAction) e.action = "Select action";
    // if (!selectedBranch) e.branch = "Please select a branch";

    // Specific validations based on action
    if (pinAction === 'set-new') {
      if (!newPin) e.newPin = "Enter new PIN";
      else if (newPin.length !== 4) e.newPin = "PIN must be 4 digits";
      if (!confirmPin) e.confirmPin = "Confirm your PIN";
      else if (newPin !== confirmPin) e.confirmPin = "PINs do not match";
    }

    if (pinAction === 'reset') {
      if (!resetReason) e.resetReason = "Select a reason";
      if (!deliveryMethod) e.deliveryMethod = "Select delivery method";
      if (!newPin) e.newPin = "Enter new PIN";
      else if (newPin.length !== 4) e.newPin = "PIN must be 4 digits";
      if (!confirmPin) e.confirmPin = "Confirm your PIN";
      else if (newPin !== confirmPin) e.confirmPin = "PINs do not match";
    }

    if (pinAction === 'unblock') {
      if (!unblockReason) e.unblockReason = "Enter a reason for unblock";
    }

    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCardSelect = (card) => {
    setPinCard(card.card_number || card.last4);
    setSelectedCardDetails(card);
  };
  
  console.log("res", customer?.user_id || sessionUser?.user_id,
          "service fee", serviceFee,
        );
          
  const handleSubmit = async () => {
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      // Prepare the request payload based on the action type
      let payload = {
        account_number: accountNumber,
        card_number: selectedCardDetails?.card_number || pinCard,
        action: pinAction,
        // branch: selectedBranch,
        officer_notes: officerNotes,
        user_id: customer?.user_id || sessionUser?.user_id,
      };

      // Add action-specific fields
      switch (pinAction) {
        case 'set-new':
          payload = {
            ...payload,
            new_pin: newPin,
            pin_hash: confirmPin,
            reason: 'Set new PIN',
          };
          break;

        case 'reset':
          payload = {
            ...payload,
            new_pin: newPin,
            pin_hash: confirmPin,
            reason: resetReason,
            delivery_method: deliveryMethod,
          };
          break;

        case 'unblock':
          payload = {
            ...payload,
            reason: unblockReason,
            unblock_reason: unblockReason,
          };
          break;

        default:
          break;
      }

      console.log("Sending PIN management request:", payload);

      const response = await fetch("http://127.0.0.1:8000/api/card-pins/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
          user_id: customer?.user_id || sessionUser?.user_id,
          service_amount: serviceFee,
          // branch: selectedBranch,
      });

      // Get the response data
      const responseData = await response.json();
      console.log("API Response:", responseData);

      if (!response.ok) {
        // Check for different error formats
        let errorMessage = "Failed to submit PIN management request";
        
        if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData.detail) {
          errorMessage = responseData.detail;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData.errors) {
          // Handle validation errors
          const errors = Object.values(responseData.errors).flat();
          errorMessage = errors.join(', ');
        }
        
        throw new Error(errorMessage);
      }

      console.log("PIN Management Request Created:", responseData);
      setStep(2); // move to validation step
    } catch (error) {
      console.error("Error:", error);
      // Display the actual error message from API
      alert(error.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalComplete = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    alert("PIN Management Service Request Submitted Successfully");
    if (onBack) onBack();
  };

  const pageVariants = { 
    initial: { opacity: 0, x: 20 }, 
    animate: { opacity: 1, x: 0 }, 
    exit: { opacity: 0, x: -20 } 
  };
  
  const fieldVariants = { 
    initial: { opacity: 0, y: -10 }, 
    animate: { opacity: 1, y: 0 }, 
    exit: { opacity: 0, y: -10 } 
  };
  
  const actionLabel = {
    'set-new': 'Set New PIN',
    'reset': 'Reset PIN',
    'unblock': 'Unblock PIN'
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
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">PIN Management</h1>
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
                  {(customer?.fullName || customer?.first_name || sessionUser?.first_name || "C").split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{customer?.fullName || customer?.first_name || sessionUser?.first_name}</p>
                  <p className="text-xs text-muted-foreground">Account: {accountNumber || 'N/A'}</p>
                </div>
              </div>

              {/* Card Selection - Now from API */}
              <div className="space-y-2">
                <Label>Select Card {fetchingCards && <span className="text-xs text-gray-500">(Loading...)</span>}</Label>
                
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
                            pinCard === (card.card_number || card.last4) 
                              ? "border-primary bg-primary/10" 
                              : "border-border bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <KeyRound className="h-5 w-5 text-gray-500" />
                            <div className="text-left">
                              <span className="font-mono block">
                                •••• {card.last4 || card.card_number?.slice(-4) || 'N/A'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {card.card_type || card.type || 'Debit Card'}
                              </span>
                            </div>
                          </div>
                          {pinCard === (card.card_number || card.last4) && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 border rounded-lg">
                        <KeyRound className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No cards found for this account</p>
                      </div>
                    )}
                  </div>
                )}
                {formErrors.card && <p className="text-xs text-destructive">{formErrors.card}</p>}
              </div>

              {/* Action Selection */}
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={pinAction} onValueChange={(val) => { setPinAction(val); setFormErrors({}); }}>
                  <SelectTrigger className={formErrors.action ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="set-new">Set New PIN</SelectItem>
                    <SelectItem value="reset">Reset PIN</SelectItem>
                    <SelectItem value="unblock">Unblock PIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Branch Selection - Always visible */}
              {/* <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Select Branch *
                </Label>
                <Select 
                  value={selectedBranch} 
                  onValueChange={(value) => {
                    setSelectedBranch(value);
                    setFormErrors(prev => ({...prev, branch: ""}));
                  }}
                >
                  <SelectTrigger className={formErrors.branch ? "border-destructive" : ""}>
                    <SelectValue placeholder="Choose a branch for PIN services" />
                  </SelectTrigger>
                    <SelectContent>
  {BRANCH_OPTIONS.map((branch) => (
    <SelectItem key={branch.value} value={branch.value}>
      {branch.label} • {branch.value}
    </SelectItem>
  ))}
</SelectContent>
                </Select>
                {formErrors.branch && (
                  <p className="text-xs text-destructive">{formErrors.branch}</p>
                )}
              </div> */}

              {/* Info Box */}
              {/* <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 border border-blue-200 p-3">
                <MapPin className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-800">PIN Service Information</p>
                  <p className="text-xs text-blue-700">
                    For PIN resets, your new PIN will be delivered via your selected method. 
                    For branch pickup, visit the selected branch with valid ID.
                  </p>
                </div>
              </div> */}

              {/* DYNAMIC FIELDS BASED ON ACTION */}
              <AnimatePresence mode="wait">
                {pinAction === 'set-new' && (
                  <motion.div 
                    key="fields-set-new" 
                    variants={fieldVariants} 
                    initial="initial" 
                    animate="animate" 
                    exit="exit"
                    className="space-y-4 p-4 bg-white border rounded-xl shadow-sm"
                  >
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <KeyRound className="h-4 w-4" /> Set New PIN Details
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="newPin">New PIN (4 digits)</Label>
                      <Input 
                        id="newPin" 
                        type="password" 
                        maxLength={4} 
                        value={newPin} 
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} 
                        className={formErrors.newPin ? "border-destructive" : ""}
                        placeholder="****"
                      />
                      {formErrors.newPin && <p className="text-xs text-destructive">{formErrors.newPin}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPin">Confirm PIN</Label>
                      <Input 
                        id="confirmPin" 
                        type="password" 
                        maxLength={4} 
                        value={confirmPin} 
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} 
                        className={formErrors.confirmPin ? "border-destructive" : ""}
                        placeholder="****"
                      />
                      {formErrors.confirmPin && <p className="text-xs text-destructive">{formErrors.confirmPin}</p>}
                    </div>
                  </motion.div>
                )}

                {pinAction === 'reset' && (
                  <motion.div 
                    key="fields-reset" 
                    variants={fieldVariants} 
                    initial="initial" 
                    animate="animate" 
                    exit="exit"
                    className="space-y-4 p-4 bg-white border rounded-xl shadow-sm"
                  >
                    <h4 className="text-sm font-semibold text-gray-700">Reset PIN Details</h4>
                    <div className="space-y-2">
                      <Label>Reason for Reset</Label>
                      <Select value={resetReason} onValueChange={setResetReason}>
                        <SelectTrigger className={formErrors.resetReason ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="forgotten">Forgotten PIN</SelectItem>
                          <SelectItem value="compromised">PIN Compromised</SelectItem>
                          <SelectItem value="expired">PIN Expired</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.resetReason && <p className="text-xs text-destructive">{formErrors.resetReason}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Delivery Method</Label>
                      <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                        <SelectTrigger className={formErrors.deliveryMethod ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select delivery" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          {/* <SelectItem value="branch">Branch Pickup</SelectItem> */}
                        </SelectContent>
                      </Select>
                      {formErrors.deliveryMethod && <p className="text-xs text-destructive">{formErrors.deliveryMethod}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPin">New PIN (4 digits)</Label>
                      <Input 
                        id="newPin" 
                        type="password" 
                        maxLength={4} 
                        value={newPin} 
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} 
                        className={formErrors.newPin ? "border-destructive" : ""}
                        placeholder="****"
                      />
                      {formErrors.newPin && <p className="text-xs text-destructive">{formErrors.newPin}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPin">Confirm PIN</Label>
                      <Input 
                        id="confirmPin" 
                        type="password" 
                        maxLength={4} 
                        value={confirmPin} 
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} 
                        className={formErrors.confirmPin ? "border-destructive" : ""}
                        placeholder="****"
                      />
                      {formErrors.confirmPin && <p className="text-xs text-destructive">{formErrors.confirmPin}</p>}
                    </div>
                  </motion.div>
                )}

                {pinAction === 'unblock' && (
                  <motion.div 
                    key="fields-unblock" 
                    variants={fieldVariants} 
                    initial="initial" 
                    animate="animate" 
                    exit="exit"
                    className="space-y-4 p-4 bg-white border rounded-xl shadow-sm"
                  >
                    <h4 className="text-sm font-semibold text-gray-700">Unblock PIN Details</h4>
                    <div className="space-y-2">
                      <Label htmlFor="unblockReason">Reason for Unblock</Label>
                      <Textarea 
                        id="unblockReason" 
                        value={unblockReason} 
                        onChange={(e) => setUnblockReason(e.target.value)} 
                        placeholder="Customer verified identity via..." 
                        className={formErrors.unblockReason ? "border-destructive" : ""}
                      />
                      {formErrors.unblockReason && <p className="text-xs text-destructive">{formErrors.unblockReason}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button 
                onClick={handleSubmit} 
                className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold" 
                disabled={loading || fetchingCards || !pinAction}
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
              <h3 className="font-semibold text-lg">Validating Request...</h3>
              <p className="text-sm text-muted-foreground">Checking card status</p>
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
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Request Summary</h4>
                <div className="space-y-0">
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span className="text-sm text-gray-500">Card</span>
                    <span className="text-sm font-medium text-gray-800">
                      •••• {selectedCardDetails?.last4 || pinCard?.slice(-4) || pinCard}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span className="text-sm text-gray-500">Card Type</span>
                    <span className="text-sm font-medium text-gray-800">
                      {selectedCardDetails?.card_type || selectedCardDetails?.type || 'Debit Card'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span className="text-sm text-gray-500">Action</span>
                    <span className="text-sm font-medium text-gray-800">{actionLabel[pinAction]}</span>
                  </div>
                  {/* <div className="flex justify-between py-2 border-b border-dashed">
                    <span className="text-sm text-gray-500">Branch</span>
                    <span className="text-sm font-medium text-gray-800">
                      {BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}
                    </span>
                  </div> */}
                  
                  {/* Dynamic Details in Review */}
                  {(pinAction === 'set-new' || pinAction === 'reset') && (
                    <div className="flex justify-between py-2 border-b border-dashed">
                      <span className="text-sm text-gray-500">New PIN</span>
                      <span className="text-sm font-medium text-gray-800 font-mono">****</span>
                    </div>
                  )}
                  
                  {pinAction === 'reset' && (
                    <>
                      <div className="flex justify-between py-2 border-b border-dashed">
                        <span className="text-sm text-gray-500">Reason</span>
                        <span className="text-sm font-medium text-gray-800 capitalize">{resetReason}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-dashed">
                        <span className="text-sm text-gray-500">Delivery</span>
                        <span className="text-sm font-medium text-gray-800 capitalize">{deliveryMethod}</span>
                      </div>
                    </>
                  )}

                  {pinAction === 'unblock' && (
                    <div className="py-2 border-b border-dashed">
                      <span className="text-sm text-gray-500 block mb-1">Reason</span>
                      <span className="text-sm font-medium text-gray-800">{unblockReason}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-500">Card Status</span>
                    <span className="text-sm font-medium text-gray-800">{selectedCardDetails?.status || 'ACTIVE'}</span>
                  </div>
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
                <span className="text-sm font-medium">Processing Center</span>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
                <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>PIN request queued for next step processing.</span>
                </div>
                {/* <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
                  <span className="font-medium">Branch:</span> {BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}
                </div> */}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Customer Name</p>
                    <p className="font-semibold">{customer?.fullName || customer?.first_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer ID</p>
                    <p className="font-medium text-gray-700">{customer?.customerId || customer?.user_id}</p>
                  </div>
                  {/* <div className="col-span-2">
                    <p className="text-xs text-gray-500">Branch</p>
                    <p className="font-medium text-gray-700">{BRANCH_OPTIONS.find(b => b.value === selectedBranch)?.label || selectedBranch}</p>
                  </div> */}
                </div>
                <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs p-2 rounded border border-green-200 mt-2">
                  <Star className="h-3.5 w-3.5" />
                  <span>Customer Identity Verified</span>
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
    {loading ? "Processing..." : "Add to Cart"}
  </Button>
</motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}