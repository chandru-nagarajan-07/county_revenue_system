import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';
import { useNavigate } from 'react-router-dom';

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Wireless Mouse', description: 'Ergonomic, 2.4GHz', quantity: 1, price: 29.99 },
    { id: 2, name: 'Mechanical Keyboard', description: 'RGB backlit, blue switches', quantity: 1, price: 89.99 },
    { id: 3, name: 'USB-C Hub', description: '7-in-1, 4K HDMI', quantity: 2, price: 45.50 },
  ]);

  const updateQuantity = (id, delta) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

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
             Cart
            </h1>
          </div>

          {/* Cart Table */}
          {cartItems.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-slate-500">
              Your cart is empty.
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
                      {cartItems.map((item) => (
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
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                -
                              </Button> */}
                              <span className="w-8 text-center">{item.quantity}</span>
                              {/* <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                +
                              </Button> */}
                            </div>
                          </td>
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
                              onClick={() => removeItem(item.id)}
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

              {/* Summary */}
         
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default CartPage;