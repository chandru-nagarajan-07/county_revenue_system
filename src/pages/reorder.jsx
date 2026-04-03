import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, KeyRound, CheckCircle, XCircle, Package, AlertCircle, X, ArrowUpDown, RefreshCw } from 'lucide-react';
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

// Mock branch data
const mockBranches = [
  { id: 1, name: 'Main Branch - Downtown' },
  { id: 2, name: 'North Branch - Riverside' },
  { id: 3, name: 'South Branch - Greenfield' },
  { id: 4, name: 'East Branch - Lakeside' },
  { id: 5, name: 'West Branch - Hillview' },
];

const Reorder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;

  // --- State Management ---
  const [chatOpen, setChatOpen] = useState(false);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [view, setView] = useState('dashboard');
  const [sortByStatus, setSortByStatus] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // Track selected items

  // Password Reset State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Service Approvals State
  const [serviceApprovals, setServiceApprovals] = useState(mockServiceApprovals);

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

  // Handle checkbox selection
  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  // Select all items
  const handleSelectAll = () => {
    if (selectedItems.length === sortedApprovals.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(sortedApprovals.map(item => item.id));
    }
  };

  // Handle Reorder button click
  const handleReorderClick = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to reorder');
      return;
    }
    setShowReorderModal(true);
    setSelectedBranch('');
  };

  // Handle reorder submission
  const handleReorderSubmit = () => {
    if (!selectedBranch) {
      alert('Please select a branch');
      return;
    }
    
    // Get selected items data
    const selectedItemsData = serviceApprovals.filter(item => selectedItems.includes(item.id));
    const selectedCartIds = selectedItemsData.map(item => item.cart_id).join(', ');
    
    alert(`Successfully reordered ${selectedItems.length} item(s) to ${selectedBranch}\nSelected carts: ${selectedCartIds}`);
    
    // Optional: Remove selected items from the list or update their status
    // Here we're just keeping them but you can modify based on your needs
    setSelectedItems([]);
    setShowReorderModal(false);
    setSelectedBranch('');
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
                {/* Header with Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="font-display text-xl font-semibold text-slate-700">
                    Service Approvals
                  </h2>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={toggleRearrange}
                      className="flex items-center gap-2"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                      {sortByStatus ? 'Reset Order' : 'Rearrange by Status'}
                    </Button>
                    <Button 
                      variant="default" 
                      onClick={handleReorderClick}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      disabled={selectedItems.length === 0}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reorder ({selectedItems.length})
                    </Button>
                  </div>
                </div>

                {/* Approvals Table with Checkboxes */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedItems.length === sortedApprovals.length && sortedApprovals.length > 0}
                              onChange={handleSelectAll}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cart ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mobile Number</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Services</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {sortedApprovals.length > 0 ? (
                          sortedApprovals.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(item.id)}
                                  onChange={() => handleSelectItem(item.id)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
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
                
                {/* Selected Items Summary */}
                {selectedItems.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>{selectedItems.length}</strong> item(s) selected for reorder
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Reorder Modal with Branch Dropdown */}
      {showReorderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowReorderModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Reorder Selected Items</h2>
            </div>
            
            {/* Show selected items count */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                You have selected <strong>{selectedItems.length}</strong> item(s) to reorder
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a branch...</option>
                  {mockBranches.map((branch) => (
                    <option key={branch.id} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
                onClick={handleReorderSubmit}
              >
                Confirm Reorder
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

export default Reorder;