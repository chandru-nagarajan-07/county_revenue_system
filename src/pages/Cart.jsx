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
  const [selectedIds, setSelectedIds] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompletedItem, setSelectedCompletedItem] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/service_queue_items/')
      .then((res) => res.json())
      .then((data) => {
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
      });
  }, []);

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const completeSelectedOrders = () => {
    if (selectedIds.length === 0) return;

    fetch('http://127.0.0.1:8000/service_items/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_ids: selectedIds,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Cart Created:', data);

        const completed = pendingItems.filter((item) =>
          selectedIds.includes(item.id)
        );

        setCompletedItems((prev) => [...prev, ...completed]);

        setPendingItems((prev) =>
          prev.filter((item) => !selectedIds.includes(item.id))
        );

        setSelectedIds([]);
      });
  };

  const removeItem = (id, listType) => {
    if (listType === 'pending') {
      setPendingItems((prev) => prev.filter((item) => item.id !== id));
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

          <Tabs defaultValue="pending">

            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="pending">
                Pending ({pendingItems.length})
              </TabsTrigger>

              <TabsTrigger value="completed">
                Completed ({completedItems.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending */}

            <TabsContent value="pending">

              <table className="w-full border">

                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Request ID</th>
                    <th>Code</th>
                    <th>Service</th>
                    <th>Amount</th>
                    <th>Branch</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {pendingItems.map((item) => (

                    <tr key={item.id}>

                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelection(item.id)}
                        />
                      </td>

                      <td>{item.service_request_id}</td>
                      <td>{item.service_code}</td>
                      <td>{item.service_name}</td>
                      <td>{item.amount}</td>
                      <td>{item.branch}</td>

                      <td>
                        <button
                          onClick={() =>
                            removeItem(item.id, 'pending')
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>

                    </tr>

                  ))}
                </tbody>

              </table>

              {selectedIds.length > 0 && (

                <div className="mt-4 text-right">

                  <Button
                    onClick={completeSelectedOrders}
                    className="bg-green-600"
                  >
                    Complete Selected Orders
                  </Button>

                </div>

              )}

            </TabsContent>

            {/* Completed */}

            <TabsContent value="completed">

              <table className="w-full border">

                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Code</th>
                    <th>Service</th>
                    <th>QR</th>
                  </tr>
                </thead>

                <tbody>

                  {completedItems.map((item) => (

                    <tr key={item.id}>

                      <td>{item.service_request_id}</td>
                      <td>{item.service_code}</td>
                      <td>{item.service_name}</td>

                      <td>
                        <button
                          onClick={() => openQrModal(item)}
                        >
                          <QrCode size={16} />
                        </button>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </TabsContent>

          </Tabs>

        </div>
      </main>

      {/* QR Modal */}

      {isModalOpen && selectedCompletedItem && (

        <div className="fixed inset-0 flex items-center justify-center bg-black/50">

          <div className="bg-white p-6 rounded">

            <button onClick={closeModal}>Close</button>

            <img
              src={getQrCodeUrl(selectedCompletedItem)}
              alt="QR"
            />

          </div>

        </div>

      )}

    </div>
  );
};

export default CartPage;