import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';
import ServiceCard from '@/components/banking/ServiceCard';
import { ChatPanel } from '@/components/banking/ChatPanel';
import { TransactionWorkflow } from '@/components/banking/TransactionWorkflow';
import { FxTicker } from '@/components/banking/FxTicker';
import { CrossSellCard } from '@/components/banking/CrossSellCard';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;

  const [serviceCategories, setServiceCategories] = useState({});
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const categoryServices = useMemo(() => {
    if (!selectedCategory) return [];
    return services.filter(s => s.category === selectedCategory);
  }, [selectedCategory, services]);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return services.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  }, [searchQuery, services]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/view_api_service_groups1/");
        if (!response.ok) throw new Error("Server error");

        const data = await response.json();

        const categoriesObj = {};
        const servicesArr = [];

        data.forEach(category => {
          categoriesObj[category.key] = {
            label: category.label,
            description: category.description,
            icon: category.icon || "LayoutGrid",
            color: category.color || "blue",
          };

          if (Array.isArray(category.services)) {
            category.services.forEach(service => {
              servicesArr.push({
                id: service.service_id,
                title: service.title,
                description: service.description,
                category: category.key,
                icon: service.icon || "Circle",
              });
            });
          }
        });
        setServiceCategories(categoriesObj);
        setServices(servicesArr);
      } catch (err) {
        console.error("Failed to load services", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

const openCategory = async (cat) => {
  try {
    setLoading(true);

    // Call Django API with group_code
    const response = await fetch(
      `http://127.0.0.1:8000/view_api_service_types_by_group/${cat}/`
    );

    if (!response.ok) throw new Error("Failed to fetch service types");

    const data = await response.json();

    // Map API response to your services format
    const servicesArr = data.map(service => ({
      id: service.id,  // or service.service_id
      title: service.title,
      description: service.description,
      category: cat,
      icon: service.icon || "Circle",
    }));

    setServices(servicesArr);
    setSelectedCategory(cat);
    setView('category');
    setSearchQuery('');

  } catch (error) {
    console.error("Error loading service types:", error);
  } finally {
    setLoading(false);
  }
};
  const openService = (service) => {
    setSelectedService(service);
    setView('workflow');
  };

  const goHome = () => {
    setView('dashboard');
    setSelectedCategory(null);
    setSelectedService(null);
    setSearchQuery('');
  };

  const goBack = () => {
    if (view === 'workflow') {
      setView('category');
      setSelectedService(null);
    } else if (view === 'reset-password') {
      setView('dashboard');
    } else {
      goHome();
    }
  };

  const handleLogout = () => {
    setNavDropdownOpen(false);
    navigate('/');
  };

  const handleResetPassword = () => {
    setNavDropdownOpen(false);
    setView('reset-password');
  };

  const handlePasswordUpdate = () => {
    alert('Password updated successfully!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setView('dashboard');
  };

  if (loading) {
    return <div className="p-8">Loading services...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader
        customerName={customer?.fullName || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onResetPassword={handleResetPassword}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">

          {view === 'workflow' && selectedService && (
            <motion.div key="workflow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <TransactionWorkflow
                service={selectedService}
                customer={customer}
                onBack={goBack}
                onComplete={goHome}
              />
            </motion.div>
          )}

          {view === 'category' && selectedCategory && serviceCategories[selectedCategory] && (
            <motion.div key="category" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 overflow-auto h-full">

              <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={goHome}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="font-display text-2xl font-bold">
                    {serviceCategories[selectedCategory].label}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {serviceCategories[selectedCategory].description}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                {categoryServices.map((service, i) => (
                  <motion.div key={service.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <ServiceCard
                      icon={service.icon}
                      title={service.title}
                      description={service.description}
                      onClick={() => openService(service)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 overflow-auto h-full">

              <div className="relative max-w-xl mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services..."
                  className="w-full rounded-xl border border-input bg-card pl-12 pr-4 py-4"
                />
              </div>

              {!filteredServices && (
                <>
                  <h2 className="font-display text-xl font-semibold mb-5">
                    How can we help you today?
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Object.entries(serviceCategories).map(([key, cat], i) => (
                      <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}>
                        <ServiceCard
                          variant="category"
                          icon={cat.icon}
                          title={cat.label}
                          description={cat.description}
                          onClick={() => openCategory(key)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <ChatPanel isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
    </div>
  );
};

export default DashboardPage;