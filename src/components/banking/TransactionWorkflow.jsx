import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Landmark, Wallet, Smartphone, CreditCard, CheckCircle2, Loader2, Check, ThumbsUp } from "lucide-react";
import { DashboardHeader } from "@/components/banking/DashboardHeader";

const STEPS = ["Input", "Validate", "Review", "Process", "Verification"];

export const TransactionWorkflow = ({
  service,
  customer: propCustomer,
  formFields = [],
  onBack,
  onComplete,
}) => {
  const navigate = useNavigate();
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  let sessionUser = {};
  try {
    sessionUser = JSON.parse(sessionStorage.getItem("userData1")) || {};
  } catch {
    sessionUser = {};
  }
  const accounts = sessionUser?.account || [];
  const branch = sessionUser?.branch || [];

  useEffect(() => {
    if (propCustomer) {
      setCustomer(propCustomer);
      return;
    }
    try {
      const sessionData = sessionStorage.getItem("customer");
      if (sessionData) setCustomer(JSON.parse(sessionData));
    } catch (e) {
      console.error(e);
    }
    if (sessionUser && Object.keys(sessionUser).length > 0) {
      setCustomer(sessionUser);
    }
  }, [propCustomer, sessionUser]);

  const getCustomerId = () => {
    if (!customer) return null;
    return (
      customer.id ||
      customer.customer_id ||
      customer.customerId ||
      customer.user_id ||
      customer.user_ID ||
      customer.userId ||
      customer.ID
    );
  };

  const [step, setStep] = useState(1);
  const [accountTypes, setAccountTypes] = useState([]);
  const [addonsMap, setAddonsMap] = useState({});
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [officerNotes, setOfficerNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(null);
  const [reviewCompleted, setReviewCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("https://snapsterbe.techykarthikbms.com/api/account-types/")
      .then((res) => res.json())
      .then((data) => setAccountTypes(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    let timer;
    if (step === 3 && !reviewCompleted) {
      timer = setTimeout(() => {
        setReviewCompleted(true);
        setStep(4);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [step, reviewCompleted]);

  const toggleAccount = async (account) => {
    const exists = selectedAccounts.find((acc) => acc.account.id === account.id);
    if (exists) {
      setSelectedAccounts((prev) => prev.filter((a) => a.account.id !== account.id));
      return;
    }
    try {
      const res = await fetch(`https://snapsterbe.techykarthikbms.com/account-addons/${account.code}/`);
      const data = await res.json();
      setAddonsMap((prev) => ({ ...prev, [account.id]: data }));
      setSelectedAccounts((prev) => [...prev, { account, addons: [] }]);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleAddon = (accountId, addonId) => {
    setSelectedAccounts((prev) =>
      prev.map((item) => {
        if (item.account.id !== accountId) return item;
        const exists = item.addons.includes(addonId);
        return {
          ...item,
          addons: exists ? item.addons.filter((id) => id !== addonId) : [...item.addons, addonId],
        };
      })
    );
  };

  const removeAccount = (accountId) => {
    setSelectedAccounts((prev) => prev.filter((a) => a.account.id !== accountId));
  };

  const removeAddon = (accountId, addonId) => {
    setSelectedAccounts((prev) =>
      prev.map((item) => {
        if (item.account.id !== accountId) return item;
        return { ...item, addons: item.addons.filter((id) => id !== addonId) };
      })
    );
  };

  const itemCount = selectedAccounts.reduce((total, acc) => total + 1 + acc.addons.length, 0);

  const handleValidate = () => {
    if (selectedAccounts.length === 0) {
      alert("Please select at least one account");
      return;
    }
    setStep(2);
  };

  const handleAddToCart = async () => {
    if (selectedAccounts.length === 0) {
      alert("Please select at least one account");
      return;
    }
    if (!customer) {
      alert("Customer information is missing. Please go back and select a customer.");
      return;
    }
    const customerId = getCustomerId();
    if (!customerId) {
      alert(`Customer ID is missing. Customer data: ${JSON.stringify(customer)}`);
      return;
    }

    setLoading(true);
    try {
      let lastTransactionId = null;
      let successCount = 0;
      let errorCount = 0;

      for (const selected of selectedAccounts) {
        const fee = parseFloat(service?.service_fee || 0);
        const payload = {
          customer: customerId,
          account_type: selected.account.id,
          selected_addons: selected.addons,
          service_charge: fee,
          feedback_rating: rating,
          remarks: feedback || officerNotes || "Transaction completed successfully",
          status: "APPROVED",
        };

        try {
          const response = await fetch("https://snapsterbe.techykarthikbms.com/api/service-transaction/", {
            method: "POST ",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await response.json();
          if (!response.ok) {
            errorCount++;
            alert(`Failed to create transaction for ${selected.account.name}: ${JSON.stringify(data)}`);
          } else {
            successCount++;
            lastTransactionId = data.id;
          }
        } catch (error) {
          console.error(error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        setTransactionId(lastTransactionId);
        alert(`${successCount} transaction(s) completed successfully!`);
        onComplete();
      } else {
        alert("Failed to create any transactions. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getAccountNames = () => {
    return selectedAccounts.map((a) => a.account.name).join(", ");
  };

  const getAddonNames = () => {
    const allAddons = [];
    selectedAccounts.forEach((item) => {
      item.addons.forEach((addonId) => {
        const addonObj = addonsMap[item.account.id]?.find((a) => a.id === addonId);
        if (addonObj) allAddons.push(addonObj.addon?.name);
      });
    });
    return allAddons.join(", ");
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={() => setRating(star)}
        type="button"
        className={`text-2xl transition-colors ${star <= rating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"}`}
      >
        ★
      </button>
    ));
  };

  const getAccountIcon = (name) => {
    if (!name) return <Landmark className="w-5 h-5" />;
    const n = name.toLowerCase();
    if (n.includes("savings")) return <Landmark className="w-5 h-5 text-primary-600" />;
    if (n.includes("current")) return <Wallet className="w-5 h-5 text-primary-600" />;
    return <Landmark className="w-5 h-5" />;
  };

  const getAddonIcon = (name) => {
    if (!name) return <CreditCard className="w-4 h-4" />;
    const n = name.toLowerCase();
    if (n.includes("mobile")) return <Smartphone className="w-4 h-4 text-purple-600" />;
    if (n.includes("visa") || n.includes("debit")) return <CreditCard className="w-4 h-4 text-indigo-600" />;
    return <CheckCircle2 className="w-4 h-4" />;
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Customer Data Missing</h2>
          <p className="text-gray-600 mb-6">Unable to load customer information. Please go back and select a customer.</p>
          <button onClick={onBack} className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader
        customerName={customer?.fullName || customer?.name || customer?.first_name || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => {
          localStorage.removeItem("customer");
          sessionStorage.removeItem("customer");
          navigate("/");
        }}
      />

      {/* Sticky Header with Back Button & Stepper */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4 mb-3 max-w-5xl mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Open New Account</h1>
            <p className="text-xs text-gray-500">
              Step {step} of {STEPS.length}: {step <= STEPS.length ? STEPS[step - 1] : "Feedback"}
            </p>
          </div>
        </div>

        {/* Round Stepper - primary THEME */}
        {step <= STEPS.length && (
          <div className="flex items-center w-full mt-2 px-1 max-w-5xl mx-auto">
            {STEPS.map((stepName, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < step;
              const isCurrent = stepNumber === step;

              return (
                <div key={stepName} className="flex items-center flex-1 last:flex-none">
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
                      {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-[10px] font-bold">{stepNumber}</span>}
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
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {/* STEP 1 - INPUT */}
            {step === 1 && (
              <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                {/* Customer Info Card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                    {customer?.first_name?.charAt(0) || customer?.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {customer?.first_name} {customer?.last_name} {customer?.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      ID: {customer?.user_id || customer?.id || "N/A"} • {customer?.email || "No email"}
                    </p>
                    {accounts && accounts.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">{accounts.length} account(s) available</p>
                    )}
                  </div>
                </div>

                {/* Select Accounts Section */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Accounts</h2>
                  <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
                    {accountTypes.map((account) => {
                      const selected = selectedAccounts.some((a) => a.account.id === account.id);
                      return (
                        <div
                          key={account.id}
                          onClick={() => toggleAccount(account)}
                          className={`border rounded-xl p-5 cursor-pointer transition-all duration-150 relative group ${
                            selected
                              ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500 shadow-sm"
                              : "border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm"
                          }`}
                        >
                          {selected && (
                            <div className="absolute top-3 right-3">
                              <CheckCircle2 className="w-5 h-5 text-primary-500" />
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${selected ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"}`}>
                              {getAccountIcon(account.name)}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 text-sm">{account.name}</p>
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{account.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ADDONS */}
                {selectedAccounts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Recommended Add-ons</h3>
                    {selectedAccounts.map((item) => (
                      <div key={item.account.id} className="mb-4">
                        <p className="text-xs text-gray-500 mb-2 font-medium">For {item.account.name}</p>
                        <div className="grid grid-cols-2 gap-3">
                          {(addonsMap[item.account.id] || []).map((addon) => (
                            <div
                              key={addon.id}
                              onClick={() => toggleAddon(item.account.id, addon.id)}
                              className={`border rounded-lg p-3 cursor-pointer transition-all flex items-center gap-3 ${
                                item.addons.includes(addon.id)
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                            >
                              <div
                                className={`p-1.5 rounded ${
                                  item.addons.includes(addon.id) ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {getAddonIcon(addon.addon?.name)}
                              </div>
                              <span
                                className={`text-sm font-medium ${item.addons.includes(addon.id) ? "text-green-700" : "text-gray-700"}`}
                              >
                                {addon.addon?.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CART */}
                {selectedAccounts.length > 0 && (
                  <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden mt-6">
                    <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="font-semibold text-sm text-gray-700">Your Selection</h3>
                      <span className="text-xs bg-primary-100 text-primary-700 font-medium px-2.5 py-1 rounded-full">{itemCount} items</span>
                    </div>
                    <div className="p-5 space-y-4">
                      {selectedAccounts.map((item) => (
                        <div key={item.account.id}>
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2 font-medium text-gray-800">
                              <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                              {item.account.name}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeAccount(item.account.id); }} className="text-gray-400 hover:text-red-500 p-1">
                              <span className="text-xs font-semibold">REMOVE</span>
                            </button>
                          </div>
                          {item.addons.length > 0 && (
                            <div className="mt-2 pl-4 border-l-2 border-gray-100 ml-1 space-y-2">
                              {item.addons.map((addonId) => {
                                const addonObj = addonsMap[item.account.id]?.find((a) => a.id === addonId);
                                return (
                                  <div key={addonId} className="flex justify-between items-center text-sm text-gray-600">
                                    <span className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                      <span className="flex items-center gap-2">
                                        {addonObj?.addon?.name}
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-amber-700 font-medium">Add-on</span>
                                      </span>
                                    </span>
                                    <button onClick={(e) => { e.stopPropagation(); removeAddon(item.account.id, addonId); }} className="text-gray-400 hover:text-red-500 text-xs">
                                      ✕
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="px-5 pb-5">
                      <button
                        onClick={handleValidate}
                        className="w-full gold-gradient text-white font-semibold py-3 rounded-lg shadow-md transition-colors"
                      >
                        Submit for Validation ({itemCount} items)
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2 - VALIDATE */}
            {step === 2 && (
              <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-green-50 border-b border-green-100 p-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 text-sm">Validation Passed</h3>
                    <p className="text-xs text-green-700">Ready for officer review</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Service Type</span>
                    <span className="text-sm font-medium text-gray-800">{service?.title || "Account Opening"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Customer</span>
                    <span className="text-sm font-medium text-gray-800">
                      {customer?.first_name} {customer?.last_name} {customer?.name}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Customer ID</span>
                    <span className="text-sm font-medium text-gray-800">{getCustomerId() || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">New Account(s)</span>
                    <span className="text-sm font-medium text-gray-800 capitalize">{getAccountNames()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Add-on Products</span>
                    <span className="text-sm font-medium text-gray-800 capitalize">{getAddonNames() || "None"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Total Charges</span>
                    <span className="text-sm font-bold text-primary-600">{service?.service_fee ? `${service.service_fee}` : "FREE"}</span>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Officer Notes (optional)</label>
                  <textarea
                    value={officerNotes}
                    onChange={(e) => setOfficerNotes(e.target.value)}
                    placeholder="Add any processing notes..."
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none"
                    rows="3"
                  />
                </div>
                <div className="p-6 border-t border-gray-200">
                  <button onClick={() => setStep(3)} className="w-full gold-gradient text-white py-3 rounded-lg font-medium shadow-md">
                    Proceed to Review
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 - REVIEW (Loading) */}
            {step === 3 && (
              <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 text-center border-b border-gray-100">
                  <div className="flex flex-col items-center justify-center mb-4">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
                    <h2 className="text-lg font-semibold text-gray-800">Reviewing Transaction</h2>
                    <p className="text-sm text-gray-500">Please wait while we review your request...</p>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 space-y-3 text-left">
                  <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
                    <span className="text-gray-500">Customer ID</span>
                    <span className="font-medium text-gray-800">{getCustomerId()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
                    <span className="text-gray-500">Add-on Products</span>
                    <span className="font-medium text-gray-800 capitalize">{getAddonNames() || "None"}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-gray-500">Reference / Narration</span>
                    <span className="font-medium text-gray-800 truncate max-w-[200px] text-right">{officerNotes || "N/A"}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4 - PROCESS / VERIFY */}
            {step === 4 && (
              <motion.div key="step4" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-yellow-50 border-b border-yellow-100 p-4 text-center">
                  <span className="text-yellow-700 text-sm font-medium">⚠️ Customer verification required</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Customer</span>
                    <span className="font-medium">{customer?.first_name} {customer?.last_name} {customer?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Customer ID</span>
                    <span className="font-medium text-gray-800">{getCustomerId() || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">New Account(s)</span>
                    <span className="font-medium capitalize">{getAccountNames()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Add-on Products</span>
                    <span className="font-medium text-gray-800 capitalize">{getAddonNames() || "None"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Reference / Narration</span>
                    <span className="font-medium text-gray-800 truncate max-w-[200px] text-right">{officerNotes || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Service Fee</span>
                    <span className="font-bold text-primary-600">{service?.service_fee ? `${service.service_fee}` : "FREE"}</span>
                  </div>
                </div>
                <div className="p-6 flex gap-3 border-t border-gray-200 bg-gray-50">
                  <button onClick={() => setStep(2)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-100 font-medium text-sm">
                    Request Changes
                  </button>
                  <button onClick={() => setStep(5)} className="flex-1 gold-gradient text-white py-2.5 rounded-lg font-medium text-sm shadow-md">
                    Confirm & Add to Cart
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5 - VERIFICATION & ADD TO CART */}
            {step === 5 && (
              <motion.div
                key="step5"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6 max-w-lg mx-auto text-center py-10"
              >
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mb-4">
                  <ThumbsUp className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">Request Complete</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Your account opening request has been processed successfully.
                </p>
                <Button
                  onClick={handleAddToCart}
                  disabled={loading}
                  className="w-full gold-gradient text-accent-foreground font-semibold shadow-gold"
                >
                  {loading ? "Processing..." : "Add to Cart"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};