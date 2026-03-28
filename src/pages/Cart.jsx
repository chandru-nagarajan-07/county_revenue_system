import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';
import { useNavigate } from 'react-router-dom';

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

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
          console.log('Model found for service:', model.branch?.branch_name);
          return {
            id: service.id,
            service_request_id: service.service_request_id,
            service_code: service.service_code,
            service_name: service.service_name,
            amount: model?.amount || '-',
            branch: model?.branch || '-',
          };
        });

        setCartItems(formattedData);
      })
      .catch((err) => console.error('API Error:', err));
  }, []);

  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
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
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <h1 className="font-display text-2xl font-bold text-slate-800">
              Service Card List
            </h1>
          </div>

          {/* Table */}
          {cartItems.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-slate-500">
              No data available.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-slate-600">
                        Request ID
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-600">
                        Service Code
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-600">
                        Service Name
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-600">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-slate-600">
                        Branch
                      </th>
                      <th className="px-6 py-4 text-center font-semibold text-slate-600">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {cartItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-slate-50"
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
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default CartPage;