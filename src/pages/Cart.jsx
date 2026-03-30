import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowLeft, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CartPage = () => {
  const navigate = useNavigate();

  const [pendingItems, setPendingItems] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);
  const [selectedPendingId, setSelectedPendingId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompletedItem, setSelectedCompletedItem] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/view_service_card_list/')
      .then((res) => res.json())
      .then((data) => {
        const serviceData = data.service_data || [];
        const modelData = data.model_data || [];

        const formattedData = serviceData.map((service) => {
          const model = modelData.find(
            (item) => item.id === service.service_data.id
          );

          return {
            id: service.id,
            service_request_id: service.service_request_id,
            service_code: service.service_code,
            service_name: service.service_name,
            amount: model?.amount || '-',
            branch: model?.branch || '-',
          };
        });

        setPendingItems(formattedData);
      })
      .catch((err) => console.error('API Error:', err));
  }, []);

  const completeItem = () => {
    if (selectedPendingId === null) return;

    const itemToComplete = pendingItems.find(
      (item) => item.id === selectedPendingId
    );

    if (itemToComplete) {
      setCompletedItems((prev) => [...prev, itemToComplete]);
      setPendingItems((prev) =>
        prev.filter((item) => item.id !== selectedPendingId)
      );
      setSelectedPendingId(null);
    }
  };

  const removeItem = (id, listType) => {
    if (listType === 'pending') {
      setPendingItems((prev) => prev.filter((item) => item.id !== id));
      if (selectedPendingId === id) setSelectedPendingId(null);
    } else {
      setCompletedItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const getQrCodeUrl = (item) => {
    const data = `
Request ID: ${item.service_request_id}
Service Code: ${item.service_code}
Service Name: ${item.service_name}
Amount: ${item.amount}
Branch: ${item.branch}
Completed At: ${new Date().toLocaleString()}
    `;

    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      data
    )}`;
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-6xl mx-auto"
        >
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <h1 className="font-display text-2xl font-bold text-slate-800">
                Cart
              </h1>
            </div>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="pending">
                Pending ({pendingItems.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedItems.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending */}
            <TabsContent value="pending">
              {pendingItems.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-slate-500">
                  No pending orders.
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-6 py-4 text-left">Request ID</th>
                          <th className="px-6 py-4 text-left">Code</th>
                          <th className="px-6 py-4 text-left">Service Name</th>
                          <th className="px-6 py-4 text-left">Amount</th>
                          <th className="px-6 py-4 text-left">Branch</th>
                          <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        <AnimatePresence>
                          {pendingItems.map((item) => (
                            <motion.tr
                              key={item.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className={`border-b hover:bg-slate-50 cursor-pointer ${
                                selectedPendingId === item.id
                                  ? 'bg-blue-50'
                                  : ''
                              }`}
                              onClick={() => setSelectedPendingId(item.id)}
                            >
                              <td className="px-6 py-4">
                                {item.service_request_id}
                              </td>
                              <td className="px-6 py-4">
                                {item.service_code}
                              </td>
                              <td className="px-6 py-4">
                                {item.service_name}
                              </td>
                              <td className="px-6 py-4">
                                {item.amount}
                              </td>
                              <td className="px-6 py-4">
                                {item.branch}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeItem(item.id, 'pending');
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>

                  {selectedPendingId !== null && (
                    <div className="p-4 border-t bg-slate-50 flex justify-end">
                      <Button
                        onClick={completeItem}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Complete Selected Order
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Completed */}
            <TabsContent value="completed">
              {completedItems.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-slate-500">
                  No completed orders.
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left">Request ID</th>
                        <th className="px-6 py-4 text-left">Code</th>
                        <th className="px-6 py-4 text-left">Service Name</th>
                        <th className="px-6 py-4 text-left">Amount</th>
                        <th className="px-6 py-4 text-left">Branch</th>
                        <th className="px-6 py-4 text-center">QR</th>
                      </tr>
                    </thead>

                    <tbody>
                      {completedItems.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-6 py-4">
                            {item.service_request_id}
                          </td>
                          <td className="px-6 py-4">
                            {item.service_code}
                          </td>
                          <td className="px-6 py-4">
                            {item.service_name}
                          </td>
                          <td className="px-6 py-4">
                            {item.amount}
                          </td>
                          <td className="px-6 py-4">
                            {item.branch}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openQrModal(item)}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* QR Modal */}
      {isModalOpen && selectedCompletedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">QR Code</h2>

            <div className="flex justify-center">
              <img
                src={getQrCodeUrl(selectedCompletedItem)}
                alt="QR"
                className="w-48 h-48"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;