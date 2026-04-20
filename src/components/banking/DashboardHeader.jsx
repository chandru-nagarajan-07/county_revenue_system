import {
  Clock,
  LogOut,
  User,
  Settings,
  FileText,
  ChevronDown,
  KeyRound,
  Bell
} from "lucide-react";

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import aidaLogo from "@/assets/aida-logo.png";

export function DashboardHeader({
  customerName,
  isDropdownOpen,
  setIsDropdownOpen,
  onResetPassword,
  onLogout
}) {
  const navigate = useNavigate();

  /* ---------------- Session User ---------------- */
  const sessionUser = JSON.parse(
    sessionStorage.getItem("userData1") || "{}"
  );

  const currentUserId =
    sessionUser?.user_id ||
    sessionUser?.user_ID ||
    sessionUser?.id;

  /* ---------------- States ---------------- */
  const [time, setTime] = useState(new Date());

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loadingNotifications, setLoadingNotifications] = useState(false);

  /* ---------------- Refs for click-outside detection ---------------- */
  const notificationButtonRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const accountButtonRef = useRef(null);
  const accountDropdownRef = useRef(null);

  /* ---------------- Clock ---------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- Notification API function ---------------- */
  const fetchNotifications = async () => {
    if (!currentUserId) return;

    try {
      setLoadingNotifications(true);
      const response = await fetch(
        `http://localhost:8000/api/customer_notification/${currentUserId}/`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();

      const formattedData = data.map((item) => ({
        id: item.id,
        title: `${item.send_teller?.user} transferred service to ${item.to_teller?.user}`,
        reason: item.message,
        time: new Date(item.created_at).toLocaleString(),
        read: item.is_read || false,
        icon: <Bell className="h-3 w-3" />,
      }));

      setNotifications(formattedData);

      const unread = formattedData.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Notification Error:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  /* ---------------- Load notifications on mount (for initial badge) ---------------- */
  useEffect(() => {
    fetchNotifications();
  }, [currentUserId]);  // Re-fetch if user ID changes

  /* ---------------- Refresh notifications when dropdown opens (optional, but keeps list fresh) ---------------- */
  useEffect(() => {
    if (isNotificationOpen) {
      fetchNotifications();
    }
  }, [isNotificationOpen]);

  /* ---------------- Click-outside handler ---------------- */
  useEffect(() => {
    function handleClickOutside(event) {
      // Check if click is inside notification button or dropdown
      const isInsideNotification =
        notificationDropdownRef.current?.contains(event.target) ||
        notificationButtonRef.current?.contains(event.target);

      // Check if click is inside account button or dropdown
      const isInsideAccount =
        accountDropdownRef.current?.contains(event.target) ||
        accountButtonRef.current?.contains(event.target);

      // Close notification if click is outside its area
      if (!isInsideNotification) {
        setIsNotificationOpen(false);
      }

      // Close account dropdown if click is outside its area
      if (!isInsideAccount) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsDropdownOpen]);

  return (
    <header className="flex items-center justify-between px-8 py-5 navy-gradient">
      {/* LEFT SIDE */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden bg-white/10">
          <img src={aidaLogo} alt="AIDA" className="h-11 w-11 object-cover" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-foreground tracking-tight">
            AIDA
            <span className="text-xs align-super text-accent/80">™</span>
          </h1>
          <p className="text-sm text-primary-foreground/60">AI Digital Assistant</p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-6">
        {/* Time */}
        <div className="flex items-center gap-3 text-primary-foreground/70">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">
            {time.toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {" • "}
            {time.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Cart */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/cart")}
          className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
        >
          <FileText className="h-4 w-4 mr-2" />
          Cart
        </Button>

        {/* Admin */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin")}
          className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
        >
          <Settings className="h-4 w-4 mr-2" />
          Admin
        </Button>

        {/* ---------------- Notification ---------------- */}
        <div className="relative">
          <Button
            ref={notificationButtonRef}
            variant="ghost"
            size="sm"
            onClick={() => {
              // Close account dropdown when opening notifications
              if (!isNotificationOpen) setIsDropdownOpen(false);
              setIsNotificationOpen(!isNotificationOpen);
            }}
            className="relative text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Bell className="h-4 w-4 mr-1" />
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Button>

          <AnimatePresence>
            {isNotificationOpen && (
              <motion.div
                ref={notificationDropdownRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-96 bg-card rounded-md shadow-lg border border-border z-50 overflow-hidden"
              >
                <div className="p-2">
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-border mb-1 flex items-center gap-2">
                    <Bell className="h-3 w-3" />
                    Notifications
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="px-4 py-4 text-center text-sm">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                        No Notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-muted rounded-md transition cursor-pointer border-b"
                        >
                          <div className="mt-1 text-primary/70">{notif.icon}</div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">
                              {notif.title}
                            </p>
                            <p className="text-xs text-blue-600 mt-1 break-words">
                              Reason: {notif.reason}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1">
                              {notif.time}
                            </p>
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

        {/* ---------------- Account ---------------- */}
        <div className="relative">
          <Button
            ref={accountButtonRef}
            variant="ghost"
            onClick={() => {
              // Close notification dropdown when opening account dropdown
              if (!isDropdownOpen) setIsNotificationOpen(false);
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </Button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                ref={accountDropdownRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-56 bg-card rounded-md shadow-lg border border-border z-50 overflow-hidden"
              >
                <div className="p-2">
                  <button
                    onClick={() => {
                      navigate("/reset");
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm hover:bg-muted rounded-md"
                  >
                    <KeyRound className="mr-3 h-4 w-4" />
                    Reset Password
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-md"
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