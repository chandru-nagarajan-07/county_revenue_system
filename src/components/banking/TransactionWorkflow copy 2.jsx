import { useMemo, useState } from "react";
import { getEligibleAccounts } from "@/data/demoCustomers";

export const TransactionWorkflow = ({
  service,
  customer,
  formFields = [],
  selectedAccountType,
  selectedAddons = [],
  onBack,
  onComplete,
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const eligibleAccounts = useMemo(() => {
    return getEligibleAccounts(customer, service);
  }, [customer, service]);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    if (errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: null,
      }));
    }
  };

  const validate = () => {
    let tempErrors = {};

    formFields.forEach((field) => {
      if (field.is_required && !formData[field.field_name]) {
        tempErrors[field.field_name] =
          "This field is required";
      }
    });

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      service_code: service?.code,
      customer_id: customer?.id || customer?.user_ID,
      account_type_id: selectedAccountType?.id,
      account_type_code: selectedAccountType?.code,
      selected_addons: selectedAddons,
      form_data: formData,
    };

    console.log("FINAL SUBMIT:", payload);

    fetch("https://snapsterbe.techykarthikbms.com/create_api_formfields1/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    onComplete();
  };

  const renderField = (field) => {
    const commonProps = {
      className:
        "w-full border rounded-lg px-3 py-2",
      required: field.is_required,
      value: formData[field.field_name] || "",
      onChange: (e) =>
        handleChange(field.field_name, e.target.value),
    };

    switch (field.field_type) {
      case "text":
        return <input type="text" {...commonProps} />;

      case "number":
        return <input type="number" {...commonProps} />;

      case "date":
        return <input type="date" {...commonProps} />;

      case "textarea":
        return <textarea {...commonProps} />;

      default:
        return <input type="text" {...commonProps} />;
    }
  };

  return (
    <div className="p-8 overflow-auto h-full">
      <button
        onClick={onBack}
        className="mb-6 text-primary"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold mb-6">
        {service?.title}
      </h2>

      {/* SHOW SELECTED ACCOUNT */}
      {selectedAccountType && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <p>
            <strong>Account Type:</strong>{" "}
            {selectedAccountType.name}
          </p>
        </div>
      )}

      {/* DYNAMIC FORM */}
      {formFields
        .sort((a, b) => a.order - b.order)
        .map((field) => (
          <div key={field.id} className="mb-4">
            <label className="block mb-1 font-medium">
              {field.label}
            </label>
            {renderField(field)}
            {errors[field.field_name] && (
              <p className="text-red-500 text-sm">
                {errors[field.field_name]}
              </p>
            )}
          </div>
        ))}

      <button
        onClick={handleSubmit}
        className="bg-primary text-white px-6 py-2 rounded-lg"
      >
        Submit
      </button>
    </div>
  );
};