import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, KeyRound, Scan, CheckCircle, XCircle, TableProperties, QrCode, X, LayoutGrid, Circle, Activity, Clock, CheckSquare, XSquare, Calendar, ShoppingCart, Package, Truck, AlertCircle, TrendingUp, TrendingDown, DollarSign, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader1';
import ServiceCard from '@/components/banking/ServiceCardTeller';
import { ChatPanel } from '@/components/banking/ChatPanel';
import { CrossSellCard } from '@/components/banking/CrossSellCard';
import { Html5QrcodeScanner } from 'html5-qrcode';

const DashboardTeller = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;
  const branch = customer?.teller_info;
  console.log("DashboardTeller received customer:", customer);
  console.log("DashboardTeller received branch:", branch);
  // --- State Management ---
  const [serviceCategories, setServiceCategories] = useState({});
  const [allServices, setAllServices] = useState([]);
  const [categoryViewServices, setCategoryViewServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState('dashboard'); // 'dashboard', 'category', 'reset-password'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  // Password Reset State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Modal state for QR scanner and approval details
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [approvalData, setApprovalData] = useState({
    customerId: '',
    customerName: '',
    charge: '',
    service: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Dashboard Counts State (from dashboard_counts API)
  const [dashboardCounts, setDashboardCounts] = useState({
    total_services: 0,
    pending_services: 0,
    in_progress_services: 0,
    completed_services: 0,
    rejected_services: 0,
    today_services: 0,
    active_carts: 0,
    partially_served: 0,
    fully_served: 0,
    expired_carts: 0,
  });

  // Service Approvals State (from all_cards API)
  const [serviceApprovals, setServiceApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);

  // --- Data Fetching ---
  const fetchDashboardCounts = async () => {
    try {
      const response = await fetch("https://snapsterbe.techykarthikbms.com/api/dashboard-counts/");
      if (!response.ok) throw new Error("Failed to fetch dashboard counts");
      
      const data = await response.json();
      console.log("Dashboard counts data:", data);
      setDashboardCounts(data);
    } catch (error) {
      console.error("Error fetching dashboard counts:", error);
    }
  };

  const fetchServiceApprovals = async () => {
    try {
      setApprovalsLoading(true);
      const response = await fetch(`https://snapsterbe.techykarthikbms.com/api/all_cards/${branch}/`);
      if (!response.ok) throw new Error("Failed to fetch service approvals");
      
      const data = await response.json();
      console.log("Service approvals data:", data);
      setServiceApprovals(data);
    } catch (error) {
      console.error("Error fetching service approvals:", error);
    } finally {
      setApprovalsLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch("https://snapsterbe.techykarthikbms.com/view_api_service_groups1/");
        if (!response.ok) throw new Error("Server error");

        const data = await response.json();
        console.log("Fetched service groups:", data);
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
        
        // Fetch dashboard counts and service approvals
        await Promise.all([fetchDashboardCounts(), fetchServiceApprovals()]);
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // --- QR Scanner Initialization (for modal) ---
  useEffect(() => {
    if (showScannerModal) {
      const scanner = new Html5QrcodeScanner('qr-reader-modal', { fps: 10, qrbox: 250 }, false);
      scanner.render(handleScan, handleError);
      return () => scanner.clear();
    }
  }, [showScannerModal]);

  // --- Category View ---
  const openCategory = async (catKey) => {
    try {
      setLoading(true);
      setSelectedCategory(catKey);

      const response = await fetch(`https://snapsterbe.techykarthikbms.com/view_api_service_types_by_group/${catKey}/`);
      if (!response.ok) throw new Error("Failed to fetch service types");

      const data = await response.json();
      console.log('data for the service is ', data);
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

  // --- Approval Table Handlers ---
  const handleCountClick = (approval) => {
    setSelectedApproval(approval);
    setShowScannerModal(true);
    setScanResult(null);
  };

  const handleScan = (data) => {
    if (data) {
      setScanResult(data);
      let serviceName = selectedApproval?.service || 'Service Approval';
      let charge = selectedApproval?.serviceCharge?.toString() || '0.00';
      
      if (selectedCategory && !selectedApproval?.id) {
        const cat = serviceCategories[selectedCategory];
        if (cat) {
          serviceName = cat.label;
        }
      }

      const mockCustomerData = {
        customerId: selectedApproval?.cart_id || 'CUST12345',
        customerName: selectedApproval?.customer_name || 'John Doe',
        charge: charge,
        service: serviceName,
        date: new Date().toISOString().split('T')[0],
      };
      setApprovalData(mockCustomerData);
      setShowScannerModal(false);
      setShowApprovalModal(true);
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  const handleApprove = async () => {
    if (selectedApproval?.id) {
      try {
        // Call approve API endpoint here
        const response = await fetch(`https://snapsterbe.techykarthikbms.com/api/approve_cart/${selectedApproval.id}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          // Update local state
          const updatedApprovals = serviceApprovals.map(item =>
            item.id === selectedApproval.id ? { ...item, cart_status: 'APPROVED' } : item
          );
          setServiceApprovals(updatedApprovals);
          alert('Cart approved successfully!');
        } else {
          alert('Failed to approve cart');
        }
      } catch (error) {
        console.error("Error approving cart:", error);
        alert('Error approving cart');
      }
    } else {
      alert('Cart approved successfully!');
    }
    setShowApprovalModal(false);
    setSelectedApproval(null);
    setScanResult(null);
    if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  // --- Helper functions ---
  const getStatIcon = (statName) => {
    const icons = {
      total_services: <Package className="h-5 w-5 text-blue-600" />,
      pending_services: <Clock className="h-5 w-5 text-yellow-600" />,
      in_progress_services: <Activity className="h-5 w-5 text-orange-600" />,
      completed_services: <CheckSquare className="h-5 w-5 text-green-600" />,
      rejected_services: <XSquare className="h-5 w-5 text-red-600" />,
      today_services: <Calendar className="h-5 w-5 text-purple-600" />,
      active_carts: <ShoppingCart className="h-5 w-5 text-indigo-600" />,
      partially_served: <Package className="h-5 w-5 text-cyan-600" />,
      fully_served: <CheckCircle className="h-5 w-5 text-emerald-600" />,
      expired_carts: <AlertCircle className="h-5 w-5 text-gray-600" />,
    };
    return icons[statName] || <LayoutGrid className="h-5 w-5 text-gray-600" />;
  };

  const getStatBgColor = (statName) => {
    const colors = {
      total_services: "bg-blue-50",
      pending_services: "bg-yellow-50",
      in_progress_services: "bg-orange-50",
      completed_services: "bg-green-50",
      rejected_services: "bg-red-50",
      today_services: "bg-purple-50",
      active_carts: "bg-indigo-50",
      partially_served: "bg-cyan-50",
      fully_served: "bg-emerald-50",
      expired_carts: "bg-gray-50",
    };
    return colors[statName] || "bg-gray-50";
  };

  const getStatusColor = (status) => {
    const colors = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'PARTIALLY_SERVED': 'bg-yellow-100 text-yellow-800',
      'FULLY_SERVED': 'bg-blue-100 text-blue-800',
      'EXPIRED': 'bg-red-100 text-red-800',
      'APPROVED': 'bg-emerald-100 text-emerald-800',
      'PENDING': 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // --- Rendering ---
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

          {/* --- RESET PASSWORD VIEW --- */}
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

          {/* --- CATEGORY VIEW --- */}
          {view === 'category' && selectedCategory && serviceCategories[selectedCategory] && (
            <motion.div
              key="category"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-4 md:p-8"
            >
              <div className="max-w-6xl mx-auto">
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

                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="hidden lg:block w-80 shrink-0">
                    <div className="sticky top-8">
                      <CrossSellCard customer={customer} category={selectedCategory} />
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    {categoryViewServices.map((service, i) => (
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
                    {categoryViewServices.length === 0 && !loading && (
                      <div className="text-center py-12 text-slate-400">
                        No services found in this category.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- DASHBOARD VIEW --- */}
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-4 md:p-8"
            >
              <div className="max-w-7xl mx-auto">
                {/* Search Bar */}
                <div className="relative max-w-xl mb-8">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for services..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                {/* 1. Service Requests Overview */}
                <div className="mb-8">
                  <h2 className="font-display text-lg font-semibold text-slate-700 mb-4">
                    Service Requests Overview
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className={`${getStatBgColor('total_services')} rounded-xl shadow-sm border p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium text-slate-600">Total Services</h3>
                        {getStatIcon('total_services')}
                      </div>
                      <p className="text-2xl font-bold text-slate-800">{dashboardCounts.total_services}</p>
                      <p className="text-xs text-slate-500 mt-1">All time</p>
                    </div>
                    
                    <div className={`${getStatBgColor('pending_services')} rounded-xl shadow-sm border p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium text-slate-600">Pending</h3>
                        {getStatIcon('pending_services')}
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">{dashboardCounts.pending_services}</p>
                      <p className="text-xs text-slate-500 mt-1">Awaiting action</p>
                    </div>
                    
                    <div className={`${getStatBgColor('in_progress_services')} rounded-xl shadow-sm border p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium text-slate-600">In Progress</h3>
                        {getStatIcon('in_progress_services')}
                      </div>
                      <p className="text-2xl font-bold text-orange-600">{dashboardCounts.in_progress_services}</p>
                      <p className="text-xs text-slate-500 mt-1">Being processed</p>
                    </div>
                    
                    <div className={`${getStatBgColor('completed_services')} rounded-xl shadow-sm border p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium text-slate-600">Completed</h3>
                        {getStatIcon('completed_services')}
                      </div>
                      <p className="text-2xl font-bold text-green-600">{dashboardCounts.completed_services}</p>
                      <p className="text-xs text-slate-500 mt-1">Successfully done</p>
                    </div>
                    
                    <div className={`${getStatBgColor('rejected_services')} rounded-xl shadow-sm border p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium text-slate-600">Rejected</h3>
                        {getStatIcon('rejected_services')}
                      </div>
                      <p className="text-2xl font-bold text-red-600">{dashboardCounts.rejected_services}</p>
                      <p className="text-xs text-slate-500 mt-1">Declined</p>
                    </div>
                  </div>
                </div>

                {/* 2. Today's Activity & Cart Status */}
                <div className="mb-8">
                  <h2 className="font-display text-lg font-semibold text-slate-700 mb-4">
                    Today's Activity & Cart Status
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className={`${getStatBgColor('today_services')} rounded-xl shadow-sm border p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium text-slate-600">Today's Services</h3>
                        {getStatIcon('today_services')}
                      </div>
                      <p className="text-2xl font-bold text-purple-600">{dashboardCounts.today_services}</p>
                      <p className="text-xs text-slate-500 mt-1">Created today</p>
                    </div>
                    
                    <div className={`${getStatBgColor('active_carts')} rounded-xl shadow-sm border p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium text-slate-600">Active Carts</h3>
                        {getStatIcon('active_carts')}
                      </div>
                      <p className="text-2xl font-bold text-indigo-600">{dashboardCounts.active_carts}</p>
                      <p className="text-xs text-slate-500 mt-1">Open & active</p>
                    </div>
                    
                    <div className={`${getStatBgColor('partially_served')} rounded-xl shadow-sm border p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium text-slate-600">Partially Served</h3>
                        {getStatIcon('partially_served')}
                      </div>
                      <p className="text-2xl font-bold text-cyan-600">{dashboardCounts.partially_served}</p>
                      <p className="text-xs text-slate-500 mt-1">Partially completed</p>
                    </div>
                    
                    <div className={`${getStatBgColor('fully_served')} rounded-xl shadow-sm border p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium text-slate-600">Fully Served</h3>
                        {getStatIcon('fully_served')}
                      </div>
                      <p className="text-2xl font-bold text-emerald-600">{dashboardCounts.fully_served}</p>
                      <p className="text-xs text-slate-500 mt-1">Completely served</p>
                    </div>
                    
                    <div className={`${getStatBgColor('expired_carts')} rounded-xl shadow-sm border p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium text-slate-600">Expired Carts</h3>
                        {getStatIcon('expired_carts')}
                      </div>
                      <p className="text-2xl font-bold text-gray-600">{dashboardCounts.expired_carts}</p>
                      <p className="text-xs text-slate-500 mt-1">Time expired</p>
                    </div>
                  </div>
                </div>

                {/* 3. Service Approvals - from all_cards API */}
                <div className="mt-8">
                  <h2 className="font-display text-xl font-semibold text-slate-700 mb-5">
                    Service Approvals
                  </h2>
                  {approvalsLoading ? (
                    <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                      <div className="animate-pulse text-slate-400">Loading approvals...</div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cart ID</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mobile Number</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Services</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">QR Code</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {serviceApprovals.length > 0 ? (
                              serviceApprovals.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900">
                                    {item.cart_id || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                    {item.customer_name || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                    {item.mobile_number || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                    <span className="inline-flex items-center gap-1">
                                      <Package className="h-4 w-4 text-slate-400" />
                                      {item.total_services || item.services?.length || 0}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.cart_status)}`}>
                                      {item.cart_status === 'ACTIVE' && <Activity className="h-3 w-3" />}
                                      {item.cart_status === 'PARTIALLY_SERVED' && <Clock className="h-3 w-3" />}
                                      {item.cart_status === 'FULLY_SERVED' && <CheckCircle className="h-3 w-3" />}
                                      {item.cart_status === 'EXPIRED' && <XCircle className="h-3 w-3" />}
                                      {item.cart_status || 'PENDING'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {item.qr_img ? (
                                      <button
                                        onClick={() => {
                                          setSelectedApproval(item);
                                          setShowScannerModal(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                      >
                                        <QrCode className="h-5 w-5" />
                                        <span className="text-xs">Scan</span>
                                      </button>
                                    ) : (
                                      <span className="text-slate-400">No QR</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                  No service carts found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* QR Scanner Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowScannerModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Scan QR Code</h2>
            </div>
            <div id="qr-reader-modal" className="w-full max-w-sm mx-auto" />
            <p className="text-center text-sm text-slate-500 mt-4">
              Position the QR code within the frame to scan.
            </p>
          </div>
        </div>
      )}

      {/* Approval Details Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowApprovalModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold">Cart Approval Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Cart ID</label>
                <p className="mt-1 text-lg font-mono font-semibold">{approvalData.customerId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Customer Name</label>
                <p className="mt-1 text-lg">{approvalData.customerName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Service</label>
                <p className="mt-1 text-lg">{approvalData.service}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Charge</label>
                <p className="mt-1 text-lg">${approvalData.charge}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Date</label>
                <p className="mt-1 text-lg">{approvalData.date}</p>
              </div>
              <Button
                className="w-full mt-6 bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
              >
                Approve Cart
              </Button>
            </div>
          </div>
        </div>
      )}

      <ChatPanel isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
    </div>
  );
};

export default DashboardTeller;