import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, KeyRound, CheckCircle, XCircle, Package, AlertCircle, X, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader1';
import { ChatPanel } from '@/components/banking/ChatPanel';

// Status priority for rearrangement
const STATUS_PRIORITY = {
  'PENDING': 1,
  'ACTIVE': 2,
  'PARTIALLY_SERVED': 3,
  'FULLY_SERVED': 4,
  'EXPIRED': 5,
  'APPROVED': 6,
};

// ---------- STATIC MOCK DATA ----------
const mockServiceApprovals = [
  {
    id: 1,
    cart_id: 'CART-001',
    customer_name: 'John Doe',
    mobile_number: '+1 234-567-8901',
    total_services: 3,
    cart_status: 'PENDING',
    total_charge: 150.00,
  },
  {
    id: 2,
    cart_id: 'CART-002',
    customer_name: 'Jane Smith',
    mobile_number: '+1 234-567-8902',
    total_services: 1,
    cart_status: 'ACTIVE',
    total_charge: 45.50,
  },
  {
    id: 3,
    cart_id: 'CART-003',
    customer_name: 'Robert Johnson',
    mobile_number: '+1 234-567-8903',
    total_services: 5,
    cart_status: 'PARTIALLY_SERVED',
    total_charge: 320.00,
  },
  {
    id: 4,
    cart_id: 'CART-004',
    customer_name: 'Emily Davis',
    mobile_number: '+1 234-567-8904',
    total_services: 2,
    cart_status: 'FULLY_SERVED',
    total_charge: 89.99,
  },
  {
    id: 5,
    cart_id: 'CART-005',
    customer_name: 'Michael Brown',
    mobile_number: '+1 234-567-8905',
    total_services: 4,
    cart_status: 'EXPIRED',
    total_charge: 210.00,
  },
  {
    id: 6,
    cart_id: 'CART-006',
    customer_name: 'Sarah Wilson',
    mobile_number: '+1 234-567-8906',
    total_services: 2,
    cart_status: 'APPROVED',
    total_charge: 67.30,
  },
  {
    id: 7,
    cart_id: 'CART-007',
    customer_name: 'David Lee',
    mobile_number: '+1 234-567-8907',
    total_services: 3,
    cart_status: 'PENDING',
    total_charge: 112.50,
  },
  {
    id: 8,
    cart_id: 'CART-008',
    customer_name: 'Lisa Garcia',
    mobile_number: '+1 234-567-8908',
    total_services: 1,
    cart_status: 'ACTIVE',
    total_charge: 29.99,
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;

  // --- State Management ---
  const [chatOpen, setChatOpen] = useState(false);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'reset-password'
  const [sortByStatus, setSortByStatus] = useState(false);

  // Password Reset State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Service Approvals State (using static data)
  const [serviceApprovals, setServiceApprovals] = useState(mockServiceApprovals);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [approvalData, setApprovalData] = useState({
    customerId: '',
    customerName: '',
    charge: '',
    service: '',
    date: new Date().toISOString().split('T')[0],
  });

  // --- Rearrange (Sort by Status) ---
  const sortedApprovals = useMemo(() => {
    if (!sortByStatus) return serviceApprovals;
    
    return [...serviceApprovals].sort((a, b) => {
      const priorityA = STATUS_PRIORITY[a.cart_status] || 99;
      const priorityB = STATUS_PRIORITY[b.cart_status] || 99;
      return priorityA - priorityB;
    });
  }, [serviceApprovals, sortByStatus]);

  const toggleRearrange = () => {
    setSortByStatus(prev => !prev);
  };

  // --- Navigation Handlers ---
  const goHome = () => {
    setView('dashboard');
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

  // --- Approval Handlers (using static data update) ---
  const handleApproveClick = (approval) => {
    setSelectedApproval(approval);
    setApprovalData({
      customerId: approval.cart_id || 'N/A',
      customerName: approval.customer_name || 'N/A',
      charge: approval.total_charge?.toString() || '0.00',
      service: `${approval.total_services || 0} service(s)`,
      date: new Date().toISOString().split('T')[0],
    });
    setShowApprovalModal(true);
  };

  const handleApprove = () => {
    if (selectedApproval?.id) {
      // Update local state optimistically (static update)
      const updatedApprovals = serviceApprovals.map(item =>
        item.id === selectedApproval.id ? { ...item, cart_status: 'APPROVED' } : item
      );
      setServiceApprovals(updatedApprovals);
      alert('Cart approved successfully!');
    } else {
      alert('Cart approved successfully!');
    }
    setShowApprovalModal(false);
    setSelectedApproval(null);
  };

  // --- Helper functions ---
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

  const getStatusIcon = (status) => {
    switch(status) {
      case 'ACTIVE': return <ActivityIcon className="h-3 w-3" />;
      case 'PARTIALLY_SERVED': return <ClockIcon className="h-3 w-3" />;
      case 'FULLY_SERVED': return <CheckCircle className="h-3 w-3" />;
      case 'EXPIRED': return <XCircle className="h-3 w-3" />;
      case 'APPROVED': return <CheckCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

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

          {/* --- DASHBOARD VIEW (Only Service Approvals Table) --- */}
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-4 md:p-8"
            >
              <div className="max-w-7xl mx-auto">
                {/* Header with Rearrange Button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="font-display text-xl font-semibold text-slate-700">
                    Service Approvals
                  </h2>
                  <Button 
                    variant="outline" 
                    onClick={toggleRearrange}
                    className="flex items-center gap-2"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {sortByStatus ? 'Reset Order' : 'Rearrange by Status'}
                  </Button>
                </div>

                {/* Approvals Table */}
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {sortedApprovals.length > 0 ? (
                          sortedApprovals.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900">
                                {item.cart_id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {item.customer_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {item.mobile_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                <span className="inline-flex items-center gap-1">
                                  <Package className="h-4 w-4 text-slate-400" />
                                  {item.total_services}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.cart_status)}`}>
                                  {getStatusIcon(item.cart_status)}
                                  {item.cart_status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleApproveClick(item)}
                                  disabled={item.cart_status === 'APPROVED'}
                                >
                                  {item.cart_status === 'APPROVED' ? 'Approved' : 'Approve'}
                                </Button>
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
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

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
                <label className="block text-sm font-medium text-slate-700">Service(s)</label>
                <p className="mt-1 text-lg">{approvalData.service}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Total Charge</label>
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

// Simple icon components for statuses
const ActivityIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const ClockIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export default Dashboard;