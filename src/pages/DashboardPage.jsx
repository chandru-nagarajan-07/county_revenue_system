import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';
import ServiceCard from '@/components/banking/ServiceCard';
import { ChatPanel } from '@/components/banking/ChatPanel';
import { TransactionWorkflow } from '@/components/banking/TransactionWorkflow';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const stateCustomer = location.state?.customer;
  const savedCustomer = JSON.parse(localStorage.getItem("customer"));
  const customer = stateCustomer || savedCustomer;

  const [serviceCategories, setServiceCategories] = useState({});
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formFieldsLoading, setFormFieldsLoading] = useState(false);

  const [view, setView] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceFormFields, setServiceFormFields] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  useEffect(() => {
    if (stateCustomer) {
      localStorage.setItem("customer", JSON.stringify(stateCustomer));
    }
  }, [stateCustomer]);

  useEffect(() => {
    if (!customer) {
      navigate('/');
    }
  }, [customer, navigate]);

  // FETCH SERVICE GROUPS
  useEffect(() => {
    const fetchServiceGroups = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/view_api_service_groups1/"
        );
        const data = await response.json();

        const categoriesObj = {};

        (data || []).forEach(category => {
          categoriesObj[category.key] = {
            label: category.label,
            description: category.description,
            icon: category.icon || "LayoutGrid",
            color: category.color || "blue",
          };
        });

        setServiceCategories(categoriesObj);
      } catch (err) {
        console.error("Failed to load service groups", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceGroups();
  }, []);

  const openCategory = async (groupCode) => {
    try {
      setLoading(true);

      const response = await fetch(
        `http://127.0.0.1:8000/view_api_service_types_by_group/${groupCode}/`
      );

      const data = await response.json();

      const servicesArr = (data || []).map(service => ({
        id: service.code,
        code: service.code,
        title: service.name,
        description: service.description,
        icon: service.icon || "Circle",
      }));

      setServices(servicesArr);
      setSelectedCategory(groupCode);
      setView('category');

    } catch (error) {
      console.error("Error loading service types:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormFields = async (serviceCode) => {
    try {
      setFormFieldsLoading(true);

      const response = await fetch(
        `http://127.0.0.1:8000/view_api_formfields_by_service/${serviceCode}/`
      );

      const data = await response.json();
      setServiceFormFields(data || []);

    } catch (error) {
      console.error("Error loading form fields:", error);
      setServiceFormFields([]);
    } finally {
      setFormFieldsLoading(false);
    }
  };

  const openService = async (service) => {
    await fetchFormFields(service.code);
    setSelectedService(service);
    setView('workflow');
  };

  const goHome = () => {
    setView('dashboard');
    setSelectedCategory(null);
    setSelectedService(null);
    setServiceFormFields([]);
  };

  const goBack = () => {
    if (view === 'workflow') {
      setView('category');
      setSelectedService(null);
      setServiceFormFields([]);
    } else {
      goHome();
    }
  };

  if (!customer) return null;
  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background">

      <DashboardHeader
        customerName={customer?.fullName || customer?.name || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onLogout={() => {
          localStorage.removeItem("customer");
          navigate('/');
        }}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">

          {view === 'workflow' && selectedService && (
            <motion.div key="workflow" className="h-full">
              {formFieldsLoading ? (
                <div className="flex items-center justify-center h-full">
                  Loading form fields...
                </div>
              ) : (
                <TransactionWorkflow
                  service={selectedService}
                  customer={customer}
                  formFields={serviceFormFields}
                  onBack={goBack}
                  onComplete={goHome}
                />
              )}
            </motion.div>
          )}

          {view === 'category' && selectedCategory && (
            <motion.div key="category" className="p-8 overflow-auto h-full">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={goHome}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <h2 className="text-2xl font-bold">
                  {serviceCategories[selectedCategory]?.label}
                </h2>
              </div>

              <div className="grid gap-3">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    icon={service.icon}
                    title={service.title}
                    description={service.description}
                    onClick={() => openService(service)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div key="dashboard" className="p-8 overflow-auto h-full">
              <h2 className="text-xl font-semibold mb-5">
                How can we help you today?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.entries(serviceCategories).map(([key, cat]) => (
                  <ServiceCard
                    key={key}
                    variant="category"
                    icon={cat.icon}
                    title={cat.label}
                    description={cat.description}
                    onClick={() => openCategory(key)}
                  />
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <ChatPanel
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
      />
    </div>
  );
};

export default DashboardPage;