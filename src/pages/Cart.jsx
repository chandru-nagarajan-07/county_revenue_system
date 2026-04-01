import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowLeft, QrCode, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CartPage = () => {
  const navigate = useNavigate();

  const [pendingItems, setPendingItems] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompletedItem, setSelectedCompletedItem] = useState(null);

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
      const response = await fetch('http://127.0.0.1:8000/service_queue_items/');
      console.log('Raw pending items response:', response);
      const data = await response.json();
      console.log('Pending items from API:', data);
      
      const formattedData = data.map((service) => {
        return {
          id: service.id,
          service_request_id: service.service_request_id,
          service_code: service.service_code,
          service_name: service.service_name,
          amount: service.service_data?.amount || '-',
          branch: service.service_data?.branch || '-',
        };
      });

      setPendingItems(formattedData);
      console.log('Formatted pending items:', formattedData[0].id);
    } catch (error) {
      console.error('Error fetching pending items:', error);
    }
  };

  const fetchCompletedItems = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/service_cart_list_queue/');
      
      if (!response.ok) {
        console.error('API response not OK:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw completed items response:', data);
      
      // Store RAW data without formatting
      setCompletedItems(data);
      
    } catch (error) {
      console.error('Error fetching completed items:', error);
      setCompletedItems([]);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const completeSelectedOrders = async () => {
    if (selectedIds.length === 0) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/service_items/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_ids: selectedIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete orders');
      }

      const data = await response.json();
      console.log('Cart Created:', data);

      const completed = pendingItems.filter((item) =>
        selectedIds.includes(item.id)
      );

      const completedWithCartId = completed.map(item => ({
        ...item,
        cart_id: data.cart_id || `CART_${Date.now()}_${item.id}`,
        completed_at: new Date().toISOString(),
      }));

      setCompletedItems((prev) => [...prev, ...completedWithCartId]);
      setPendingItems((prev) =>
        prev.filter((item) => !selectedIds.includes(item.id))
      );
      setSelectedIds([]);
      
      if (activeTab === 'completed') {
        await fetchCompletedItems();
      }
      
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
    // Create QR data with cart info
    const qrData = {
      cart_id: item.cart_id,
      // total: item.total,
      services_count: item.services?.length || 0,
      completed_services: item.services?.filter(s => s.status === 'completed').length || 0,
      // services: item.services
    };
    
    const data = JSON.stringify(qrData, null, 2);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      data
    )}`;
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
      <DashboardHeader customerName="John Doe" />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <h1 className="text-2xl font-bold">Cart</h1>
          </div>

          <Tabs defaultValue="pending" onValueChange={(value) => {
            console.log('Tab changed to:', value);
            setActiveTab(value);
          }}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="pending">
                Pending ({pendingItems.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedItems.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Tab */}
            <TabsContent value="pending">
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Select
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Request ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Branch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Action
                        </th>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {item.service_request_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {item.service_code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {item.service_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {item.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {item.branch}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {pendingItems.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                            No pending items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedIds.length > 0 && (
                <div className="mt-4 text-right">
                  <Button
                    onClick={completeSelectedOrders}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Complete Selected Orders (${selectedIds.length})`}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Completed Tab - Show cart_id, total, services, completed services */}
            <TabsContent value="completed">
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Cart ID
                        </th>
                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Services
                        </th> */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Completed Services
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {completedItems.map((item, index) => {
                        // Calculate completed services count
                        const totalServices = item.services?.length || 0;
                        const completedServices = item.services?.filter(service => 
                          service.status === 'completed' || 
                          service.completed_at || 
                          service.is_completed
                        ).length || 0;
                        
                        return (
                          <tr key={item.cart_id || item.id || index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {item.cart_id || '-'}
                            </td>
                            {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {item.total || item.amount || '-'}
                            </td> */}
                            {/* <td className="px-6 py-4 text-sm text-slate-900">
                              <details>
                                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                  View ({totalServices} services)
                                </summary>
                                <pre className="mt-2 text-xs bg-slate-50 p-2 rounded overflow-auto max-h-40">
                                  {JSON.stringify(item.services, null, 2)}
                                </pre>
                              </details>
                            </td> */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {completedServices} / {totalServices}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openQrModal(item)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                                  aria-label="View QR code"
                                  title="View QR Code"
                                >
                                  <QrCode size={18} />
                                </button>
                                <button
                                  onClick={() => downloadQrCode(item)}
                                  className="text-green-600 hover:text-green-800 transition-colors p-1"
                                  aria-label="Download QR code"
                                  title="Download QR Code"
                                >
                                  <Download size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {completedItems.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                            No completed items
                          </td>
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
                <button
                  onClick={closeModal}
                  className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              <div className="flex justify-center mb-4">
                <img
                  src={getQrCodeUrl(selectedCompletedItem)}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <div className="mt-2 text-sm text-slate-600">
                <div className="bg-slate-50 p-3 rounded space-y-1">
                  <p><strong>Cart ID:</strong> {selectedCompletedItem.cart_id || '-'}</p>
                  <p><strong>Total:</strong> {selectedCompletedItem.total || selectedCompletedItem.amount || '-'}</p>
                  <p><strong>Total Services:</strong> {selectedCompletedItem.services?.length || 0}</p>
                  <p><strong>Completed Services:</strong> {
                    selectedCompletedItem.services?.filter(s => s.status === 'completed' || s.completed_at || s.is_completed).length || 0
                  }</p>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  onClick={() => downloadQrCode(selectedCompletedItem)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CartPage;