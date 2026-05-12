import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowLeft, QrCode, Download, X, Eye, History, Loader2, Star, MessageSquare, ThumbsUp, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { XCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ==================== MODAL COMPONENTS (defined OUTSIDE CartPage) ====================

const TransferHistoryModal = ({ isOpen, onClose, history, isLoading }) => {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            Service History
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <p className="mt-2 text-gray-600">Loading transfer history...</p>
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-4">
              {history.map((transfer, index) => (
                <div key={transfer.id || index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      History #{index + 1}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      transfer.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      transfer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transfer.status || 'N/A'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500 w-24 inline-block">Previous Teller:</span> {transfer.from_teller}</div>
                    <div><span className="text-gray-500 w-24 inline-block">Current Teller:</span> {transfer.to_teller}</div>
                    <div><span className="text-gray-500 w-24 inline-block">Transferred At:</span> {formatDate(transfer.transferred_at)}</div>
                    <div><span className="text-gray-500 w-24 inline-block">Remarks:</span> {transfer.status}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No transfer history available for this service</p>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

const FeedbackModal = ({ isOpen, onClose, service, userId, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [speed, setSpeed] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const speedOptions = [
    { value: 'fast', label: '⚡ Fast', icon: Zap, color: 'text-green-600' },
    { value: 'medium', label: '⏱️ Medium', icon: Clock, color: 'text-yellow-600' },
    { value: 'slow', label: '🐢 Slow', icon: Clock, color: 'text-red-600' },
  ];

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!speed) {
      alert('Please select teller speed');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        service_id: service.id || service.service_request_id,
        rating,
        comment,
        teller_speed: speed,
        user_id: userId,
      });
      onClose();
    } catch (err) {
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-yellow-600" />
            Service Feedback
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          {service && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Service:</p>
              <p className="font-semibold text-gray-800">{service.service_name || 'N/A'}</p>
              <p className="text-xs text-gray-500 mt-1">Service Code: {service.service_code || 'N/A'}</p>
            </div>
          )}

          {/* Rating Stars */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      (hoverRating || rating) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {rating === 1 && 'Very Poor'}
              {rating === 2 && 'Poor'}
              {rating === 3 && 'Average'}
              {rating === 4 && 'Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Teller Speed */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teller Speed <span className="text-red-500">*</span>
            </label>
            <Select value={speed} onValueChange={setSpeed}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select teller speed" />
              </SelectTrigger>
              <SelectContent>
                {speedOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className={`h-4 w-4 ${option.color}`} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comment Textarea - NOW FULLY FUNCTIONAL */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this service..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0 || !speed}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN CartPage COMPONENT ====================

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

  // State for view details modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCartForView, setSelectedCartForView] = useState(null);

  // State for transfer history modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [transferHistory, setTransferHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // State for feedback modal
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedServiceForFeedback, setSelectedServiceForFeedback] = useState(null);

  // Get session user
  let sessionUser;
  try {
    sessionUser = JSON.parse(sessionStorage.getItem('userData1') || '{}');
  } catch {
    sessionUser = {};
  }

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
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_ids: selectedIds,
          branch: selectedBranch,
        }),
      });
      if (!response.ok) throw new Error('Failed to complete orders');
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
      await fetch(`http://127.0.0.1:8000/service_queue_items/${id}/`, { method: 'DELETE' });
      setPendingItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  const getQrCodeUrl = (item) => {
    if (item.qr_img) return `http://127.0.0.1:8000${item.qr_img}`;
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

  const openViewModal = (item) => {
    setSelectedCartForView(item);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedCartForView(null);
  };

  const getCartStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'PARTIALLY_SERVED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchTransferHistory = async (serviceId) => {
    setIsLoadingHistory(true);
    setTransferHistory([]);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/service_history/${serviceId}/`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const transfers = data.map(record => ({
          id: record.id,
          from_teller: record.previous_teller?.name + ` (${record.previous_teller?.user_ID})` || "Initial",
          to_teller: record.teller?.name + ` (${record.teller?.user_ID})` || "N/A",
          status: record.service_status,
          transferred_at: record.created_at,
          remarks: record.rejection_reason || "Transfer completed"
        }));
        setTransferHistory(transfers);
      } else {
        setTransferHistory([]);
      }
      setIsHistoryOpen(true);
    } catch (err) {
      console.error('Error fetching transfer history:', err);
      alert(`Failed to fetch transfer history: ${err.message}`);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleHistoryClick = (service) => {
    const serviceId = service.service_request_id || service.id;
    fetchTransferHistory(serviceId);
  };

  const openFeedbackModal = (service) => {
    setSelectedServiceForFeedback(service);
    setIsFeedbackOpen(true);
  };

  const closeFeedbackModal = () => {
    setIsFeedbackOpen(false);
    setSelectedServiceForFeedback(null);
  };

  const submitFeedback = async (feedbackData) => {
    const response = await fetch('http://127.0.0.1:8000/api/service_feedback/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData),
    });
    if (!response.ok) throw new Error('Failed to submit feedback');
    alert('Thank you for your feedback!');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-8 py-5 navy-gradient">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground tracking-tight">Cart</h1>
            <p className="text-sm text-primary-foreground/60">Handle your service requests efficiently</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="pending" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="pending">Cart Items</TabsTrigger>
              <TabsTrigger value="completed">Requests</TabsTrigger>
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelection(item.id)} className="rounded border-slate-300" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{item.service_request_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{item.service_code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{item.service_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{item.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button onClick={() => removeItem(item.id)} className="text-red-600 hover:text-red-800">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {pendingItems.length === 0 && (
                        <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No pending items</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {selectedIds.length > 0 && (
                <div className="mt-4 text-right">
                  <Button onClick={prepareCompleteOrders} className="bg-green-600 hover:bg-green-700" disabled={loading}>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{item.cart_id || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{item.service_amount ? `${item.service_amount} Ksh` : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getCartStatusColor(item.cart_status)}`}>
                              {item.cart_status || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {item.completed_services || 0} / {item.total_services || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openViewModal(item)} className="text-indigo-600 hover:text-indigo-800 p-1" title="View details"><Eye size={18} /></button>
                              <button onClick={() => openQrModal(item)} className="text-blue-600 hover:text-blue-800 p-1" title="View QR code"><QrCode size={18} /></button>
                              <button onClick={() => downloadQrCode(item)} className="text-green-600 hover:text-green-800 p-1" title="Download QR code"><Download size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {completedItems.length === 0 && (
                        <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No request</td></tr>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" onClick={closeModal}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">QR Code - Cart Details</h3>
                <button onClick={closeModal} className="text-slate-500 hover:text-slate-700 text-2xl leading-none">×</button>
              </div>
              <div className="flex justify-center mb-4">
                <img src={getQrCodeUrl(selectedCompletedItem)} alt="QR Code" className="w-64 h-64" />
              </div>
              <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded space-y-1">
                <p><strong>Cart ID:</strong> {selectedCompletedItem.cart_id || '-'}</p>
                <p><strong>Total Amount:</strong> {selectedCompletedItem.service_amount ? `${selectedCompletedItem.service_amount} Ksh` : '-'}</p>
                <p><strong>Cart Status:</strong> {selectedCompletedItem.cart_status || '-'}</p>
                <p><strong>Total Services:</strong> {selectedCompletedItem.total_services || 0}</p>
                <p><strong>Completed Services:</strong> {selectedCompletedItem.completed_services || 0}</p>
                {selectedCompletedItem.customer_name && <p><strong>Customer:</strong> {selectedCompletedItem.customer_name}</p>}
                {selectedCompletedItem.created_at && <p><strong>Created:</strong> {new Date(selectedCompletedItem.created_at).toLocaleString()}</p>}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" onClick={() => setShowConfirmModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Select Branch for Card Collection</h3>
                <button onClick={() => setShowConfirmModal(false)}><X size={20} /></button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Branch *</Label>
                    <Select value={selectedBranch} onValueChange={(value) => { setSelectedBranch(value); setBranchError(''); }}>
                      <SelectTrigger className={branchError ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Choose a branch for card collection" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCH_OPTIONS.map((branch) => (
                          <SelectItem key={branch.value} value={branch.value}>{branch.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {branchError && <p className="text-xs text-destructive">{branchError}</p>}
                  </div>
                  <p className="text-sm text-slate-500">You have selected {selectedIds.length} service(s). Please choose where you want to collect the card(s).</p>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
                  <Button onClick={executeCompleteOrders} className="bg-green-600 hover:bg-green-700">Complete Orders</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Cart Details Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedCartForView && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" onClick={closeViewModal}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold flex items-center gap-2"><Eye className="h-5 w-5 text-indigo-600" /> Cart Details</h3>
                <button onClick={closeViewModal}><X className="h-6 w-6" /></button>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-indigo-50 px-4 py-2 border-b"><h4 className="font-semibold text-indigo-900">Cart Information</h4></div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><span className="text-xs font-medium text-gray-500">Cart ID</span><p className="text-sm font-mono font-semibold mt-1">{selectedCartForView.cart_id || '-'}</p></div>
                      <div><span className="text-xs font-medium text-gray-500">Cart Status</span><p className="mt-1"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getCartStatusColor(selectedCartForView.cart_status)}`}>{selectedCartForView.cart_status || '-'}</span></p></div>
                      <div><span className="text-xs font-medium text-gray-500">Created At</span><p className="text-sm mt-1">{selectedCartForView.created_at ? new Date(selectedCartForView.created_at).toLocaleString() : '-'}</p></div>
                      <div><span className="text-xs font-medium text-gray-500">Branch</span><p className="text-sm mt-1">{selectedCartForView.branch?.branch_name + ` (${selectedCartForView.branch?.branch_id})` || '-'}</p></div>
                    </div>
                  </div>

                  {selectedCartForView.services && selectedCartForView.services.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-green-50 px-4 py-2 border-b"><h4 className="font-semibold text-green-900">Services ({selectedCartForView.total_services || 0})</h4></div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">Service Code</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">Service Name</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">Reason</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-600">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedCartForView.services.map((service, idx) => {
                              const isCompleted = service.service_status?.toUpperCase() === 'COMPLETED';
                              return (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 font-mono text-xs">{service.service_code || '-'}</td>
                                  <td className="px-4 py-2">{service.service_name || '-'}</td>
                                  <td className="px-4 py-2">{service.transfer_reason || '-'}</td>
                                  <td className="px-4 py-2">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                      service.service_status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                      service.service_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                      service.service_status === 'TO_BE_PROCESSED' ? 'bg-purple-100 text-purple-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {service.service_status || 'Pending'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2">
                                    <div className="flex gap-2">
                                      <button onClick={() => handleHistoryClick(service)} className="text-blue-600 hover:text-blue-800" title="View transfer history"><History size={16} /></button>
                                      {isCompleted && (
                                        <button onClick={() => openFeedbackModal(service)} className="text-yellow-600 hover:text-yellow-800" title="Give feedback"><MessageSquare size={16} /></button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                    <div><span className="text-sm text-gray-600">Progress:</span> <span className="ml-2 font-semibold">{selectedCartForView.completed_services || 0} / {selectedCartForView.total_services || 0} completed</span></div>
                    <Button onClick={closeViewModal}>Close</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer History Modal (stable component) */}
      <TransferHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={transferHistory}
        isLoading={isLoadingHistory}
      />

      {/* Feedback Modal (stable component) */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={closeFeedbackModal}
        service={selectedServiceForFeedback}
        userId={sessionUser.user_id}
        onSubmit={submitFeedback}
      />
    </div>
  );
};

export default CartPage;