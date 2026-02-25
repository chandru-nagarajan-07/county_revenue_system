import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShieldAlert, Lock, Unlock, CreditCard, RefreshCw,
  Settings, Moon, Sun, Check, AlertCircle, ChevronRight, DollarSign,
  Calendar, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from '@/data/demoCustomers';

const MODIFICATION_ACTIONS = [
  {
    id: 'set-transaction-limit',
    label: 'Set Transaction Limit',
    description: 'Configure daily, per-transaction, or monthly limits',
    icon: <ShieldAlert className="h-5 w-5" />,
    color: 'text-[hsl(var(--info))]',
  },
  {
    id: 'block-unblock',
    label: 'Block / Unblock Account or Card',
    description: 'Temporarily restrict or restore account access',
    icon: <Lock className="h-5 w-5" />,
    color: 'text-[hsl(var(--destructive))]',
  },
  {
    id: 'set-standing-order',
    label: 'Set Standing Order',
    description: 'Create or modify recurring payment instructions',
    icon: <Calendar className="h-5 w-5" />,
    color: 'text-[hsl(var(--accent))]',
  },
  {
    id: 'change-currency',
    label: 'Change Account Currency',
    description: 'Convert account to a different operating currency',
    icon: <Globe className="h-5 w-5" />,
    color: 'text-[hsl(var(--warning))]',
  },
  {
    id: 'activate-dormant',
    label: 'Activate / Set Dormant',
    description: 'Change account active status',
    icon: <Moon className="h-5 w-5" />,
    color: 'text-[hsl(var(--primary))]',
  },
];

