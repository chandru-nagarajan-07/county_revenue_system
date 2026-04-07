import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowLeft, QrCode, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CartPage = () => {
  const navigate = useNavigate();
  const [pendingItems, setPendingItems] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompletedItem, setSelectedCompletedItem] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branchError, setBranchError] = useState('');

  // Get session user once (no reassignment errors)
  let sessionUser;
  try {
    sessionUser = JSON.parse(sessionStorage.getItem('userData1') || '{}');
    console.log('Session User:', sessionUser.user_id);
  } catch {
    sessionUser = {};
  }

  const accounts = sessionUser?.account || [];
  const branches = sessionUser?.branch || [];

  const BRANCH_OPTIONS = useMemo(() => {
    return branches.map((b) => ({
      value: b.branch_id,
      label: b.branch_name,
    }));
  }, [branches]);

  // Fetch pending items on mount
  useEffect(() => {
    fetchPendingItems();
  }, []);

  // Fetch completed items when tab changes to 'completed'
  useEffect(() => {
    if (activeTab === 'completed') {
      fetchCompletedItems();
    }
  }, [activeTab]);

  const fetchPendingItems = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/customer_service_queue_items/${sessionUser.user_id}/`
      );
      const data = await response.json();
      console.log('Pending items from API:', data);

      const formattedData = data.serializer.map((service) => ({
        id: service.id,
        service_request_id: service.service_request_id,
        service_code: service.service_code,
        service_name: service.service_name,
        amount: service.service_amount || '-',
        card_status: service.cart_status || '-',
        branch: service.service_data?.branch || '-',
      }));

      setPendingItems(formattedData);
    } catch (error) {
      console.error('Error fetching pending items:', error);
    }
  };

  const fetchCompletedItems = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/customer_service_cart_list_queue/${sessionUser.user_id}/`
      );
      if (!response.ok) {
        console.error('API response not OK:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Raw completed items response:', data);

      const formattedData = data.map((cart) => ({
        id: cart.id,
        cart_id: cart.cart_id,
        cart_status: cart.cart_status,
        service_amount: cart.service_amount || 0,
        total_services: cart.total_services || 0,
        completed_services: cart.completed_services || 0,
        services: cart.services || [],
        qr_code_data: cart.qr_code_data,
        qr_img: cart.qr_img,
        created_at: cart.created_at,
        expires_at: cart.expires_at,
        customer_name: cart.customer_name,
        mobile_number: cart.mobile_number,
        branch: cart.branch,
        account: cart.account,
        teller: cart.teller,
      }));

      setCompletedItems(formattedData);
    } catch (error) {
      console.error('Error fetching completed items:', error);
      setCompletedItems([]);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const prepareCompleteOrders = () => {
    if (selectedIds.length === 0) return;
    setSelectedBranch('');
    setBranchError('');
    setShowConfirmModal(true);
  };

  const executeCompleteOrders = async () => {
    if (selectedIds.length === 0) return;

    if (!selectedBranch) {
      setBranchError('Please select a branch for card collection');
      return;
    }

    setLoading(true);
    setShowConfirmModal(false);

    try {
      const response = await fetch('http://127.0.0.1:8000/service_items/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_ids: selectedIds,
          branch: selectedBranch,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete orders');
      }

      const data = await response.json();
      console.log('Cart Created:', data);

      await fetchCompletedItems();
      setPendingItems((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error('Error completing orders:', error);
      alert('Failed to complete orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8000/service_queue_items/${id}/`, {
        method: 'DELETE',
      });
      setPendingItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  const getQrCodeUrl = (item) => {
    if (item.qr_img) {
      return `http://127.0.0.1:8000${item.qr_img}`;
    }
    const qrData = {
      cart_id: item.cart_id,
      service_amount: item.service_amount,
      total_services: item.total_services,
      completed_services: item.completed_services,
      created_at: item.created_at,
    };
    const data = JSON.stringify(qrData);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
  };

  const downloadQrCode = async (item) => {
    try {
      const qrUrl = getQrCodeUrl(item);
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr_${item.cart_id || 'cart'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  const openQrModal = (item) => {
    setSelectedCompletedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCompletedItem(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
     <header className="flex items-center justify-between px-8 py-5 navy-gradient">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground tracking-tight">
              Cart
            </h1>
            <p className="text-sm text-primary-foreground/60">Handle your service requests efficiently</p>
          </div>
        </div>
      </header>


      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Cart</h1>
          </div> */}

          <Tabs defaultValue="pending" onValueChange={(value) => setActiveTab(value)}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="pending">Pending ({pendingItems.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedItems.length})</TabsTrigger>
            </TabsList>

            {/* Pending Tab */}
            <TabsContent value="pending">
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Select</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Request ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {pendingItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item.id)}
                              onChange={() => toggleSelection(item.id)}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{item.service_request_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{item.service_code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{item.service_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{item.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <button onClick={() => removeItem(item.id)} className="text-red-600 hover:text-red-800 transition-colors" aria-label="Remove item">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {pendingItems.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No pending items</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedIds.length > 0 && (
                <div className="mt-4 text-right">
                  <Button
                    onClick={prepareCompleteOrders}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Complete Selected Orders (${selectedIds.length})`}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Completed Tab */}
            <TabsContent value="completed">
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cart ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cart Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Services Progress</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {completedItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-mono">{item.cart_id || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{item.service_amount ? `${item.service_amount} Ksh` : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.cart_status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800'
                                : item.cart_status === 'COMPLETED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.cart_status || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {item.completed_services || 0} / {item.total_services || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openQrModal(item)} className="text-blue-600 hover:text-blue-800 p-1" aria-label="View QR code">
                                <QrCode size={18} />
                              </button>
                              <button onClick={() => downloadQrCode(item)} className="text-green-600 hover:text-green-800 p-1" aria-label="Download QR code">
                                <Download size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {completedItems.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No completed items</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* QR Modal */}
      <AnimatePresence>
        {isModalOpen && selectedCompletedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">QR Code - Cart Details</h3>
                <button onClick={closeModal} className="text-slate-500 hover:text-slate-700 text-2xl leading-none">×</button>
              </div>
              <div className="flex justify-center mb-4">
                <img src={getQrCodeUrl(selectedCompletedItem)} alt="QR Code" className="w-64 h-64" />
              </div>
              <div className="mt-2 text-sm text-slate-600">
                <div className="bg-slate-50 p-3 rounded space-y-1">
                  <p><strong>Cart ID:</strong> {selectedCompletedItem.cart_id || '-'}</p>
                  <p><strong>Total Amount:</strong> {selectedCompletedItem.service_amount ? `${selectedCompletedItem.service_amount} Ksh` : '-'}</p>
                  <p><strong>Cart Status:</strong> {selectedCompletedItem.cart_status || '-'}</p>
                  <p><strong>Total Services:</strong> {selectedCompletedItem.total_services || 0}</p>
                  <p><strong>Completed Services:</strong> {selectedCompletedItem.completed_services || 0}</p>
                  {selectedCompletedItem.customer_name && <p><strong>Customer:</strong> {selectedCompletedItem.customer_name}</p>}
                  {selectedCompletedItem.created_at && <p><strong>Created:</strong> {new Date(selectedCompletedItem.created_at).toLocaleString()}</p>}
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={() => downloadQrCode(selectedCompletedItem)} className="w-full bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4 mr-2" /> Download QR Code
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Branch Selection Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Select Branch for Card Collection</h3>
                <button onClick={() => setShowConfirmModal(false)} className="text-slate-500 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <span>Select Branch *</span>
                    </Label>
                    <Select value={selectedBranch} onValueChange={(value) => {
                      setSelectedBranch(value);
                      setBranchError('');
                    }}>
                      <SelectTrigger className={branchError ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Choose a branch for card collection" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCH_OPTIONS.map((branch) => (
                          <SelectItem key={branch.value} value={branch.value}>
                            {branch.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {branchError && (
                      <p className="text-xs text-destructive">{branchError}</p>
                    )}
                  </div>

                  <div className="mt-2 text-sm text-slate-500">
                    <p>You have selected {selectedIds.length} service(s). Please choose where you want to collect the card(s).</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
                  <Button onClick={executeCompleteOrders} className="bg-green-600 hover:bg-green-700">
                    Complete Orders
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CartPage;