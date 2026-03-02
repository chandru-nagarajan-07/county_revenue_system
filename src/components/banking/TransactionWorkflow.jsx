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
  customer,
  formFields = [],
  onBack,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [accountTypes, setAccountTypes] = useState([]);
  const [addonsMap, setAddonsMap] = useState({});
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/account-types/")
      .then(res => res.json())
      .then(data => setAccountTypes(data))
      .catch(err => console.error(err));
  }, []);

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
    };

    await fetch("http://127.0.0.1:8000/create_api_formfields1/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    onComplete();
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

        {/* STEP 1 */}
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

        {/* STEP 2 - VALIDATE SCREEN */}
        {step === 2 && (
          <>
            <div className="text-green-600 text-sm font-medium text-center mb-6">
              ✓ Validation passed — Ready for officer review
            </div>

            <div className="border rounded-lg p-5 bg-gray-50 text-sm mb-6">
              <div className="flex justify-between mb-2">
                <span>Customer</span>
                <span>{customer?.name}</span>
              </div>

              <div className="flex justify-between mb-2">
                <span>Customer ID</span>
                <span>{customer?.user_ID}</span>
              </div>

              <div className="flex justify-between">
                <span>Accounts</span>
                <span>
                  {selectedAccounts.map(a => a.account.name).join(", ")}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white py-2 rounded-lg"
            >
              Confirm & Submit
            </button>
          </>
        )}
      </div>
    </div>
  );
};