import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, KeyRound, Scan, CheckCircle, XCircle, TableProperties, QrCode, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';
import ServiceCard from '@/components/banking/ServiceCard';
import { ChatPanel } from '@/components/banking/ChatPanel';
import { CrossSellCard } from '@/components/banking/CrossSellCard';
import { Html5QrcodeScanner } from 'html5-qrcode';

const DashboardTeller = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;

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

  // Mock approval table data (replace with real API data)
  const mockApprovals = [
    { id: 1, name: 'John Doe', service: 'Wire Transfer', serviceCharge: 25.0, approved: false, count: 3 },
    { id: 2, name: 'Jane Smith', service: 'Bill Payment', serviceCharge: 5.0, approved: true, count: 1 },
    { id: 3, name: 'Alice Johnson', service: 'Account Opening', serviceCharge: 0.0, approved: false, count: 2 },
  ];
  const [approvals, setApprovals] = useState(mockApprovals);

  // --- Computed Values ---
  const displayedCategoryServices = useMemo(() => categoryViewServices, [categoryViewServices]);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return allServices.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  }, [searchQuery, allServices]);

  // Compute service counts per category
  const serviceCounts = useMemo(() => {
    const counts = {};
    Object.keys(serviceCategories).forEach(key => {
      counts[key] = allServices.filter(s => s.category === key).length;
    });
    return counts;
  }, [serviceCategories, allServices]);

  // --- Data Fetching ---
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

      const response = await fetch(`http://127.0.0.1:8000/view_api_service_types_by_group/${catKey}/`);
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

  // --- Approval Table Handlers (with modals) ---
  const handleCountClick = (approval) => {
    setSelectedApproval(approval);
    setShowScannerModal(true);
    setScanResult(null);
  };

  const handleScan = (data) => {
    if (data) {
      setScanResult(data);
      // Simulate fetching customer data from QR code
      const mockCustomerData = {
        customerId: 'CUST12345',
        customerName: 'John Doe',
        charge: selectedApproval?.serviceCharge?.toString() || '25.00',
        service: selectedApproval?.service || 'Wire Transfer',
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

  const handleApprove = () => {
    const updatedApprovals = approvals.map(item =>
      item.id === selectedApproval?.id ? { ...item, approved: true } : item
    );
    setApprovals(updatedApprovals);
    alert('Service approved successfully!');
    setShowApprovalModal(false);
    setSelectedApproval(null);
    setScanResult(null);
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
                          className="relative"
                        >
                          <ServiceCard
                            variant="category"
                            icon={cat.icon}
                            title={cat.label}
                            description={cat.description}
                            onClick={() => openCategory(key)}
                            
                          />
                          {/* Service Count Badge */}
                          <div className="absolute top-3 right-3 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {serviceCounts[key] || 0} services
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}

                {/* --- Approvals Table (embedded on dashboard) --- */}
                <div className="mt-12">
                  <h2 className="font-display text-xl font-semibold text-slate-700 mb-5">
                    Service Approvals
                  </h2>
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Service</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Service Charge</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Service Count</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Approve Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {approvals.map((item) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{item.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{item.service}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">${item.serviceCharge}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                <button
                                  onClick={() => handleCountClick(item)}
                                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                >
                                  {item.count} <QrCode className="h-4 w-4" />
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.approved ? (
                                  <span className="inline-flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-4 w-4" /> Approved
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-red-600">
                                    <XCircle className="h-4 w-4" /> Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
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
              <h2 className="text-xl font-semibold">Approval Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Customer ID</label>
                <p className="mt-1 text-lg font-semibold">{approvalData.customerId}</p>
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
                Approve Service
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