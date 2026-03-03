import { useEffect, useState } from "react";

const STEPS = [
  "Input",
  "Validate",
  "Review",
  "Process",
  "Verify",
  "Approve",
];

export const TransactionWorkflow = ({
  service,
  customer: propCustomer,
  formFields = [],
  onBack,
  onComplete,
}) => {

  const sessionCustomer = JSON.parse(sessionStorage.getItem("customer"));

  const customer = propCustomer || sessionCustomer;
  console.log("Customer in workflow:", customer);
  const [step, setStep] = useState(1);
  const [accountTypes, setAccountTypes] = useState([]);
  const [addonsMap, setAddonsMap] = useState({});
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [formData, setFormData] = useState({});
  const [officerNotes, setOfficerNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(null);
  const [additionalComments, setAdditionalComments] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [reviewCompleted, setReviewCompleted] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/account-types/")
      .then(res => res.json())
      .then(data => setAccountTypes(data))
      .catch(err => console.error(err));
  }, []);

  // Auto-advance review step after 3 seconds
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
    const exists = selectedAccounts.find(
      acc => acc.account.id === account.id
    );

    if (exists) {
      setSelectedAccounts(prev =>
        prev.filter(a => a.account.id !== account.id)
      );
      return;
    }

    const res = await fetch(
      `http://127.0.0.1:8000/account-addons/${account.code}/`
    );
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
    setSelectedAccounts(prev =>
      prev.filter(a => a.account.id !== accountId)
    );
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

  const itemCount = selectedAccounts.reduce(
    (total, acc) => total + 1 + acc.addons.length,
    0
  );

  const handleSubmit = async () => {
    const payload = {
      service_code: service?.code,
      service_name: service?.title,
      customer_id: customer?.id || customer?.user_ID,
      selections: selectedAccounts,
      form_data: formData,
      officer_notes: officerNotes,
    };

    await fetch("http://127.0.0.1:8000/create_api_formfields1/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    onComplete();
  };

  const handleFeedbackSubmit = () => {
    console.log("Feedback submitted:", { rating, feedback, additionalComments });
    onComplete();
  };

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

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={() => setRating(star)}
        className={`text-2xl ${
          star <= rating ? "text-yellow-400" : "text-gray-300"
        }`}
      >
        ★
      </button>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm">
        <button onClick={onBack} className="mb-4 text-blue-600 text-sm">
          ← Back
        </button>

        <h1 className="text-2xl font-bold mb-6 text-center">
          {service?.title}
        </h1>

        {/* STEP BAR */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((label, index) => {
            const number = index + 1;
            const active = step === number;
            const completed = step > number;

            return (
              <div key={label} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                  ${completed
                    ? "bg-green-500 text-white"
                    : active
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-600"}
                  `}
                >
                  {completed ? "✓" : number}
                </div>
                <span className="text-xs mt-1">{label}</span>
              </div>
            );
          })}
        </div>

        {/* CUSTOMER INFO */}
        <div className="border rounded-lg p-4 mb-6 bg-gray-50 text-sm">
          <p className="font-medium">{customer?.name}</p>
          <p className="text-gray-500">{customer?.email}</p>
          <p className="text-gray-400 text-xs">
            ID: {customer?.user_ID}
          </p>
        </div>

        {/* STEP 1 - INPUT */}
        {step === 1 && (
          <>
            <h2 className="font-semibold mb-4">Select Accounts</h2>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {accountTypes.map(account => {
                const selected = selectedAccounts.some(
                  a => a.account.id === account.id
                );

                return (
                  <div
                    key={account.id}
                    onClick={() => toggleAccount(account)}
                    className={`border rounded-lg p-4 cursor-pointer transition text-sm
                      ${selected
                        ? "border-blue-600 bg-blue-50"
                        : "hover:border-gray-400"}
                    `}
                  >
                    <p className="font-medium">{account.name}</p>
                    <p className="text-xs text-gray-500">
                      {account.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ADDONS */}
            {selectedAccounts.map(item => (
              <div key={item.account.id} className="mb-6">
                <h3 className="font-semibold mb-3 text-sm">
                  Add-ons for {item.account.name}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {(addonsMap[item.account.id] || []).map(addon => (
                    <div
                      key={addon.id}
                      onClick={() =>
                        toggleAddon(item.account.id, addon.id)
                      }
                      className={`border rounded-lg p-3 cursor-pointer text-sm
                        ${item.addons.includes(addon.id)
                          ? "border-green-500 bg-green-50"
                          : "hover:border-gray-400"}
                      `}
                    >
                      {addon.addon?.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* CART */}
            {selectedAccounts.length > 0 && (
              <div className="border rounded-lg p-5 bg-gray-50 mt-6">
                <div className="flex justify-between mb-4">
                  <h3 className="font-semibold text-sm">
                    Your Selection
                  </h3>
                  <span className="text-xs bg-gray-200 px-3 py-1 rounded-full">
                    {itemCount} items
                  </span>
                </div>

                {selectedAccounts.map(item => (
                  <div key={item.account.id} className="mb-4">
                    <div className="flex justify-between bg-white border rounded-lg px-4 py-2 mb-2 text-sm">
                      {item.account.name}
                      <button
                        onClick={() =>
                          removeAccount(item.account.id)
                        }
                        className="text-gray-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>

                    {item.addons.map(addonId => {
                      const addonObj =
                        addonsMap[item.account.id]?.find(
                          a => a.id === addonId
                        );

                      return (
                        <div
                          key={addonId}
                          className="flex justify-between bg-white border rounded-lg px-4 py-2 mb-2 ml-4 text-sm"
                        >
                          {addonObj?.addon?.name}
                          <button
                            onClick={() =>
                              removeAddon(item.account.id, addonId)
                            }
                            className="text-gray-400 hover:text-red-500"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}

                <button
                  onClick={() => setStep(2)}
                  className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 rounded-lg"
                >
                  Submit for Validation ({itemCount} items)
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP 2 - VALIDATE */}
        {step === 2 && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-green-600 text-sm font-medium text-center">
                ✓ Validation passed — Ready for officer review
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-4">Transaction Summary</h2>

            <div className="border rounded-lg p-5 bg-gray-50 text-sm mb-4">
              <div className="flex justify-between mb-3 pb-2 border-b">
                <span className="font-medium">Customer</span>
                <span>{customer?.first_name}</span>
              </div>

              <div className="flex justify-between mb-3 pb-2 border-b">
                <span className="font-medium">Customer ID</span>
                <span>{customer?.user_id}</span>
              </div>

              <div className="flex justify-between mb-3 pb-2 border-b">
                <span className="font-medium">New Account(s)</span>
                <span className="capitalize">{getAccountNames()}</span>
              </div>

              <div className="flex justify-between mb-3 pb-2 border-b">
                <span className="font-medium">Add-on Products</span>
                <span className="capitalize">{getAddonNames() || "None"}</span>
              </div>

              <div className="flex justify-between mb-3 pb-2 border-b">
                <span className="font-medium">Reference / Narration</span>
                <span>Service Charges</span>
              </div>

              <div className="flex justify-between mb-3 pb-2 border-b">
                <span className="font-medium">Premium rate</span>
                <span>-</span>
              </div>

              <div className="flex justify-between mb-3 pb-2 border-b">
                <span className="font-medium">Service Fee</span>
                <span className="text-green-600">FREE</span>
              </div>

              <div className="flex justify-between mb-3">
                <span className="font-medium">Total Charges</span>
                <span className="font-semibold">No Charge</span>
              </div>

              <p className="text-xs text-green-600 mt-2 italic">
                This transaction is free for Premium customers
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Officer Notes (optional)
              </label>
              <textarea
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                placeholder="Add any processing notes..."
                className="w-full border rounded-lg p-3 text-sm"
                rows="3"
              />
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Proceed to Processing
            </button>
          </>
        )}

        {/* STEP 3 - REVIEW */}
        {step === 3 && (
          <>
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Reviewing Transaction</h2>
              <p className="text-gray-600 text-sm">Please wait while we review your request...</p>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              {!reviewCompleted && (
                <p className="text-xs text-gray-500 mt-4">Auto-advancing in 3 seconds...</p>
              )}
            </div>
          </>
        )}

        {/* STEP 4 - PROCESS */}
        {step === 4 && (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="text-yellow-700 text-sm font-medium text-center">
                ⚠️ Customer verification required
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-4">Please Verify Details</h2>

            <div className="border rounded-lg p-5 bg-gray-50 text-sm mb-6">
              <div className="flex justify-between mb-3 pb-2 border-b">
                <span className="font-medium">Customer</span>
                <span>{customer?.first_name}</span>
              </div>

              <div className="flex justify-between mb-3 pb-2 border-b">
                <span className="font-medium">Customer ID</span>
                <span>{customer?.user_id}</span>
              </div>

              <div className="flex justify-between mb-3 pb-2 border-b">
                <span className="font-medium">New Account(s)</span>
                <span className="capitalize">{getAccountNames()}</span>
              </div>

              <div className="flex justify-between mb-3 pb-2 border-b">
                <span className="font-medium">Add-on Products</span>
                <span className="capitalize">{getAddonNames() || "None"}</span>
              </div>

              <div className="flex justify-between mb-3">
                <span className="font-medium">Reference / Narration</span>
                <span>Service Charges</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
              >
                Request Changes
              </button>
              <button
                onClick={() => setStep(5)}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Confirm & Verify
              </button>
            </div>
          </>
        )}

        {/* STEP 5 - VERIFY */}
        {step === 5 && (
          <>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6 text-center">
              <div className="inline-block p-3 bg-purple-100 rounded-full mb-3">
                <span className="text-2xl">⏳</span>
              </div>
              <h2 className="text-lg font-semibold text-purple-800 mb-2">
                Awaiting supervisor authorization
              </h2>
              <p className="text-sm text-purple-600">
                Supervisor approval is required to complete this transaction
              </p>
            </div>

            <button
              onClick={() => setStep(6)}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-semibold"
            >
              Authorize Transaction
            </button>
          </>
        )}

        {/* STEP 6 - APPROVE */}
        {step === 6 && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-6 text-center">
              <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Transaction Successful!
              </h2>
              <p className="text-sm text-green-600">
                Your transaction has been processed and authorized.
              </p>
            </div>

            <h3 className="font-semibold mb-4 text-gray-700">
              You might also be interested in
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="border rounded-lg p-4 text-center hover:shadow-md transition">
                <div className="text-3xl mb-2">💰</div>
                <h4 className="font-medium text-sm">Premium Savings Account</h4>
                <p className="text-xs text-gray-500 mt-1">Earn up to 8.5% p.a. on your savings</p>
              </div>

              <div className="border rounded-lg p-4 text-center hover:shadow-md transition">
                <div className="text-3xl mb-2">📱</div>
                <h4 className="font-medium text-sm">Mobile Banking</h4>
                <p className="text-xs text-gray-500 mt-1">Bank anytime, anywhere with our app</p>
              </div>

              <div className="border rounded-lg p-4 text-center hover:shadow-md transition">
                <div className="text-3xl mb-2">🛡️</div>
                <h4 className="font-medium text-sm">Insurance Cover</h4>
                <p className="text-xs text-gray-500 mt-1">Protect what matters most to you</p>
              </div>
            </div>

            <button
              onClick={() => setStep(7)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Continue
            </button>
          </>
        )}

        {/* STEP 7 - FEEDBACK */}
        {step === 7 && (
          <>
            <h2 className="text-xl font-semibold mb-4 text-center">
              How was your experience?
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Your feedback helps us improve our services
            </p>

            <div className="flex justify-center gap-2 mb-6">
              {renderStars()}
            </div>

            <div className="mb-6">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Any additional comments or service requests? (optional)"
                className="w-full border rounded-lg p-4 text-sm"
                rows="4"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleFeedbackSubmit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Submit Feedback
              </button>
              <button
                onClick={onComplete}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
              >
                Skip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};