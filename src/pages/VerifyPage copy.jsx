import { useEffect } from 'react'; // 1. Import useEffect
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Landmark, Wallet, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VerifyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Retrieve customer data passed from Login
  const customer = location.state?.customer;
  // 2. Move the redirect logic into useEffect
  useEffect(() => {
    if (!customer) {
      navigate('/');
    }
  }, [customer, navigate]);

  // 3. Keep this guard clause to prevent the code below from crashing 
  // if customer is null (while the redirect happens)
  if (!customer) {
    return null;
  }

  const handleChangeCustomer = () => {
    navigate('/');
  };

  const handleProceed = () => {
    // Pass the customer data forward to the Dashboard
    navigate('/dashboard', { state: { customer } });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto bg-muted/40"
    >
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg border border-border overflow-hidden">
        <div className="bg-primary/5 p-6 border-b border-border text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Customer Verified</h2>
        </div>

        <div className="p-6 border-b border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium text-foreground">{customer.fullName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Customer ID:</span>
            <span className="font-medium text-foreground">{customer.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium text-foreground">{customer.phone}</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {customer.accounts.map((acc) => (
            <div key={acc.id} className="bg-background p-3 rounded-lg border border-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                   {acc.type.includes('Savings') ? <Landmark className="w-4 h-4"/> : 
                    acc.type.includes('Current') ? <Wallet className="w-4 h-4"/> :
                    acc.type.includes('Foreign') ? <DollarSign className="w-4 h-4"/> : 
                    <Clock className="w-4 h-4"/>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{acc.number}</p>
                  <p className="text-sm font-medium text-foreground">{acc.type} · {acc.currency}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">
                  {acc.currency === 'KES' ? 'Ksh' : 'US$'} {acc.balance}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  {acc.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleChangeCustomer}>
            Change Customer
          </Button>
          <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleProceed}>
            Proceed
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default VerifyPage;