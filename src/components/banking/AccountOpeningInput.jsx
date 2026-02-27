import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, Loader2, AlertCircle, ShoppingCart, Plus, X, ChevronDown, Check,
  Building2, Landmark, Wallet, Activity, Users, CreditCard, Banknote, TrendingUp, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// --- Constants ---

const BRANCHES = [
  { id: '1', name: 'Main Branch' },
  { id: '2', name: 'Downtown Branch' },
  { id: '3', name: 'Westside Branch' },
];

const CURRENCIES = [
  { id: 'usd', name: 'USD - US Dollar' },
  { id: 'eur', name: 'EUR - Euro' },
  { id: 'gbp', name: 'GBP - British Pound' },
  { id: 'inr', name: 'INR - Indian Rupee' },
  { id: 'aed', name: 'AED - UAE Dirham' },
];

const ACCOUNT_TYPES = [
  { value: 'savings', label: 'Savings Account', desc: 'Earn interest on your deposits', icon: '💰' },
  { value: 'current', label: 'Current Account', desc: 'Unlimited transactions & cheques', icon: '🏦' },
  { value: 'fixed-deposit', label: 'Fixed Deposit Account', desc: 'Lock funds for higher returns', icon: '📈' },
  { value: 'fx', label: 'Foreign Currency Account', desc: 'Hold USD, EUR, GBP & more', icon: '🌍' },
  { value: 'junior-savings', label: 'Junior Savings Account', desc: 'For children under 18', icon: '👶' },
  { value: 'business-current', label: 'Business Current Account', desc: 'SME & corporate banking', icon: '🏢' },
];

