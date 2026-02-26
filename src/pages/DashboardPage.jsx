import { useState, useMemo } from 'react';
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
import { SERVICE_CATEGORIES, SERVICES } from '@/types/banking';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;

  // Redirect if no customer data (protected route logic)
  if (!customer) {
    navigate('/');
    return null;
  }

  // Internal View State
  const [view, setView] = useState('dashboard'); // dashboard, category, workflow, reset-password
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Nav Dropdown State
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  // Reset Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const categoryServices = useMemo(() => {
    if (!selectedCategory) return [];
    return SERVICES.filter(s => s.category === selectedCategory);
  }, [selectedCategory]);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return SERVICES.filter(s =>
      s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const openCategory = (cat) => {
    setSelectedCategory(cat);
    setView('category');
    setSearchQuery('');
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
    navigate('/'); // Go back to login
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader
        customerName={customer.fullName}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onResetPassword={handleResetPassword}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* RESET PASSWORD VIEW */}
          {view === 'reset-password' && (
            <motion.div
              key="reset-password"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 overflow-auto h-full flex flex-col items-center"
            >
              <div className="w-full max-w-md">
                <Button variant="ghost" onClick={goBack} className="mb-6 touch-target">
                  <ArrowLeft className="h-5 w-5 mr-2" /> Back to Dashboard
                </Button>
                <div className="bg-card p-8 rounded-xl shadow-lg border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <KeyRound className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-foreground">Reset Password</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Old Password</label>
                      <input 
                        type="password" 
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">New Password</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Confirm New Password</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring" 
                      />
                    </div>
                    <Button className="w-full mt-4" onClick={handlePasswordUpdate}>
                      Update Password
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* WORKFLOW VIEW */}
          {view === 'workflow' && selectedService && (
            <motion.div
              key="workflow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <TransactionWorkflow
                service={selectedService}
                customer={customer}
                onBack={goBack}
                onComplete={goHome}
              />
            </motion.div>
          )}

          {/* CATEGORY VIEW */}
          {view === 'category' && selectedCategory && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="p-8 overflow-auto h-full"
            >
              <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={goHome} className="touch-target">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    {SERVICE_CATEGORIES[selectedCategory].label}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {SERVICE_CATEGORIES[selectedCategory].description}
                  </p>
                </div>
              </div>
              
              {(['cash-operations', 'customer-account', 'payment-operations', 'fx-operations', 'card-services'].includes(selectedCategory) ? (
                <div className="flex gap-6">
                   <div className="hidden lg:block w-80 shrink-0">
                     <CrossSellCard customer={customer} category={selectedCategory} />
                   </div>
                   <div className="flex-1 min-w-0 space-y-5">
                     <div className="grid gap-3">
                       {categoryServices.map((service, i) => (
                         <motion.div
                           key={service.id}
                           initial={{ opacity: 0, y: 20 }}
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
                     </div>
                     {(selectedCategory === 'cash-operations' || selectedCategory === 'fx-operations') && <FxTicker />}
                     <div className="lg:hidden">
                        <CrossSellCard customer={customer} category={selectedCategory} />
                     </div>
                   </div>
                </div>
              ) : (
                <div className="grid gap-3 max-w-2xl">
                  {categoryServices.map((service, i) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 20 }}
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
                </div>
              ))}
            </motion.div>
          )}

          {/* MAIN DASHBOARD VIEW */}
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 overflow-auto h-full"
            >
              {/* Search bar */}
              <div className="relative max-w-xl mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services... e.g. 'deposit', 'transfer', 'card'"
                  className="w-full rounded-xl border border-input bg-card pl-12 pr-4 py-4 text-base outline-none focus:ring-2 focus:ring-ring shadow-card touch-target"
                />
              </div>

              {/* Search results */}
              {filteredServices && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {filteredServices.length} result{filteredServices.length !== 1 ? 's' : ''} found
                  </h3>
                  <div className="grid gap-3 max-w-2xl">
                    {filteredServices.map((service) => (
                      <ServiceCard
                        key={service.id}
                        icon={service.icon}
                        title={service.title}
                        description={service.description}
                        onClick={() => openService(service)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Category cards */}
              {!filteredServices && (
                <>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-5">
                    How can we help you today?
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Object.entries(SERVICE_CATEGORIES).map(([key, cat], i) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 30 }}
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
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ChatPanel isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
    </div>
  );
};

export default DashboardPage;