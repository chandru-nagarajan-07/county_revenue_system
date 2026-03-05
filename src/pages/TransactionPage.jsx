// src/pages/TransactionPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TransactionWorkflow } from '@/components/banking/TransactionWorkflow';

const TransactionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Retrieve service and customer data passed via navigation state
  const { service, customer } = location.state || {};

  const [formFields, setFormFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // Redirect if no service data is present (e.g., direct URL access)
  useEffect(() => {
    if (!service) {
      navigate('/dashboard');
    }
  }, [service, navigate]);

  // Fetch Form Fields for this specific service
  useEffect(() => {
    const fetchFormFields = async () => {
      if (!service?.code) return;
      
      try {
        setLoadingFields(true);
        const response = await fetch(
          `http://127.0.0.1:8000/view_api_formfields_by_service/${service.code}/`
        );
        const data = await response.json();
        setFormFields(data || []);
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
    navigate(-1); // Go back to the previous page (Dashboard/Category)
  };

  const handleComplete = () => {
    navigate('/dashboard'); // Go home after completion
  };

  if (!service) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, x: 50 }} 
        animate={{ opacity: 1, x: 0 }} 
        exit={{ opacity: 0, x: -50 }} 
        className="h-full flex-1"
      >
        <TransactionWorkflow
          service={service}
          customer={customer}
          onBack={handleBack}
          onComplete={handleComplete}
          formFields={formFields}
          isLoadingFields={loadingFields}
        />
      </motion.div>
    </div>
  );
};

export default TransactionPage;