const CROSS_SELL_BY_ACCOUNT = {
  savings: [
    { id: 'mobile-banking', label: 'Mobile Banking', desc: 'Track savings on the go', icon: '📱' },
    { id: 'standing-order', label: 'Auto-Save Standing Order', desc: 'Automate monthly deposits', icon: '🔄' },
  ],
  current: [
    { id: 'debit-card', label: 'Visa Debit Card', desc: 'Instant card for your account', icon: '💳' },
    { id: 'cheque-book', label: 'Cheque Book', desc: 'Business & personal cheques', icon: '📝' },
  ],
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-advisor`;

// --- Helper Components ---

const ThemeInput = ({ label, name, type = "text", icon: Icon, placeholder, value, onChange, error, readOnly, disabled }) => (
  <div className="space-y-1.5">
    <label htmlFor={name} className="text-xs font-medium text-foreground flex items-center gap-1.5">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      {label}
    </label>
    <Input
      id={name}
      name={name}
      type={type}
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange}
      readOnly={readOnly}
      disabled={disabled}
      className={`bg-input border-border focus-visible:ring-ring ${error ? 'border-destructive' : ''} ${readOnly ? 'bg-muted/50 cursor-not-allowed' : ''}`}
    />
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

const ThemeSelect = ({ label, name, icon: Icon, options, value, onChange, error }) => (
  <div className="space-y-1.5">
    <label htmlFor={name} className="text-xs font-medium text-foreground flex items-center gap-1.5">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      {label}
    </label>
    <select
      id={name}
      name={name}
      value={value || ''}
      onChange={onChange}
      className={`flex h-10 w-full items-center justify-between rounded-md border bg-input px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-destructive' : 'border-border'}`}
    >
      <option value="" disabled>Select...</option>
      {options.map(opt => (
        <option key={opt.id || opt} value={opt.id || opt}>{opt.name || opt}</option>
      ))}
    </select>
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

// --- Main Component ---

export function AccountOpeningInput({ customer, onSubmit, validationErrors }) {
  // Form State mapped to CustomerAccount Model - ALL 3 FIELDS INCLUDED
  const [formData, setFormData] = useState({
    branch: '',
    currency: '',
    account_category: 'INDIVIDUAL',
    balance: '0',           // ✅ FIELD 3: BALANCE
    mode_of_operation: '',
    source_of_funds: '',
    expected_monthly_transaction_volume: '',
    account_type: '',       // ✅ FIELD 1: ACCOUNT TYPE
    account_number: '',     // ✅ FIELD 2: ACCOUNT NUMBER
  });
  const [formErrors, setFormErrors] = useState({});

  // UI State - FIXED: Removed TypeScript generics
  const [selectedAccounts, setSelectedAccounts] = useState([]); 
  const [crossSellSelected, setCrossSellSelected] = useState([]);
  const [showManualSelect, setShowManualSelect] = useState(true);

  // Refs
  const chatEndRef = useRef(null);

  // Sync account_number from customer prop
  useEffect(() => {
    if (customer?.account_number) {
      setFormData(prev => ({ ...prev, account_number: customer.account_number }));
    }
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.branch) newErrors.branch = "Branch is required";
    if (!formData.account_type) newErrors.account_type = "Account Type is required";     // ✅ account_type validation
    if (!formData.source_of_funds) newErrors.source_of_funds = "Source of funds is required";
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleAccount = (value) => {
    setSelectedAccounts(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
    // Sync to formData.account_type (single selection)
    setFormData(prev => ({
      ...prev,
      account_type: prev.account_type === value ? '' : value,
    }));
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // ✅ ALL 3 FIELDS INCLUDED IN PAYLOAD
    const payload = {
      branch: formData.branch,
      customer: customer?.id,
      account_type: formData.account_type,                    // ✅ FIELD 1
      account_number: formData.account_number || undefined,   // ✅ FIELD 2  
      currency: formData.currency,
      account_category: formData.account_category,
      balance: Number(formData.balance || 0),                 // ✅ FIELD 3
      mode_of_operation: formData.mode_of_operation,
      source_of_funds: formData.source_of_funds,
      expected_monthly_transaction_volume: formData.expected_monthly_transaction_volume,
      cross_sell_products: crossSellSelected,
    };

    onSubmit(payload);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl bg-card rounded-xl shadow-card border border-border p-8 sm:p-10 space-y-8"
      >
        {/* Section 1: Core Configuration (Model Fields) */}
        <div className="space-y-6">
          {/* Group 1: Account Context - NOW HAS ALL 3 MISSING FIELDS */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Landmark className="h-4 w-4" /> Account Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Branch */}
              <ThemeSelect 
                label="Branch" 
                name="branch" 
                icon={Building2} 
                options={BRANCHES} 
                value={formData.branch} 
                onChange={handleChange} 
                error={formErrors.branch} 
              />

              {/* 2. Customer (Read Only) */}
              <ThemeInput 
                label="Customer" 
                name="customer" 
                icon={User} 
                value={customer?.name || customer?.id || 'Selected Customer'} 
                readOnly 
              />

              {/* ✅ FIELD 1: Account Type */}
              <ThemeSelect 
                label="Account Type" 
                name="account_type" 
                icon={Wallet} 
                options={ACCOUNT_TYPES.map(a => ({ id: a.value, name: a.label }))} 
                value={formData.account_type} 
                onChange={handleChange} 
                error={formErrors.account_type}
              />

              {/* 4. Currency */}
              <ThemeSelect 
                label="Currency" 
                name="currency" 
                icon={Banknote} 
                options={CURRENCIES} 
                value={formData.currency} 
                onChange={handleChange} 
              />

              {/* 5. Account Category */}
              <ThemeSelect 
                label="Account Category" 
                name="account_category" 
                icon={Users} 
                options={['INDIVIDUAL', 'JOINT']} 
                value={formData.account_category} 
                onChange={handleChange} 
              />

              {/* ✅ FIELD 2: Account Number */}
              <ThemeInput 
                label="Account Number" 
                name="account_number" 
                icon={Hash} 
                placeholder="Auto-generated after creation" 
                value={formData.account_number} 
                onChange={handleChange} 
                readOnly 
              />
            </div>
          </div>

          {/* Group 2: Operational Details */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4" /> Operational Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ThemeInput 
                label="Mode of Operation" 
                name="mode_of_operation" 
                icon={CreditCard} 
                placeholder="e.g. Self, Jointly" 
                value={formData.mode_of_operation} 
                onChange={handleChange} 
              />

              <ThemeInput 
                label="Source of Funds" 
                name="source_of_funds" 
                icon={Wallet} 
                placeholder="e.g. Salary, Business" 
                value={formData.source_of_funds} 
                onChange={handleChange} 
                error={formErrors.source_of_funds} 
              />

              <ThemeInput 
                label="Expected Monthly Volume" 
                name="expected_monthly_transaction_volume" 
                type="number" 
                icon={TrendingUp} 
                placeholder="0.00" 
                value={formData.expected_monthly_transaction_volume} 
                onChange={handleChange} 
              />

              {/* ✅ FIELD 3: Balance */}
              <ThemeInput 
                label="Initial Deposit (Balance)" 
                name="balance" 
                type="number" 
                icon={Banknote} 
                placeholder="0.00" 
                value={formData.balance} 
                onChange={handleChange} 
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Account Type Cards (Optional UX enhancement) */}
      <div className="space-y-3 pt-4 border-t border-border max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowManualSelect(!showManualSelect)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            Browse Account Types
            <ChevronDown className={`h-4 w-4 transition-transform ${showManualSelect ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {showManualSelect && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-2">
                {ACCOUNT_TYPES.map(t => {
                  const isSelected = selectedAccounts.includes(t.value);
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleAccount(t.value)}
                      className={`relative text-left rounded-xl border-2 p-3 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <span className="text-lg">{t.icon}</span>
                      <p className="text-sm font-medium text-foreground mt-1">{t.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary & Submit */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto rounded-xl border border-border bg-muted/30 p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Summary</h4>
        </div>

        {formData.account_type && (
          <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-card">
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {ACCOUNT_TYPES.find(t => t.value === formData.account_type)?.icon}
              </span>
              <span className="text-sm font-medium text-foreground">
                {ACCOUNT_TYPES.find(t => t.value === formData.account_type)?.label}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, account_type: '' }));
                setSelectedAccounts([]);
              }}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <Button onClick={handleSubmit} className="w-full h-12 text-base font-semibold mt-4">
          Create Account
        </Button>
      </motion.div>
    </div>
  );
}
