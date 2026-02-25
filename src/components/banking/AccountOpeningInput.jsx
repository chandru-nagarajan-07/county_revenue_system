import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Bot, User, Loader2, AlertCircle, ShoppingCart, Plus, X, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getEligibleAccounts, ACCOUNT_TYPE_LABELS } from '@/data/demoCustomers';

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

export function AccountOpeningInput({ customer, onSubmit, validationErrors }) {
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

  // Compute cross-sell products based on selected accounts
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
    onSubmit({ accountTypes: selectedAccounts, crossSellProducts: crossSellSelected });
  };

  const cartCount = selectedAccounts.length + crossSellSelected.length;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Customer info banner */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {customer.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{customer.fullName}</p>
          <p className="text-xs text-muted-foreground">{customer.customerId} • {customer.phone}</p>
        </div>
      </div>

      {/* AI PRODUCT ADVISOR — primary hero */}
      <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col" style={{ minHeight: '320px', maxHeight: '420px' }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">AI Product Advisor</h3>
            <p className="text-[11px] text-muted-foreground">Describe your needs and I'll recommend the best accounts</p>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-6">
              <Bot className="h-8 w-8 text-primary/40" />
              <p className="text-xs text-muted-foreground max-w-[280px]">
                Tell me your financial goals — saving, business, foreign currency — and I'll suggest the right accounts.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['I want to save for school fees', 'I need a business account', 'I receive payments in USD'].map(q => (
                  <button
                    key={q}
                    onClick={() => { setChatInput(q); }}
                    className="text-xs rounded-full border border-border bg-muted/50 px-3 py-1.5 text-muted-foreground hover:bg-muted transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className={`rounded-xl px-3 py-2 max-w-[85%] text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-foreground'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {isStreaming && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="rounded-xl px-3 py-2 bg-muted/60">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          {chatError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">{chatError}</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-border p-3 flex gap-2">
          <Input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What are your banking needs?"
            disabled={isStreaming}
            className="flex-1 touch-target"
          />
          <Button size="icon" onClick={sendMessage} disabled={!chatInput.trim() || isStreaming} className="shrink-0 touch-target">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
          {validationErrors.accountType && (
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

      {/* CROSS-SELL RECOMMENDATIONS — e-commerce "You might also like" */}
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
