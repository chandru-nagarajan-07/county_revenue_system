import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import aidaLogo from '@/assets/aida-logo.png';

const QUICK_PROMPTS = [
  "I'd like to deposit cash",
  "Help me transfer funds", 
  "I need to update my KYC",
  "What are today's FX rates?",
];

const BOT_RESPONSES = {
  default: "I can help you with any banking service. You can ask me about deposits, withdrawals, transfers, account management, FX operations, or any other service. What would you like to do today?",
  deposit: "I'll help you with a **cash deposit**. Let me guide you through the process. I'll set up the deposit form for you — please tap the **Cash Deposit** option from the Cash Operations menu, or I can take you there directly.",
  transfer: "For a **funds transfer**, I'll need the recipient's details and the amount. Let me guide you to the transfer form. You can find it under **Payment Operations → Funds Transfer**.",
  kyc: "To **update your KYC**, we'll need your latest identification documents. This is a quick process — head to **Customer & Account → KYC Update** and I'll walk you through each step.",
  fx: "Today's indicative FX rates:\n\n| Currency | Buy | Sell |\n|----------|-----|------|\n| USD/KES | 128.50 | 131.20 |\n| EUR/KES | 140.30 | 143.80 |\n| GBP/KES | 163.40 | 167.90 |\n\n*Rates are indicative and subject to change. Would you like to proceed with an FX transaction?*",
};

function getResponse(msg) {
  const lower = msg.toLowerCase();
  if (lower.includes('deposit')) return BOT_RESPONSES.deposit;
  if (lower.includes('transfer') || lower.includes('send')) return BOT_RESPONSES.transfer;
  if (lower.includes('kyc') || lower.includes('update')) return BOT_RESPONSES.kyc;
  if (lower.includes('fx') || lower.includes('rate') || lower.includes('currency') || lower.includes('exchange')) return BOT_RESPONSES.fx;
  return BOT_RESPONSES.default;
}

function ChatPanel({ isOpen, onToggle, onServiceSelect }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: "Welcome! 👋 I'm AIDA, your AI Digital Assistant. How can I help you today? You can ask me about any banking service or use the quick options below.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getResponse(text),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  return (
    <>
      {/* Floating toggle button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={onToggle}
              className="h-16 w-16 rounded-full shadow-gold hover:shadow-elevated transition-shadow p-0 overflow-hidden bg-white/90 hover:bg-white"
              size="icon"
            >
              <img src={aidaLogo} alt="AIDA Assistant" className="h-14 w-14 object-cover" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-card border-l border-border shadow-elevated"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 navy-gradient">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-white/20">
                  <img src={aidaLogo} alt="AIDA" className="h-9 w-9 object-cover" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-primary-foreground">AIDA</h3>
                  <p className="text-xs text-primary-foreground/70">Online • Ready to help</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onToggle} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden ${
                    msg.role === 'assistant' ? 'bg-white/80' : 'navy-gradient'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <img src={aidaLogo} alt="AIDA" className="h-7 w-7 object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-primary-foreground" />
                    )}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'assistant'
                      ? 'bg-secondary text-secondary-foreground rounded-tl-sm'
                      : 'navy-gradient text-primary-foreground rounded-tr-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden bg-white/80">
                    <img src={aidaLogo} alt="AIDA" className="h-7 w-7 object-cover" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors touch-target"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border p-4">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your request..."
                  className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring touch-target"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  className="h-12 w-12 rounded-xl gold-gradient shadow-gold disabled:opacity-50"
                >
                  <Send className="h-5 w-5 text-accent-foreground" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { ChatPanel };
