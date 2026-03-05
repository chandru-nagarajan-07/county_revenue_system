import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TransactionWorkflow } from '@/components/banking/TransactionWorkflow';
const TransactionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { service, customer } = location.state || {};

  const [formFields, setFormFields] = useState([]);
  const [DynamicForm, setDynamicForm] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!service) {
      navigate("/dashboard");
    }
  }, [service]);

  useEffect(() => {
    const fetchForm = async () => {
      if (!service?.code) return;

      try {
        setLoading(true);

        const response = await fetch(
          `http://127.0.0.1:8000/view_api_formfields_by_service/${service.code}/`
        );

        const data = await response.json();

        console.log("Form API:", data);

        setFormFields(data.fields || []);

        const FormComponent = TransactionWorkflow[data.form_component];

        setDynamicForm(() => FormComponent);

      } catch (error) {
        console.error("Error loading form:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [service]);

  const handleComplete = () => {
    navigate("/dashboard");
  };

  if (!service) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 p-6"
      >

        <h2 className="text-xl font-semibold mb-6">
          {service.name} Transaction
        </h2>

        {loading && (
          <p className="text-gray-500">Loading form...</p>
        )}

        {DynamicForm && (
          <DynamicForm
            fields={formFields}
            service={service}
            customer={customer}
            onComplete={handleComplete}
          />
        )}

      </motion.div>

    </div>
  );
};

export default TransactionPage;