const CURRENCIES = ['KES', 'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'ZAR', 'UGX', 'TZS'];

export function AccountModificationInput({ customer, onSubmit }) {
  const [phase, setPhase] = useState('select');
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [details, setDetails] = useState({});
  const [errors, setErrors] = useState({});

  const allAccounts = useMemo(
    () => customer.accounts.filter(a => a.type === 'savings' || a.type === 'current' || a.type === 'fx'),
    [customer]
  );

  const updateDetail = (key, value) => {
    setDetails(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleSelectAction = (actionId) => {
    setSelectedAction(actionId);
    setDetails({});
    setErrors({});
    setSelectedAccount(null);
    setPhase('details');
  };

  const validate = () => {
    const errs = {};
    if (!selectedAccount) errs.account = 'Please select an account';

    if (selectedAction === 'set-transaction-limit') {
      if (!details.limitType) errs.limitType = 'Select a limit type';
      if (!details.limitAmount || Number(details.limitAmount) <= 0) errs.limitAmount = 'Enter a valid amount';
    }
    if (selectedAction === 'block-unblock') {
      if (!details.blockAction) errs.blockAction = 'Select an action';
      if (!details.blockTarget) errs.blockTarget = 'Select what to block/unblock';
      if (!details.reason) errs.reason = 'Provide a reason';
    }
    if (selectedAction === 'set-standing-order') {
      if (!details.beneficiary) errs.beneficiary = 'Enter beneficiary account';
      if (!details.amount || Number(details.amount) <= 0) errs.amount = 'Enter a valid amount';
      if (!details.frequency) errs.frequency = 'Select frequency';
      if (!details.startDate) errs.startDate = 'Select start date';
    }
    if (selectedAction === 'change-currency') {
      if (!details.newCurrency) errs.newCurrency = 'Select new currency';
    }
    if (selectedAction === 'activate-dormant') {
      if (!details.statusAction) errs.statusAction = 'Select an action';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const action = MODIFICATION_ACTIONS.find(a => a.id === selectedAction);
    onSubmit({
      selectedAction: selectedAction,
      actionLabel: action?.label || '',
      details: {
        ...details,
        accountNumber: selectedAccount.accountNumber,
        accountName: selectedAccount.accountName,
      },
    });
  };

  const actionObj = MODIFICATION_ACTIONS.find(a => a.id === selectedAction);

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Customer banner */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {customer.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{customer.fullName}</p>
          <p className="text-xs text-muted-foreground">{customer.customerId} • {customer.phone}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* PHASE 1: Action selection */}
        {phase === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <h3 className="font-display text-base font-semibold text-foreground">Select Modification Type</h3>
            <p className="text-sm text-muted-foreground">Choose the account change you wish to perform</p>

            <div className="space-y-2 mt-4">
              {MODIFICATION_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleSelectAction(action.id)}
                  className="w-full flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left hover:shadow-card hover:border-accent/40 transition-all touch-target group"
                >
                  <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${action.color} shrink-0`}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground">{action.label}</h4>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* PHASE 2: Detail form for selected action */}
        {phase === 'details' && selectedAction && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <button
              onClick={() => setPhase('select')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to actions
            </button>

            <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
              <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${actionObj?.color} shrink-0`}>
                {actionObj?.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{actionObj?.label}</h3>
                <p className="text-xs text-muted-foreground">{actionObj?.description}</p>
              </div>
            </div>

            {/* Account selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Account *</Label>
              <Select
                value={selectedAccount?.accountNumber || ''}
                onValueChange={(val) => {
                  const acc = allAccounts.find(a => a.accountNumber === val) || null;
                  setSelectedAccount(acc);
                  setErrors(prev => ({ ...prev, account: '' }));
                }}
              >
                <SelectTrigger className={`touch-target ${errors.account ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Choose an account..." />
                </SelectTrigger>
                <SelectContent>
                  {allAccounts.map((acc) => (
                    <SelectItem key={acc.accountNumber} value={acc.accountNumber}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{acc.accountNumber}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[acc.type]}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs">{acc.currency} {acc.balance.toLocaleString()}</span>
                        {acc.status === 'dormant' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-warning/10 text-[hsl(var(--warning))] font-medium">Dormant</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.account && <p className="text-xs text-destructive">{errors.account}</p>}
            </div>

            {/* --- SET TRANSACTION LIMIT --- */}
            {selectedAction === 'set-transaction-limit' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Limit Type *</Label>
                  <Select value={details.limitType || ''} onValueChange={(v) => updateDetail('limitType', v)}>
                    <SelectTrigger className={`touch-target ${errors.limitType ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select limit type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Transaction Limit</SelectItem>
                      <SelectItem value="per-transaction">Per-Transaction Limit</SelectItem>
                      <SelectItem value="monthly">Monthly Transaction Limit</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.limitType && <p className="text-xs text-destructive">{errors.limitType}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">New Limit Amount ({selectedAccount?.currency || 'KES'}) *</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 500000"
                    value={details.limitAmount || ''}
                    onChange={(e) => updateDetail('limitAmount', e.target.value)}
                    className={`touch-target ${errors.limitAmount ? 'border-destructive' : ''}`}
                  />
                  {errors.limitAmount && <p className="text-xs text-destructive">{errors.limitAmount}</p>}
                </div>
              </div>
            )}

            {/* --- BLOCK / UNBLOCK --- */}
            {selectedAction === 'block-unblock' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Action *</Label>
                  <Select value={details.blockAction || ''} onValueChange={(v) => updateDetail('blockAction', v)}>
                    <SelectTrigger className={`touch-target ${errors.blockAction ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select action..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block">Block</SelectItem>
                      <SelectItem value="unblock">Unblock</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.blockAction && <p className="text-xs text-destructive">{errors.blockAction}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Target *</Label>
                  <Select value={details.blockTarget || ''} onValueChange={(v) => updateDetail('blockTarget', v)}>
                    <SelectTrigger className={`touch-target ${errors.blockTarget ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="What to block/unblock..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="debit-card">Debit Card</SelectItem>
                      <SelectItem value="credit-card">Credit Card</SelectItem>
                      <SelectItem value="online-banking">Online Banking</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.blockTarget && <p className="text-xs text-destructive">{errors.blockTarget}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Reason *</Label>
                  <Input
                    placeholder="e.g. Customer requested temporary block"
                    value={details.reason || ''}
                    onChange={(e) => updateDetail('reason', e.target.value)}
                    className={`touch-target ${errors.reason ? 'border-destructive' : ''}`}
                  />
                  {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
                </div>
                {details.blockAction === 'block' && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-xs text-destructive">Blocking will immediately prevent all transactions on the selected target.</p>
                  </div>
                )}
              </div>
            )}

            {/* --- SET STANDING ORDER --- */}
            {selectedAction === 'set-standing-order' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Beneficiary Account *</Label>
                  <Input
                    placeholder="Enter beneficiary account number"
                    value={details.beneficiary || ''}
                    onChange={(e) => updateDetail('beneficiary', e.target.value)}
                    className={`touch-target ${errors.beneficiary ? 'border-destructive' : ''}`}
                  />
                  {errors.beneficiary && <p className="text-xs text-destructive">{errors.beneficiary}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Beneficiary Name</Label>
                  <Input
                    placeholder="Enter beneficiary name"
                    value={details.beneficiaryName || ''}
                    onChange={(e) => updateDetail('beneficiaryName', e.target.value)}
                    className="touch-target"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Amount ({selectedAccount?.currency || 'KES'}) *</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount per payment"
                    value={details.amount || ''}
                    onChange={(e) => updateDetail('amount', e.target.value)}
                    className={`touch-target ${errors.amount ? 'border-destructive' : ''}`}
                  />
                  {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Frequency *</Label>
                  <Select value={details.frequency || ''} onValueChange={(v) => updateDetail('frequency', v)}>
                    <SelectTrigger className={`touch-target ${errors.frequency ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select frequency..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.frequency && <p className="text-xs text-destructive">{errors.frequency}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Start Date *</Label>
                  <Input
                    type="date"
                    value={details.startDate || ''}
                    onChange={(e) => updateDetail('startDate', e.target.value)}
                    className={`touch-target ${errors.startDate ? 'border-destructive' : ''}`}
                  />
                  {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">End Date (optional)</Label>
                  <Input
                    type="date"
                    value={details.endDate || ''}
                    onChange={(e) => updateDetail('endDate', e.target.value)}
                    className="touch-target"
                  />
                </div>
              </div>
            )}

            {/* --- CHANGE CURRENCY --- */}
            {selectedAction === 'change-currency' && (
              <div className="space-y-4">
                {selectedAccount && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                    <Globe className="h-4 w-4 text-[hsl(var(--info))] shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Current currency: <span className="font-semibold text-foreground">{selectedAccount.currency}</span>
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">New Currency *</Label>
                  <Select value={details.newCurrency || ''} onValueChange={(v) => updateDetail('newCurrency', v)}>
                    <SelectTrigger className={`touch-target ${errors.newCurrency ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select new currency..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.filter(c => c !== selectedAccount?.currency).map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.newCurrency && <p className="text-xs text-destructive">{errors.newCurrency}</p>}
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-warning/5 border border-warning/20 p-3">
                  <AlertCircle className="h-4 w-4 text-[hsl(var(--warning))] shrink-0" />
                  <p className="text-xs text-[hsl(var(--warning))]">Currency conversion will be applied at the prevailing exchange rate. Existing balances will be converted.</p>
                </div>
              </div>
            )}

            {/* --- ACTIVATE / SET DORMANT --- */}
            {selectedAction === 'activate-dormant' && (
              <div className="space-y-4">
                {selectedAccount && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                    {selectedAccount.status === 'dormant' ? (
                      <Moon className="h-4 w-4 text-[hsl(var(--warning))] shrink-0" />
                    ) : (
                      <Sun className="h-4 w-4 text-[hsl(var(--success))] shrink-0" />
                    )}
                    <p className="text-xs text-muted-foreground">
                      Current status: <span className={`font-semibold ${selectedAccount.status === 'active' ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--warning))]'}`}>
                        {selectedAccount.status.charAt(0).toUpperCase() + selectedAccount.status.slice(1)}
                      </span>
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Action *</Label>
                  <Select value={details.statusAction || ''} onValueChange={(v) => updateDetail('statusAction', v)}>
                    <SelectTrigger className={`touch-target ${errors.statusAction ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select action..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activate">Activate Account</SelectItem>
                      <SelectItem value="set-dormant">Set Account as Dormant</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.statusAction && <p className="text-xs text-destructive">{errors.statusAction}</p>}
                </div>
                {details.statusAction === 'set-dormant' && (
                  <div className="flex items-center gap-2 rounded-lg bg-warning/5 border border-warning/20 p-3">
                    <AlertCircle className="h-4 w-4 text-[hsl(var(--warning))] shrink-0" />
                    <p className="text-xs text-[hsl(var(--warning))]">Setting an account as dormant will restrict all debit transactions. Credits will still be accepted.</p>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              className="w-full touch-target gold-gradient text-accent-foreground font-semibold text-base shadow-gold hover:shadow-elevated transition-shadow mt-4"
            >
              Submit for Validation
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
