import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, UserCheck, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { findCustomerById } from '@/data/demoCustomers';
import { ACCOUNT_TYPE_LABELS } from '@/data/demoCustomers';

export function CustomerLookup({ onAuthenticated, onSkip }) {
  const [customerId, setCustomerId] = useState('');
  const [error, setError] = useState('');
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleLookup = () => {
    if (!customerId.trim()) {
      setError('Please enter a customer number');
      return;
    }

    setIsVerifying(true);
    setError('');

    // Simulate verification delay
    setTimeout(() => {
      const customer = findCustomerById(customerId.trim());
      if (customer) {
        setFoundCustomer(customer);
      } else {
        setError('Customer not found. Please check the customer number and try again.');
      }
      setIsVerifying(false);
    }, 800);
  };

  const handleConfirm = () => {
    if (foundCustomer) {
      onAuthenticated(foundCustomer);
    }
  };

  const formatBalance = (balance, currency) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(Math.abs(balance));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-2">
            <UserCheck className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">Customer Verification</h2>
          <p className="text-sm text-muted-foreground">Enter the customer number to retrieve their profile and accounts</p>
        </div>

        {!foundCustomer ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-id" className="text-sm font-medium">Customer Number</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customer-id"
                  placeholder="e.g. CUST001"
                  value={customerId}
                  onChange={(e) => { setCustomerId(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  className="pl-10 touch-target"
                  autoFocus
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-xs">{error}</p>
                </div>
              )}
            </div>

            <Button
              onClick={handleLookup}
              disabled={isVerifying}
              className="w-full touch-target gold-gradient text-accent-foreground font-semibold shadow-gold"
            >
              {isVerifying ? 'Verifying...' : 'Look Up Customer'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Demo IDs: CUST001, CUST002, CUST003, CUST004
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="rounded-xl border-2 border-success/30 bg-success/5 p-5 space-y-3">
              <div className="flex items-center gap-2 text-success mb-3">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-semibold">Customer Verified</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium text-foreground">{foundCustomer.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer ID</span>
                  <span className="font-medium text-foreground">{foundCustomer.customerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium text-foreground">{foundCustomer.phone}</span>
                </div>
              </div>

              <div className="border-t border-border pt-3 mt-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Accounts ({foundCustomer.accounts.length})
                </h4>
                <div className="space-y-2">
                  {foundCustomer.accounts.map((acc) => (
                    <div key={acc.accountNumber} className="flex items-center justify-between text-xs rounded-lg bg-card p-2.5 border border-border">
                      <div>
                        <p className="font-medium text-foreground">{acc.accountNumber}</p>
                        <p className="text-muted-foreground">{ACCOUNT_TYPE_LABELS[acc.type]} • {acc.currency}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${acc.balance < 0 ? 'text-destructive' : 'text-foreground'}`}>
                          {formatBalance(acc.balance, acc.currency)}
                        </p>
                        <p className={`text-[10px] uppercase ${acc.status === 'active' ? 'text-success' : 'text-warning'}`}>
                          {acc.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setFoundCustomer(null); setCustomerId(''); }}
                className="flex-1 touch-target"
              >
                Change Customer
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 touch-target gold-gradient text-accent-foreground font-semibold shadow-gold"
              >
                Proceed
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
