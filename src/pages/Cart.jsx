import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowLeft, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CartPage = () => {
  const navigate = useNavigate();

  // Pending and completed items
  const [pendingItems, setPendingItems] = useState([
    { id: 1, name: 'Wireless Mouse', description: 'Ergonomic, 2.4GHz', quantity: 1, price: 29.99 },
    { id: 2, name: 'Mechanical Keyboard', description: 'RGB backlit, blue switches', quantity: 1, price: 89.99 },
    { id: 3, name: 'USB-C Hub', description: '7-in-1, 4K HDMI', quantity: 2, price: 45.50 },
  ]);
  const [completedItems, setCompletedItems] = useState([]);
  const [selectedPendingId, setSelectedPendingId] = useState(null);

  // Modal state for QR popup
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompletedItem, setSelectedCompletedItem] = useState(null);

  // Move selected pending item to completed
  const completeItem = () => {
    if (selectedPendingId === null) return;
    const itemToComplete = pendingItems.find(item => item.id === selectedPendingId);
    if (itemToComplete) {
      setCompletedItems(prev => [...prev, itemToComplete]);
      setPendingItems(prev => prev.filter(item => item.id !== selectedPendingId));
      setSelectedPendingId(null);
    }
  };

  // Remove an item from either list
  const removeItem = (id, listType) => {
    if (listType === 'pending') {
      setPendingItems(prev => prev.filter(item => item.id !== id));
      if (selectedPendingId === id) setSelectedPendingId(null);
    } else {
      setCompletedItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Calculate subtotal for a list (for display, though not used currently)
  const getSubtotal = (items) =>
    items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Generate QR code URL using public API
  const getQrCodeUrl = (item) => {
    const data = `Item: ${item.name}\nDescription: ${item.description}\nQuantity: ${item.quantity}\nPrice per unit: $${item.price.toFixed(2)}\nTotal: $${(item.price * item.quantity).toFixed(2)}\nCompleted at: ${new Date().toLocaleString()}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
  };

  // Download the entire completed list as a text file
  const downloadCompletedList = () => {
    if (completedItems.length === 0) return;

    const content = completedItems.map(item => {
      return `Item: ${item.name}
Description: ${item.description}
Quantity: ${item.quantity}
Unit Price: $${item.price.toFixed(2)}
Total: $${(item.price * item.quantity).toFixed(2)}
----------------------------------------`;
    }).join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `completed_orders_${new Date().toISOString().slice(0,19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Open modal for the selected completed item
  const openQrModal = (item) => {
    setSelectedCompletedItem(item);
    setIsModalOpen(true);
  };

  // Close modal
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
          {/* Header with back button */}
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

          {/* Tabs for Pending and Completed */}
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="pending">
                Pending ({pendingItems.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedItems.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Tab */}
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
                          <th className="px-6 py-4 text-left font-semibold text-slate-600">Item</th>
                          <th className="px-6 py-4 text-left font-semibold text-slate-600">Description</th>
                          <th className="px-6 py-4 text-center font-semibold text-slate-600">Quantity</th>
                          <th className="px-6 py-4 text-right font-semibold text-slate-600">Unit Price</th>
                          <th className="px-6 py-4 text-right font-semibold text-slate-600">Total</th>
                          <th className="px-6 py-4 text-center font-semibold text-slate-600">Actions</th>
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
                              transition={{ duration: 0.2 }}
                              className={`border-b hover:bg-slate-50 cursor-pointer ${
                                selectedPendingId === item.id ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => setSelectedPendingId(item.id)}
                            >
                              <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                              <td className="px-6 py-4 text-slate-500">{item.description}</td>
                              <td className="px-6 py-4 text-center">{item.quantity}</td>
                              <td className="px-6 py-4 text-right text-slate-600">
                                ${item.price.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-slate-800">
                                ${(item.price * item.quantity).toFixed(2)}
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

                  {/* Complete Button (only appears when an item is selected) */}
                  {selectedPendingId !== null && (
                    <div className="p-4 border-t bg-slate-50 flex justify-end">
                      <Button onClick={completeItem} className="bg-green-600 hover:bg-green-700">
                        Complete Selected Order
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Completed Tab */}
            <TabsContent value="completed">
              {completedItems.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-slate-500">
                  No completed orders.
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-6 py-4 text-left font-semibold text-slate-600">Item</th>
                          <th className="px-6 py-4 text-left font-semibold text-slate-600">Description</th>
                          <th className="px-6 py-4 text-center font-semibold text-slate-600">Quantity</th>
                          <th className="px-6 py-4 text-right font-semibold text-slate-600">Unit Price</th>
                          <th className="px-6 py-4 text-right font-semibold text-slate-600">Total</th>
                          <th className="px-6 py-4 text-center font-semibold text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {completedItems.map((item) => (
                            <motion.tr
                              key={item.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.2 }}
                              className="border-b hover:bg-slate-50"
                            >
                              <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                              <td className="px-6 py-4 text-slate-500">{item.description}</td>
                              <td className="px-6 py-4 text-center">{item.quantity}</td>
                              <td className="px-6 py-4 text-right text-slate-600">
                                ${item.price.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-slate-800">
                                ${(item.price * item.quantity).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {/* <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(item.id, 'completed')}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button> */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openQrModal(item)}
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <QrCode className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
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
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Order QR Code</h2>
            <div className="flex justify-center mb-6">
              <img
                src={getQrCodeUrl(selectedCompletedItem)}
                alt="QR Code"
                className="w-48 h-48 object-contain"
              />
            </div>
            <div className="text-sm text-slate-600 mb-4">
              <p><strong>Item:</strong> {selectedCompletedItem.name}</p>
              <p><strong>Description:</strong> {selectedCompletedItem.description}</p>
              <p><strong>Quantity:</strong> {selectedCompletedItem.quantity}</p>
              <p><strong>Total:</strong> ${(selectedCompletedItem.price * selectedCompletedItem.quantity).toFixed(2)}</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button onClick={downloadCompletedList} className="bg-blue-600 hover:bg-blue-700">
                Download List
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;