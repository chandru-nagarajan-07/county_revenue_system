import { Clock, LogOut, User, Settings, FileText, ChevronDown, KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import aidaLogo from '@/assets/aida-logo.png';

// No TypeScript interface needed for .jsx files

export function DashboardHeader({ 
  customerName, 
  isDropdownOpen, 
  setIsDropdownOpen, 
  onResetPassword, 
  onLogout 
}) {
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex items-center justify-between px-8 py-5 navy-gradient">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden bg-white/10">
          <img src={aidaLogo} alt="AIDA" className="h-11 w-11 object-cover" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-foreground tracking-tight">
            AIDA<span className="text-xs align-super text-accent/80">™</span>
          </h1>
          <p className="text-sm text-primary-foreground/60">AI Digital Assistant</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        {customerName && (
          <div className="flex items-center gap-2 text-primary-foreground/80">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">{customerName}</span>
          </div>
        )}
        
        <div className="flex items-center gap-3 text-primary-foreground/70">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">
            {time.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            {' • '}
            {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Existing Navigation Buttons */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/docs')}
          className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
        >
          <FileText className="h-4 w-4 mr-2" />
          Docs
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
        >
          <Settings className="h-4 w-4 mr-2" />
          Admin
        </Button>

        {/* New Dropdown Menu */}
        <div className="relative">
          <Button 
            variant="ghost" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </Button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-56 bg-card rounded-md shadow-lg border border-border z-50 overflow-hidden"
              >
                <div className="p-2">
                  <button
                    onClick={() => {
                      onResetPassword();
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                  >
                    <KeyRound className="mr-3 h-4 w-4" />
                    Reset Password
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    End Session
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}