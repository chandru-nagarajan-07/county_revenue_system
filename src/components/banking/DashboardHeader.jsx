import { Clock, LogOut, User, Settings, FileText, ChevronDown, KeyRound, Bell, MessageCircle, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import aidaLogo from '@/assets/aida-logo.png';

export function DashboardHeader({ 
  customerName, 
  isDropdownOpen, 
  setIsDropdownOpen, 
  onResetPassword, 
  onLogout 
}) {
  
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();

  // Notification state (separate from account dropdown)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3); // mock unread count
  const [notifications] = useState([
    { id: 1, title: "Your report is ready", time: "2 min ago", icon: <FileText className="h-3 w-3" />, read: false },
    { id: 2, title: "New message from support", time: "1 hour ago", icon: <MessageCircle className="h-3 w-3" />, read: false },
    { id: 3, title: "System update scheduled", time: "3 hours ago", icon: <AlertCircle className="h-3 w-3" />, read: false },
  ]);

  // Mark notifications as read when notification dropdown opens
  useEffect(() => {
    if (isNotificationOpen && unreadCount > 0) {
      setUnreadCount(0);
      // Optionally update the `read` status of each notification here
    }
  }, [isNotificationOpen, unreadCount]);

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
        <div className="flex items-center gap-3 text-primary-foreground/70">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">
            {time.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            {' • '}
            {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/cart')}
          className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
        >
          <FileText className="h-4 w-4 mr-2" />
          Cart
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

        {/* --- NOTIFICATION BELL (separate dropdown) --- */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Bell className="h-4 w-4" />Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Button>

          <AnimatePresence>
            {isNotificationOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-72 bg-card rounded-md shadow-lg border border-border z-50 overflow-hidden"
              >
                <div className="p-2">
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-border mb-1 flex items-center gap-2">
                    <Bell className="h-3 w-3" />
                    Notifications
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted rounded-md transition-colors cursor-pointer"
                          onClick={() => {
                            console.log(`Notification clicked: ${notif.title}`);
                            setIsNotificationOpen(false);
                          }}
                        >
                          <div className="mt-0.5 text-primary/70">{notif.icon}</div>
                          <div className="flex-1">
                            <p className="text-sm text-foreground">{notif.title}</p>
                            <p className="text-xs text-muted-foreground">{notif.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- ACCOUNT DROPDOWN (no notifications inside) --- */}
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
                      navigate('/reset');
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                  >
                    <KeyRound className="mr-3 h-4 w-4" />
                    Reset Password
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsDropdownOpen(false);
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