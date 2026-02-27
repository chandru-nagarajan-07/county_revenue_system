import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, Bot, User, Loader2, AlertCircle, ShoppingCart, Plus, X, ChevronDown, Check,
  Landmark, Building2, Wallet, Banknote, Users, Hash, Activity, CreditCard, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from '@/data/demoCustomers';

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
    { id: 'mobile-banking', label: 'Mobile Banking', desc: 'Manage transactions anywhere', icon: '📱' },
  ],
  'fixed-deposit': [
    { id: 'maturity-alert', label: 'Maturity Alerts', desc: 'SMS & email notifications', icon: '🔔' },
    { id: 'savings', label: 'Linked Savings Account', desc: 'Receive interest payouts', icon: '💰' },
  ],
  fx: [
    { id: 'fx-alerts', label: 'FX Rate Alerts', desc: 'Get notified on favorable rates', icon: '📊' },
    { id: 'intl-transfer', label: 'International Transfers', desc: 'Send money abroad easily', icon: '✈️' },
  ],
  'junior-savings': [
    { id: 'parent-alert', label: 'Parent Notifications', desc: 'Track your child\'s savings', icon: '👨‍👩‍👧' },
    { id: 'edu-plan', label: 'Education Plan', desc: 'Goal-based saving for school fees', icon: '🎓' },
  ],
  'business-current': [
    { id: 'pos-terminal', label: 'POS Terminal', desc: 'Accept card payments', icon: '🖥️' },
    { id: 'payroll', label: 'Payroll Services', desc: 'Automate salary payments', icon: '💼' },
    { id: 'business-loan', label: 'Business Overdraft', desc: 'Working capital facility', icon: '🏗️' },
  ],
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-advisor`;

// --- Helper Components ---

const ThemeInput = ({ label, icon: Icon, error, ...props }) => (
  <div className="space-y-1.5">
    <Label htmlFor={props.name} className="text-sm font-medium text-muted-foreground flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </Label>
    <Input 
      id={props.name}
      className={`${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
      {...props} 
    />
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

const ThemeSelect = ({ label, icon: Icon, options, value, onChange, name, error }) => {
  const handleValueChange = (val) => {
    // Mimic event target for consistency with standard inputs
    onChange({ target: { name, value: val } });
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-sm font-medium text-muted-foreground flex items-center gap-2">
         {Icon && <Icon className="h-4 w-4" />}
         {label}
      </Label>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className={`w-full ${error ? 'border-destructive' : ''}`}>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => {
            const isObject = typeof opt === 'object';
            const id = isObject ? opt.id : opt;
            const display = isObject ? opt.name : opt;
            return (
              <SelectItem key={id} value={id}>
                {display}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

// --- Main Component ---

export function AccountOpeningInput({ customer, onSubmit, validationErrors }) {
  // State for standard form fields (Model Fields)
  const [formData, setFormData] = useState({
    branch: '',
    account_type: '',
    currency: '',
    account_category: '',
    account_number: '',
    mode_of_operation: '',
    source_of_funds: '',
    expected_monthly_transaction_volume: '',
    balance: ''
  });

  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [crossSellSelected, setCrossSellSelected] = useState([]);
  const [showManualSelect, setShowManualSelect] = useState(false);

  // AI advisor state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatError, setChatError] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handler for standard form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleAccount = (value) => {
    setSelectedAccounts(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleCrossSell = (id) => {
    setCrossSellSelected(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const availableCrossSells = (() => {
    const seen = new Set();
    const items = [];
    selectedAccounts.forEach(acc => {
      (CROSS_SELL_BY_ACCOUNT[acc] || []).forEach(cs => {
        if (!seen.has(cs.id)) {
          seen.add(cs.id);
          items.push(cs);
        }
      });
    });
    return items;
  })();

  const sendMessage = async () => {
    const text = chatInput.trim();
    if (!text || isStreaming) return;
    setChatError(null);

    const userMsg = { role: 'user', content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsStreaming(true);

    let assistantSoFar = '';
    const allMsgs = [...chatMessages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMsgs }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error('No response stream');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setChatMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error('Product advisor error:', e);
      setChatError(e.message || 'Failed to get recommendation');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSubmit = () => {
    if (selectedAccounts.length === 0) return;
    onSubmit({ 
      ...formData, // Include form data
      accountTypes: selectedAccounts, 
      crossSellProducts: crossSellSelected 
    });
  };

  const cartCount = selectedAccounts.length + crossSellSelected.length;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
       <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl bg-card rounded-xl shadow-card border border-border p-8 sm:p-10 space-y-8"
      >
        {/* Section 1: Core Configuration (Model Fields) */}
        <div className="space-y-6">
          {/* Group 1: Account Context */}
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
                error={validationErrors?.branch} 
              />

              {/* 2. Customer (Read Only) */}
              <ThemeInput 
                label="Customer" 
                name="customer" 
                icon={User} 
                value={customer?.name || customer?.id || 'Selected Customer'} 
                readOnly 
              />

              {/* FIELD 1: Account Type */}
              <ThemeSelect 
                label="Account Type" 
                name="account_type" 
                icon={Wallet} 
                options={ACCOUNT_TYPES.map(a => ({ id: a.value, name: a.label }))} 
                value={formData.account_type} 
                onChange={handleChange} 
                error={validationErrors?.account_type}
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

              {/* FIELD 2: Account Number */}
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
                error={validationErrors?.source_of_funds} 
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

              {/* FIELD 3: Balance */}
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

      {/* ACCOUNT SELECTION — multi-select card grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowManualSelect(!showManualSelect)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            Select Accounts
            {selectedAccounts.length > 0 && (
              <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-[10px]">
                {selectedAccounts.length}
              </Badge>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${showManualSelect ? 'rotate-180' : ''}`} />
          </button>
          {validationErrors?.accountType && (
            <p className="text-xs text-destructive">{validationErrors.accountType}</p>
          )}
        </div>

        <AnimatePresence>
          {(showManualSelect || chatMessages.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ACCOUNT_TYPES.map(t => {
                  const isSelected = selectedAccounts.includes(t.value);
                  return (
                    <button
                      key={t.value}
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

      {/* CROSS-SELL RECOMMENDATIONS */}
      <AnimatePresence>
        {selectedAccounts.length > 0 && availableCrossSells.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Recommended add-ons</h4>
              <span className="text-[11px] text-muted-foreground">based on your selection</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableCrossSells.map(cs => {
                const isAdded = crossSellSelected.includes(cs.id);
                return (
                  <button
                    key={cs.id}
                    onClick={() => toggleCrossSell(cs.id)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                      isAdded
                        ? 'border-primary/60 bg-primary/5'
                        : 'border-border bg-card hover:border-muted-foreground/30'
                    }`}
                  >
                    <span className="text-xl shrink-0">{cs.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{cs.label}</p>
                      <p className="text-[11px] text-muted-foreground">{cs.desc}</p>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isAdded ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                    }`}>
                      {isAdded && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CART SUMMARY & SUBMIT */}
      {selectedAccounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-muted/30 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Your Selection</h4>
            <Badge variant="secondary" className="ml-auto text-[10px]">{cartCount} item{cartCount !== 1 ? 's' : ''}</Badge>
          </div>

          <div className="space-y-1.5">
            {selectedAccounts.map(acc => {
              const at = ACCOUNT_TYPES.find(t => t.value === acc);
              return (
                <div key={acc} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-card">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{at?.icon}</span>
                    <span className="text-sm font-medium text-foreground">{at?.label}</span>
                  </div>
                  <button onClick={() => toggleAccount(acc)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            {crossSellSelected.map(csId => {
              const cs = availableCrossSells.find(c => c.id === csId);
              if (!cs) return null;
              return (
                <div key={csId} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-card">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cs.icon}</span>
                    <span className="text-sm text-muted-foreground">{cs.label}</span>
                    <Badge variant="outline" className="text-[9px] h-4">Add-on</Badge>
                  </div>
                  <button onClick={() => toggleCrossSell(csId)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full touch-target gold-gradient text-accent-foreground font-semibold text-base shadow-gold hover:shadow-elevated transition-shadow"
          >
            Submit for Validation ({cartCount} item{cartCount !== 1 ? 's' : ''})
          </Button>
        </motion.div>
      )}
    </div>
  );
}