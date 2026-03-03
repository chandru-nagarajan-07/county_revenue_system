import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Check, AlertCircle, Shield, Eye, ThumbsUp, Star, Gift, ChevronRight, Receipt, Info, Zap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import WorkflowStepper from './WorkflowStepper'; // Assuming this component exists from your new code

// Constants
const CROSS_SELL_OFFERS = [
  { title: 'Premium Savings Account', description: 'Earn up to 8.5% p.a. on your savings', icon: '💰' },
  { title: 'Mobile Banking', description: 'Bank anytime, anywhere with our app', icon: '📱' },
  { title: 'Insurance Cover', description: 'Protect what matters most to you', icon: '🛡️' },
];

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export const TransactionWorkflow = ({
  service,
  customer: propCustomer,
  onBack,
  onComplete,
}) => {
  // Data & State
  const sessionCustomer = JSON.parse(sessionStorage.getItem("customer"));
  const customer = propCustomer || sessionCustomer;

  const [workflow, setWorkflow] = useState({
    stage: 'input', // input -> validation -> review -> processing -> verification -> authorization -> cross-sell -> feedback
    data: {},
    officerNotes: '',
  });

  const [accountTypes, setAccountTypes] = useState([]);
  const [addonsMap, setAddonsMap] = useState({});
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  // Fetch Account Types
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/account-types/")
      .then(res => res.json())
      .then(data => setAccountTypes(data))
      .catch(err => console.error(err));
  }, []);

  // Helper Functions
  const itemCount = selectedAccounts.reduce(
    (total, acc) => total + 1 + acc.addons.length,
    0
  );

  const getAccountNames = () => {
    return selectedAccounts.map(a => a.account.name).join(", ");
  };

  const getAddonNames = () => {
    const allAddons = [];
    selectedAccounts.forEach(item => {
      item.addons.forEach(addonId => {
        const addonObj = addonsMap[item.account.id]?.find(a => a.id === addonId);
        if (addonObj) {
          allAddons.push(addonObj.addon?.name);
        }
      });
    });
    return allAddons.join(", ");
  };

  const goToStage = (stage) => {
    setWorkflow(prev => ({ ...prev, stage }));
  };

  // Interaction Handlers
  const toggleAccount = async (account) => {
    const exists = selectedAccounts.find(acc => acc.account.id === account.id);

    if (exists) {
      setSelectedAccounts(prev => prev.filter(a => a.account.id !== account.id));
      return;
    }

    // Fetch Addons for this account
    const res = await fetch(`http://127.0.0.1:8000/account-addons/${account.code}/`);
    const data = await res.json();

    setAddonsMap(prev => ({
      ...prev,
      [account.id]: data,
    }));

    setSelectedAccounts(prev => [
      ...prev,
      { account, addons: [] },
    ]);
  };

  const toggleAddon = (accountId, addonId) => {
    setSelectedAccounts(prev =>
      prev.map(item => {
        if (item.account.id !== accountId) return item;
        const exists = item.addons.includes(addonId);
        return {
          ...item,
          addons: exists
            ? item.addons.filter(id => id !== addonId)
            : [...item.addons, addonId],
        };
      })
    );
  };

  const removeAccount = (accountId) => {
    setSelectedAccounts(prev => prev.filter(a => a.account.id !== accountId));
  };

  const removeAddon = (accountId, addonId) => {
    setSelectedAccounts(prev =>
      prev.map(item => {
        if (item.account.id !== accountId) return item;
        return {
          ...item,
          addons: item.addons.filter(id => id !== addonId),
        };
      })
    );
  };

  const handleSubmitInput = () => {
    if (selectedAccounts.length === 0) return;
    goToStage('validation');
    setTimeout(() => goToStage('review'), 1500);
  };

  const handleFinalSubmit = async () => {
    const payload = {
      service_code: service?.code,
      service_name: service?.title,
      customer_id: customer?.id || customer?.user_ID,
      selections: selectedAccounts,
      form_data: workflow.data,
      officer_notes: workflow.officerNotes,
    };

    await fetch("http://127.0.0.1:8000/create_api_formfields1/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    goToStage('processing');
  };
  
  const handleFeedbackSubmit = () => {
    console.log("Feedback submitted:", { rating: feedbackRating, feedback: feedbackText });
    onComplete();
  };

  // Summary Fields for Review/Verification
  const summaryFields = [
    { label: 'Customer', value: customer?.first_name },
    { label: 'Customer ID', value: customer?.user_id },
    { label: 'New Account(s)', value: getAccountNames() || 'None' },
    { label: 'Add-on Products', value: getAddonNames() || 'None' },
    { label: 'Reference / Narration', value: 'Service Charges' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 touch-target">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-display text-xl font-semibold text-foreground">{service?.title}</h2>
          <p className="text-sm text-muted-foreground">Account Opening Workflow</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="px-6 py-4 bg-card border-b border-border">
        <WorkflowStepper currentStage={workflow.stage} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          
          {/* INPUT STAGE */}
          {workflow.stage === 'input' && (
            <motion.div key="input" {...pageVariants} className="space-y-6 max-w-4xl mx-auto">
              
              {/* Customer Info Banner */}
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {customer?.first_name?.charAt(0) || 'C'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{customer?.first_name}</p>
                  <p className="text-xs text-muted-foreground">{customer?.email} • {customer?.phone}</p>
                </div>
              </div>

              <h2 className="font-semibold text-lg text-foreground">Select Accounts</h2>

              {/* Account Types Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accountTypes.map(account => {
                  const selected = selectedAccounts.some(a => a.account.id === account.id);
                  return (
                    <div
                      key={account.id}
                      onClick={() => toggleAccount(account)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all duration-200
                        ${selected 
                          ? "border-primary bg-primary/5 ring-1 ring-primary" 
                          : "border-border hover:border-gray-400 bg-card"}
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-foreground">{account.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{account.description}</p>
                        </div>
                        {selected && (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add-ons Section */}
              {selectedAccounts.map(item => (
                <div key={item.account.id} className="mt-6 border-t border-border pt-6">
                  <h3 className="font-semibold text-sm text-foreground mb-3">
                    Add-ons for {item.account.name}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(addonsMap[item.account.id] || []).map(addon => {
                      const isSelected = item.addons.includes(addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => toggleAddon(item.account.id, addon.id)}
                          className={`border rounded-lg p-3 cursor-pointer text-sm transition-all
                            ${isSelected 
                              ? "border-success bg-success/10 text-success" 
                              : "border-border hover:border-gray-400 bg-muted/30"}
                          `}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && <Check className="h-3 w-3" />}
                            <span>{addon.addon?.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Selection Summary / Cart */}
              {selectedAccounts.length > 0 && (
                <div className="border rounded-xl p-5 bg-card shadow-sm mt-6">
                  <div className="flex justify-between mb-4 border-b border-border pb-3">
                    <h3 className="font-semibold text-foreground">Your Selection</h3>
                    <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                      {itemCount} items
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedAccounts.map(item => (
                      <div key={item.account.id} className="space-y-2">
                        <div className="flex justify-between items-center bg-muted/40 rounded-lg px-4 py-2 text-sm">
                          <span className="font-medium text-foreground">{item.account.name}</span>
                          <button
                            onClick={() => removeAccount(item.account.id)}
                            className="text-muted-foreground hover:text-destructive transition"
                          >
                            ✕
                          </button>
                        </div>

                        {item.addons.map(addonId => {
                          const addonObj = addonsMap[item.account.id]?.find(a => a.id === addonId);
                          return (
                            <div
                              key={addonId}
                              className="flex justify-between items-center bg-muted/20 rounded-lg px-4 py-2 ml-4 text-xs text-muted-foreground"
                            >
                              <span>{addonObj?.addon?.name}</span>
                              <button
                                onClick={() => removeAddon(item.account.id, addonId)}
                                className="hover:text-destructive transition"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleSubmitInput}
                    className="w-full mt-6 gold-gradient text-accent-foreground font-semibold shadow-gold hover:shadow-elevated transition-shadow"
                  >
                    Submit for Validation ({itemCount} items)
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* VALIDATION STAGE */}
          {workflow.stage === 'validation' && (
            <motion.div key="validation" {...pageVariants} className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="h-16 w-16 rounded-full bg-info/10 flex items-center justify-center animate-pulse">
                <Shield className="h-8 w-8 text-info" />
              </div>
              <h3 className="font-display text-lg font-semibold">Validating Selection...</h3>
              <p className="text-sm text-muted-foreground">Checking account eligibility and compliance</p>
            </motion.div>
          )}

          {/* REVIEW STAGE */}
          {workflow.stage === 'review' && (
            <motion.div key="review" {...pageVariants} className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5 text-success" />
                <p className="text-sm font-medium text-success">Validation passed — Ready for officer review</p>
              </div>

              {/* Summary Card */}
              <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Transaction Summary</h4>
                {summaryFields.map((field) => (
                  <div key={field.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                    <span className="text-sm font-medium text-foreground text-right">{field.value}</span>
                  </div>
                ))}
              </div>

              {/* Charges Card */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-accent" />
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Service Charges</h4>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-muted-foreground">Service Fee</span>
                  <span className="text-sm font-semibold text-success">FREE</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-border mt-1">
                  <span className="text-sm font-semibold text-foreground">Total Charges</span>
                  <span className="text-base font-bold text-success">No Charge</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3">
                  <Info className="h-4 w-4 text-success shrink-0" />
                  <p className="text-xs text-success font-medium">This transaction is free for Premium customers</p>
                </div>
              </div>

              {/* Officer Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Officer Notes (optional)</Label>
                <Textarea
                  placeholder="Add any processing notes..."
                  value={workflow.officerNotes}
                  onChange={(e) => setWorkflow(prev => ({ ...prev, officerNotes: e.target.value }))}
                  className="touch-target"
                />
              </div>

              <Button 
                onClick={() => {
                  goToStage('processing');
                  setTimeout(() => goToStage('verification'), 2000);
                }} 
                className="w-full touch-target gold-gradient text-accent-foreground font-semibold shadow-gold"
              >
                Proceed to Processing
              </Button>
            </motion.div>
          )}

          {/* PROCESSING STAGE */}
          {workflow.stage === 'processing' && (
            <motion.div key="processing" {...pageVariants} className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center animate-pulse">
                <Zap className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold">Processing Transaction...</h3>
              <p className="text-sm text-muted-foreground">Applying changes and updating records</p>
            </motion.div>
          )}

          {/* VERIFICATION STAGE */}
          {workflow.stage === 'verification' && (
            <motion.div key="verification" {...pageVariants} className="space-y-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-info" />
                <p className="text-sm font-medium text-info">Customer verification required</p>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Please Verify Details</h4>
                {summaryFields.map((field) => (
                  <div key={field.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                    <span className="text-sm font-medium text-foreground">{field.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button onClick={() => goToStage('input')} variant="outline" className="flex-1 touch-target">
                  Request Changes
                </Button>
                <Button 
                  onClick={() => goToStage('authorization')} 
                  className="flex-1 touch-target gold-gradient text-accent-foreground font-semibold shadow-gold"
                >
                  Confirm & Verify
                </Button>
              </div>
            </motion.div>
          )}

          {/* AUTHORIZATION STAGE */}
          {workflow.stage === 'authorization' && (
            <motion.div key="authorization" {...pageVariants} className="space-y-6 max-w-lg mx-auto text-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <ThumbsUp className="h-5 w-5 text-accent" />
                <p className="text-sm font-medium">Awaiting supervisor authorization</p>
              </div>
              <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-8">
                <Shield className="h-12 w-12 text-accent mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">Supervisor approval is required to complete this transaction</p>
                <Button 
                  onClick={() => {
                    handleFinalSubmit();
                    setTimeout(() => goToStage('cross-sell'), 1000);
                  }} 
                  className="touch-target gold-gradient text-accent-foreground font-semibold shadow-gold"
                >
                  Authorize Transaction
                </Button>
              </div>
            </motion.div>
          )}

          {/* CROSS-SELL / SUCCESS STAGE */}
          {workflow.stage === 'cross-sell' && (
            <motion.div key="cross-sell" {...pageVariants} className="space-y-6 max-w-lg mx-auto">
              <div className="text-center mb-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/10 mb-3">
                  <Check className="h-7 w-7 text-success" />
                </div>
                <h3 className="font-display text-xl font-semibold">Transaction Successful!</h3>
                <p className="text-sm text-muted-foreground mt-1">Your transaction has been processed and authorized.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-accent" />
                  <h4 className="font-semibold text-base">You might also be interested in</h4>
                </div>
                {CROSS_SELL_OFFERS.map((offer) => (
                  <button
                    key={offer.title}
                    className="w-full flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left hover:shadow-card transition-shadow touch-target group"
                  >
                    <span className="text-2xl">{offer.icon}</span>
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm">{offer.title}</h5>
                      <p className="text-xs text-muted-foreground">{offer.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>

              <Button onClick={() => goToStage('feedback')} className="w-full touch-target gold-gradient text-accent-foreground font-semibold shadow-gold mt-2">
                Continue
              </Button>
            </motion.div>
          )}

          {/* FEEDBACK STAGE */}
          {workflow.stage === 'feedback' && (
            <motion.div key="feedback" {...pageVariants} className="space-y-6 max-w-lg mx-auto text-center">
              <h3 className="font-display text-xl font-semibold">How was your experience?</h3>
              <p className="text-sm text-muted-foreground">Your feedback helps us improve our services</p>

              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className="touch-target p-1"
                  >
                    <Star className={`h-10 w-10 transition-colors ${star <= feedbackRating ? 'text-accent fill-accent' : 'text-border'}`} />
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="Any additional comments or service requests? (optional)"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="touch-target"
                rows={3}
              />

              <div className="flex gap-3">
                <Button onClick={handleFeedbackSubmit} variant="outline" className="flex-1 touch-target">
                  Skip
                </Button>
                <Button onClick={handleFeedbackSubmit} className="flex-1 touch-target gold-gradient text-accent-foreground font-semibold shadow-gold">
                  Submit Feedback
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};