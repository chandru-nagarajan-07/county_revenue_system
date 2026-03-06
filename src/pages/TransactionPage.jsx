// src/pages/TransactionPage.jsx

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

/* --- Banking Components --- */
import { TransactionWorkflow } from "@/components/banking/TransactionWorkflow";
import { AccountModificationInput } from "@/components/banking/AccountModificationInput";
import { KycUpdateInput } from "@/components/banking/KycUpdateInput";
import { DenominationExchangeInput } from "@/components/banking/DenominationExchangeInput";
import { FundsTransferInput } from "@/components/banking/FundsTransferInput";
import { BillPaymentInput  } from "@/components/banking/BillPaymentInput";
import  StandingOrderInput  from "@/components/banking/StandingOrderInput";
import { CardServicesInput } from "@/components/banking/CardServicesInput";

/* --- Service → Component Map --- */
const SERVICE_COMPONENTS = {
  "open new account": TransactionWorkflow,
  "kyc update": KycUpdateInput,
  "account modification": AccountModificationInput,
  "standing order": StandingOrderInput,
  "denomination exchange": DenominationExchangeInput,
  "funds transfer": FundsTransferInput,
  "bill payment": BillPaymentInput ,
  "card issuance": CardServicesInput,
  "card replacement": CardServicesInput,
  "pin management": CardServicesInput,
  "card limit update": CardServicesInput

};

const TransactionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { service, customer } = location.state || {};

  const [formFields, setFormFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [serviceLabel, setServiceLabel] = useState(null);

  /* --- Redirect if service missing --- */
  useEffect(() => {
    if (!service) {
      navigate("/dashboard");
    }
  }, [service, navigate]);

  /* --- Fetch Form Fields + Label from API --- */
  useEffect(() => {
    const fetchFormFields = async () => {
      if (!service?.code) return;

      try {
        setLoadingFields(true);

        const response = await fetch(
          `http://127.0.0.1:8000/view_api_formfields_by_service/${service.code}/`
        );

        const data = await response.json();

        // API returns array
        setFormFields(data || []);

        // take label from first item
        const label = data?.[0]?.label?.toLowerCase();
        setServiceLabel(label);

        console.log("Fetched API Response:", data);
        console.log("Detected Service Label:", label);

      } catch (error) {
        console.error("Error loading form fields:", error);
        setFormFields([]);
      } finally {
        setLoadingFields(false);
      }
    };

    fetchFormFields();
  }, [service]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleComplete = () => {
    navigate("/dashboard");
  };

  if (!service) return null;

  /* --- Component selection using API label --- */
  const SelectedComponent = SERVICE_COMPONENTS[serviceLabel];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="h-full flex-1"
      >
        {SelectedComponent ? (
          <SelectedComponent
            service={service}
            customer={customer}
            onBack={handleBack}
            onComplete={handleComplete}
            formFields={formFields}
            isLoadingFields={loadingFields}
          />
        ) : (
          <div className="p-6 text-red-500">
            Service "{serviceLabel}" not implemented.
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TransactionPage;