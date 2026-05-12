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
  const [errors, setErrors] = useState({});

  // FILTER ELIGIBLE ACCOUNTS
  const eligibleAccounts = useMemo(() => {
    return getEligibleAccounts(customer, service);
  }, [customer, service]);

  // HANDLE CHANGE
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

  // VALIDATION
  const validate = () => {
    let tempErrors = {};

    formFields.forEach((field) => {
      if (field.is_required && !formData[field.field_name]) {
        tempErrors[field.field_name] = "This field is required";
      }
    });

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // SUBMIT
  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      service_code: service?.code,
      customer_id: customer?.id || customer?.user_ID,
      form_data: formData,
    };

    console.log("Submitting Payload:", payload);

    // Example backend call
    
    fetch("http://127.0.0.1:8000/create_api_formfields1/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    

    onComplete();
  };

  // RENDER FIELD
  const renderField = (field) => {
    const commonProps = {
      className: "w-full border rounded-lg px-3 py-2",
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

      case "select":
        return (
          <select {...commonProps}>
            <option value="">Select option</option>
            {field.options?.map((opt, index) => (
              <option key={index} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "fk":
        return (
          <select
            className="w-full border rounded-lg px-3 py-2"
            required={field.is_required}
            value={formData[field.field_name] || ""}
            onChange={(e) =>
              handleChange(field.field_name, e.target.value)
            }
          >
            <option value="">Select option</option>
            {field.options?.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        );

      default:
        return <input type="text" {...commonProps} />;
    }
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

      {/* ELIGIBLE ACCOUNTS */}
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
        {formFields
          .sort((a, b) => a.order - b.order)
          .map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium mb-1">
                {field.label}
                {field.is_required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>

              {renderField(field)}

              {errors[field.field_name] && (
                <p className="text-red-500 text-sm mt-1">
                  {errors[field.field_name]}
                </p>
              )}
            </div>
          ))}
      </div>

      {/* SUBMIT BUTTON */}
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90"
        >
          Submit
        </button>
      </div>
    </div>
  );
};