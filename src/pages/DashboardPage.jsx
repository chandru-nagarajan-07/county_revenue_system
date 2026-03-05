
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';
import ServiceCard from '@/components/banking/ServiceCard';
import { ChatPanel } from '@/components/banking/ChatPanel';

import { CrossSellCard } from '@/components/banking/CrossSellCard';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;

  // --- State Management ---
  const [serviceCategories, setServiceCategories] = useState({});
  const [allServices, setAllServices] = useState([]); // For global search
  const [categoryViewServices, setCategoryViewServices] = useState([]); // For category view
  const [loading, setLoading] = useState(true);


  const [view, setView] = useState('dashboard'); // 'dashboard' or 'category'

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  // Password Reset State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- Computed Values ---
  
  // Services specifically for the Category View
  const displayedCategoryServices = useMemo(() => {
    return categoryViewServices;
  }, [categoryViewServices]);

  // Services for the Search Bar (Searches all known services)
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return allServices.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  }, [searchQuery, allServices]);

  // --- Data Fetching ---

  // 1. Initial Load: Fetch Categories and ALL services (for search)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/view_api_service_groups1/");
        if (!response.ok) throw new Error("Server error");

        const data = await response.json();
        const categoriesObj = {};
        const globalServicesArr = [];

        data.forEach(category => {
          categoriesObj[category.key] = {
            label: category.label,
            description: category.description,
            icon: category.icon || "LayoutGrid",
            color: category.color || "blue",
          };


          if (Array.isArray(category.services)) {
            category.services.forEach(service => {
              globalServicesArr.push({
                id: service.service_id,
                title: service.title,
                description: service.description,
                category: category.key,
                icon: service.icon || "Circle",

                service_fee: service.service_fee || "0.00"
              });
            });
          }
        });

        setServiceCategories(categoriesObj);
        setAllServices(globalServicesArr);
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Open Category: Fetch detailed services for that specific group
  const openCategory = async (catKey) => {
    try {
      setLoading(true);
      setSelectedCategory(catKey);

      const response = await fetch(
        `http://127.0.0.1:8000/view_api_service_types_by_group/${catKey}/`
      );

      if (!response.ok) throw new Error("Failed to fetch service types");

      const data = await response.json();

      const servicesArr = data.map(service => ({
        id: service.id,
        code: service.code,
        title: service.name || service.title,
        description: service.description,
        category: catKey,
        icon: service.icon || "Circle",
        service_fee: service.service_fee || "0.00",

      }));

      setCategoryViewServices(servicesArr);
      setView('category');
      setSearchQuery('');

    } catch (error) {
      console.error("Error loading service types:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Navigation Handlers ---


  const openService = (service) => {
    navigate('/transaction', { state: { service, customer } });
  };

  const goHome = () => {
    setView('dashboard');
    setSelectedCategory(null);

    setCategoryViewServices([]); 
    setSearchQuery('');
  };

  const goBack = () => {
    if (view === 'reset-password') {
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
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    alert('Password updated successfully!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setView('dashboard');
  };

  if (loading && view === 'dashboard' && Object.keys(serviceCategories).length === 0) {
    return <div className="flex h-screen items-center justify-center">Loading services...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <DashboardHeader
        customerName={customer?.fullName || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onResetPassword={handleResetPassword}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">


          {/* --- 1. RESET PASSWORD VIEW --- */}
          {view === 'reset-password' && (
             <motion.div 
             key="reset-password" 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }} 
             className="h-full overflow-y-auto p-4 md:p-8"
           >
             <div className="max-w-md mx-auto">
               <Button variant="outline" size="sm" onClick={goBack} className="mb-4">
                 <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
               </Button>
               <div className="bg-white p-6 rounded-xl shadow-sm border">
                 <div className="flex items-center gap-2 mb-4">
                   <KeyRound className="h-5 w-5 text-blue-600" />
                   <h2 className="text-xl font-semibold">Reset Password</h2>
                 </div>
                 <div className="space-y-4">
                   <input 
                     type="password" 
                     placeholder="Old Password" 
                     value={oldPassword}
                     onChange={(e) => setOldPassword(e.target.value)}
                     className="w-full border rounded-md p-2"
                   />
                   <input 
                     type="password" 
                     placeholder="New Password" 
                     value={newPassword}
                     onChange={(e) => setNewPassword(e.target.value)}
                     className="w-full border rounded-md p-2"
                   />
                   <input 
                     type="password" 
                     placeholder="Confirm Password" 
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     className="w-full border rounded-md p-2"
                   />
                   <Button className="w-full" onClick={handlePasswordUpdate}>Update Password</Button>
                 </div>
               </div>
             </div>
           </motion.div>
          )}

          {/* --- 2. CATEGORY VIEW --- */}
          {view === 'category' && selectedCategory && serviceCategories[selectedCategory] && (
            <motion.div 
              key="category" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="h-full overflow-y-auto p-4 md:p-8"
            >
              <div className="max-w-6xl mx-auto">
                
                {/* Header Section */}
                <div className="flex items-center gap-4 mb-8">
                  <Button variant="outline" size="icon" onClick={goBack} className="shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-slate-800">
                      {serviceCategories[selectedCategory].label}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {serviceCategories[selectedCategory].description}
                    </p>
                  </div>
                </div>

                {/* Main Content Layout */}
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Right Column: Cross-Sell Sidebar */}
                  <div className="hidden lg:block w-80 shrink-0">
                    <div className="sticky top-8">
                       <CrossSellCard customer={customer} category={selectedCategory} />
                    </div>
                  </div>
                  
                  {/* Left Column: Service List */}
                  <div className="flex-1 space-y-3">
                    {displayedCategoryServices.map((service, i) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <ServiceCard
                          icon={service.icon}
                          title={service.title}
                          description={service.description}
                          onClick={() => openService(service)}
                        />
                      </motion.div>
                    ))}
                    
                    {displayedCategoryServices.length === 0 && !loading && (
                      <div className="text-center py-12 text-slate-400">
                        No services found in this category.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- 3. DASHBOARD VIEW (Default) --- */}
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard" 

              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="h-full overflow-y-auto p-4 md:p-8"
            >
              <div className="max-w-6xl mx-auto">
                

                {/* Search Bar */}
                <div className="relative max-w-xl mb-10">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for services..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Search Results OR Category Grid */}
                {filteredServices ? (
                  <div>
                    <h2 className="font-display text-lg font-semibold text-slate-500 mb-4">
                      {filteredServices.length} Results Found
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredServices.map((service, i) => (
                        <motion.div 
                          key={service.id} 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          transition={{ delay: i * 0.05 }}
                        >
                          <ServiceCard
                            icon={service.icon}
                            title={service.title}
                            description={service.description}
                            onClick={() => openService(service)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-xl font-semibold text-slate-700 mb-5">
                      Services
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {Object.entries(serviceCategories).map(([key, cat], i) => (
                        <motion.div 
                          key={key} 
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: i * 0.08 }}
                        >
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
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <ChatPanel isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
    </div>
  );
};

export default DashboardPage;