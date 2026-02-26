import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence }  from 'framer-motion';
import { ArrowLeft, Search, User, Lock, CheckCircle, Landmark, Wallet, DollarSign, Clock }  from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';
import ServiceCard   from '@/components/banking/ServiceCard';
import { ChatPanel } from '@/components/banking/ChatPanel';
import { TransactionWorkflow } from '@/components/banking/TransactionWorkflow';
import { FxTicker }   from '@/components/banking/FxTicker';
import { CrossSellCard } from '@/components/banking/CrossSellCard';
import  { SERVICE_CATEGORIES, SERVICES }  from '@/types/banking';

const Index = () => {
  const [view, setView] = useState('customer-lookup');
  const [activeCustomer, setActiveCustomer] = useState(null);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // 1. Handle Login -> Go to Verification Screen
  const handleLogin = () => {
    const customerData = {
      id: 'CUSTO01',
      fullName: 'James Mwangi Kariuki',
      phone: '+254 712 345 678',
      username: username || 'demo_user',
      accounts: [
        { id: 'acc1', number: '0011 - 2345 - 6789', type: 'Savings Account', currency: 'KES', balance: '245,000', status: 'ACTIVE' },
        { id: 'acc2', number: '0011 - 2345 - 6790', type: 'Current Account', currency: 'KES', balance: '1,230,000', status: 'ACTIVE' },
        { id: 'acc3', number: '0011 - 2345 - 6791', type: 'Foreign Currency Account', currency: 'USD', balance: '5,200', status: 'ACTIVE' },
        { id: 'acc4', number: '0011 - 2345 - 6792', type: 'Fixed Deposit', currency: 'KES', balance: '500,000', status: 'ACTIVE' }
      ]
    };
    setActiveCustomer(customerData);
    setView('customer-verified'); // Navigate to verification screen first
  };

  // 2. Handle Proceed -> Go to Dashboard
  const handleProceedToDashboard = () => {
    setView('dashboard');
  };

  // 3. Handle Change Customer -> Back to Login
  const handleChangeCustomer = () => {
    setActiveCustomer(null);
    setUsername('');
    setPassword('');
    setView('customer-lookup');
  };

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
    } else {
      goHome();
    }
  };

  const handleLogout = () => {
    handleChangeCustomer();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader
        customerName={activeCustomer?.fullName}
        onLogout={activeCustomer ? handleLogout : undefined}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* 1. LOGIN SCREEN */}
          {view === 'customer-lookup' && (
            <motion.div
              key="customer-lookup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto"
            >
              <div className="w-full max-w-sm space-y-6 bg-card p-8 rounded-xl shadow-lg border border-border">
                <div className="text-center">
                  <h1 className="font-display text-3xl font-bold text-foreground">Welcome Back</h1>
                  <p className="text-muted-foreground mt-2">Sign in to access your account</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium text-foreground">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <Button onClick={handleLogin} className="w-full touch-target">
                    Sign In
                  </Button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-medium text-primary hover:underline">
                    Register here
                  </Link>
                </p>
              </div>
            </motion.div>
          )}

          {/* 2. CUSTOMER VERIFICATION SCREEN (The image you provided) */}
          {view === 'customer-verified' && activeCustomer && (
            <motion.div
              key="customer-verified"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto bg-muted/40"
            >
              <div className="w-full max-w-md bg-card rounded-xl shadow-lg border border-border overflow-hidden">
                {/* Header */}
                <div className="bg-primary/5 p-6 border-b border-border text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-3">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Customer Verified</h2>
                </div>

                {/* Customer Details */}
                <div className="p-6 border-b border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium text-foreground">{activeCustomer.fullName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Customer ID:</span>
                    <span className="font-medium text-foreground">{activeCustomer.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium text-foreground">{activeCustomer.phone}</span>
                  </div>
                </div>

                {/* Accounts List */}
                <div className="p-4 space-y-3">
                  {activeCustomer.accounts.map((acc) => (
                    <div key={acc.id} className="bg-background p-3 rounded-lg border border-border flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                           {acc.type.includes('Savings') ? <Landmark className="w-4 h-4"/> : 
                            acc.type.includes('Current') ? <Wallet className="w-4 h-4"/> :
                            acc.type.includes('Foreign') ? <DollarSign className="w-4 h-4"/> : 
                            <Clock className="w-4 h-4"/>}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{acc.number}</p>
                          <p className="text-sm font-medium text-foreground">{acc.type} · {acc.currency}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          {acc.currency === 'KES' ? 'Ksh' : 'US$'} {acc.balance}
                        </p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          {acc.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleChangeCustomer}>
                    Change Customer
                  </Button>
                  <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleProceedToDashboard}>
                    Proceed
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* WORKFLOW VIEW */}
          {view === 'workflow' && selectedService && activeCustomer && (
            <motion.div
              key="workflow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <TransactionWorkflow
                service={selectedService}
                customer={activeCustomer}
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
                  {activeCustomer && (
                    <div className="hidden lg:block w-80 shrink-0">
                      <CrossSellCard customer={activeCustomer} category={selectedCategory} />
                    </div>
                  )}
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
                    {activeCustomer && (
                      <div className="lg:hidden">
                        <CrossSellCard customer={activeCustomer} category={selectedCategory} />
                      </div>
                    )}
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

          {/* DASHBOARD VIEW */}
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

export default Index;