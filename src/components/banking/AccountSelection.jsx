import { useEffect, useState } from "react";

export const AccountSelection = ({ customer, onContinue }) => {
  const [accountTypes, setAccountTypes] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [addons, setAddons] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);

  // FETCH ACCOUNT TYPES
  useEffect(() => {
    fetch("https://snapsterbe.techykarthikbms.com/api/account-types/")
      .then((res) => res.json())
      .then((data) => setAccountTypes(data))
      .catch((err) =>
        console.error("Error fetching account types:", err)
      );
  }, []);

  // SELECT ACCOUNT TYPE
  const handleSelectAccount = (type) => {
    console.log("Selected Account Type:", type);

    setSelectedAccount(type);
    setSelectedAddons([]);

    fetch(`https://snapsterbe.techykarthikbms.com/account-addons/${type.code}/`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Addons API Response:", data);
        setAddons(data);

        // 🔥 Auto-select mandatory addons
        const mandatory = data
          .filter(item => item.is_mandatory)
          .map(item => item.id);

        setSelectedAddons(mandatory);
      })
      .catch((err) =>
        console.error("Error fetching addons:", err)
      );
  };

  // TOGGLE ADDON
  const toggleAddon = (id) => {
    setSelectedAddons((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];

      console.log("Selected Addons:", updated);
      return updated;
    });
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">
        Select Account Type
      </h2>

      {/* ACCOUNT TYPE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {accountTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => handleSelectAccount(type)}
            className={`p-6 border rounded-xl cursor-pointer transition
              ${
                selectedAccount?.id === type.id
                  ? "border-blue-600 bg-blue-50"
                  : "hover:border-blue-400"
              }
            `}
          >
            <h3 className="font-semibold text-lg">
              {type.name}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              {type.description}
            </p>
          </div>
        ))}
      </div>

      {/* ADDONS */}
      {selectedAccount && (
        <>
          <h3 className="text-xl font-semibold mt-10 mb-4">
            Recommended Add-ons
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addons.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleAddon(item.id)}
                className={`p-4 border rounded-lg cursor-pointer transition
                  ${
                    selectedAddons.includes(item.id)
                      ? "border-green-600 bg-green-50"
                      : "hover:border-green-400"
                  }
                `}
              >
                <h4 className="font-medium">
                  {item.addon?.name}
                </h4>

                <p className="text-sm text-gray-500">
                  {item.addon?.description}
                </p>

                {item.is_mandatory && (
                  <p className="text-xs text-red-500 mt-1">
                    Mandatory
                  </p>
                )}

                {item.is_recommended && !item.is_mandatory && (
                  <p className="text-xs text-blue-500 mt-1">
                    Recommended
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8">
            <button
              onClick={() => {
                console.log("Continue Clicked:");
                console.log("Account:", selectedAccount);
                console.log("Addons:", selectedAddons);
                onContinue(selectedAccount, selectedAddons);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Continue
            </button>
          </div>
        </>
      )}
    </div>
  );
};