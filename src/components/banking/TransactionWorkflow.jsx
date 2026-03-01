import { useMemo, useState } from "react";
import { getEligibleAccounts } from "@/data/demoCustomers";

export const TransactionWorkflow = ({
  service,
  customer,
  formFields = [],
  onBack,
  onComplete,
}) => {

  const [formData, setFormData] = useState({});

  // SAFE FILTERING
  const eligibleAccounts = useMemo(() => {
    return getEligibleAccounts(customer, service);
  }, [customer, service]);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = () => {
    console.log("Submitting Data:", {
      service,
      customer,
      formData,
    });

    onComplete();
  };

  return (
    <div className="p-8 overflow-auto h-full">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="text-primary font-medium"
        >
          ← Back
        </button>

        <h2 className="text-2xl font-bold">
          {service?.title}
        </h2>
      </div>

      {/* ACCOUNTS SECTION */}
      {eligibleAccounts.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">
            Eligible Accounts
          </h3>

          <div className="space-y-2">
            {eligibleAccounts.map((acc, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg"
              >
                <p><strong>Account:</strong> {acc.account_number}</p>
                <p><strong>Type:</strong> {acc.account_type}</p>
                <p><strong>Status:</strong> {acc.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DYNAMIC FORM FIELDS */}
      <div className="space-y-4">
        {formFields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">
              {field.label}
              {field.is_required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>

            <input
              type={field.field_type || "text"}
              className="w-full border rounded-lg px-3 py-2"
              required={field.is_required}
              value={formData[field.field_name] || ""}
              onChange={(e) =>
                handleChange(field.field_name, e.target.value)
              }
            />
          </div>
        ))}
      </div>

      {/* SUBMIT BUTTON */}
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          className="bg-primary text-white px-4 py-2 rounded-lg"
        >
          Submit
        </button>
      </div>
    </div>
  );
};