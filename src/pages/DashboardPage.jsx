import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, KeyRound, Star, MessageSquare, ThumbsUp, X, Bell, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';
import ServiceCard from '@/components/banking/ServiceCard';
import { ChatPanel } from '@/components/banking/ChatPanel';
import { CrossSellCard } from '@/components/banking/CrossSellCard';

// Feedback Modal Component (Full Screen Popup)
const FeedbackModal = ({ service, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [speed, setSpeed] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!service) return null;

  const speedOptions = [
    { value: 'fast', label: '⚡ Fast', color: 'text-green-600' },
    { value: 'medium', label: '⏱️ Medium', color: 'text-yellow-600' },
    { value: 'slow', label: '🐢 Slow', color: 'text-red-600' },
  ];

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!speed) {
      alert('Please select teller speed');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        service_id: service.id || service.service_request_id,
        rating,
        comment,
        teller_speed: speed,
        user_id: service.user_id,
      });
      onClose(true);
    } catch (err) {
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-yellow-600" />
            Service Feedback
          </h2>
          <button onClick={() => onClose(false)} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          {service && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Service:</p>
              <p className="font-semibold text-gray-800">{service.service_name || service.title || 'N/A'}</p>
              <p className="text-xs text-gray-500 mt-1">Service Code: {service.service_code || service.code || 'N/A'}</p>
            </div>
          )}

          {/* Rating Stars */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      (hoverRating || rating) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {rating === 1 && 'Very Poor'}
              {rating === 2 && 'Poor'}
              {rating === 3 && 'Average'}
              {rating === 4 && 'Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Teller Speed */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teller Speed <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {speedOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSpeed(option.value)}
                  className={`w-full text-left px-4 py-2 rounded-lg border transition-all ${
                    speed === option.value
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-300 hover:border-yellow-300'
                  }`}
                >
                  <span className={option.color}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this service..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onClose(false)}>
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0 || !speed}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Small Notification Badge Component (Bottom Left Corner)
const FeedbackNotification = ({ count, onOpen }) => {
  if (count === 0) return null;

  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="fixed bottom-6 left-6 z-40"
    >
      <button
        onClick={onOpen}
        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
      >
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="relative">
            <Bell className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {count}
              </span>
            )}
          </div>
          <span className="text-sm font-medium">
            {count} Service{count > 1 ? 's' : ''} Complete
          </span>
          <Gift className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>
    </motion.div>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = location.state?.customer;
  console.log("Customer data in DashboardPage:", customer?.user_id);

  // --- State Management ---
  const [serviceCategories, setServiceCategories] = useState({});
  const [allServices, setAllServices] = useState([]);
  const [categoryViewServices, setCategoryViewServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  // Password Reset State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Feedback Popup State
  const [showFullFeedbackModal, setShowFullFeedbackModal] = useState(false);
  const [pendingFeedbackService, setPendingFeedbackService] = useState(null);
  const [completedServices, setCompletedServices] = useState([]);
  const [processedServiceIds, setProcessedServiceIds] = useState(new Set());
  const [showNotification, setShowNotification] = useState(false);

  // --- Computed Values ---
  const displayedCategoryServices = useMemo(() => {
    return categoryViewServices;
  }, [categoryViewServices]);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return allServices.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  }, [searchQuery, allServices]);

  const unprocessedCount = completedServices.length;

  // --- Fetch Completed Services ---
  const fetchCompletedServices = async () => {
    if (!customer?.user_id) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/customer_service_cart_list_queue/${customer.user_id}/`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      // Extract all completed services from all carts
      const allCompletedServices = [];
      data.forEach(cart => {
        if (cart.services && Array.isArray(cart.services)) {
          cart.services.forEach(service => {
            if (service.service_status?.toUpperCase() === 'COMPLETED') {
              // Check if we haven't shown feedback for this service yet
              if (!processedServiceIds.has(service.service_request_id)) {
                allCompletedServices.push({
                  id: service.id,
                  service_request_id: service.service_request_id,
                  service_name: service.service_name,
                  service_code: service.service_code,
                  user_id: customer.user_id,
                  cart_id: cart.cart_id,
                });
              }
            }
          });
        }
      });
      
      if (allCompletedServices.length > 0) {
        setCompletedServices(allCompletedServices);
        setShowNotification(true);
        
        // Auto-show notification badge, but don't auto-open modal
        // User needs to click the badge to open feedback
      }
    } catch (error) {
      console.error('Error fetching completed services:', error);
    }
  };

  // Check for completed services periodically
  useEffect(() => {
    if (customer?.user_id) {
      fetchCompletedServices();
      const interval = setInterval(fetchCompletedServices, 30000);
      return () => clearInterval(interval);
    }
  }, [customer?.user_id]);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/view_api_service_groups1/");
        if (!response.ok) throw new Error("Server error");

        const data = await response.json();
        const categoriesObj = {};
        const globalServicesArr = [];

        data.forEach(category => {
          categoriesObj[category.key] = {
            label: category.label,
            description: category.description,
            icon: category.icon || "LayoutGrid",
            color: category.color || "blue",
          };

          if (Array.isArray(category.services)) {
            category.services.forEach(service => {
              globalServicesArr.push({
                id: service.service_id,
                title: service.title,
                description: service.description,
                category: category.key,
                icon: service.icon || "Circle",
                service_fee: service.service_fee || "0.00"
              });
            });
          }
        });

        setServiceCategories(categoriesObj);
        setAllServices(globalServicesArr);
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Open Category: Fetch detailed services for that specific group
  const openCategory = async (catKey) => {
    try {
      setLoading(true);
      setSelectedCategory(catKey);

      const response = await fetch(
        `http://127.0.0.1:8000/view_api_service_types_by_group/${catKey}/`
      );

      if (!response.ok) throw new Error("Failed to fetch service types");

      const data = await response.json();

      const servicesArr = data.map(service => ({
        id: service.id,
        code: service.code,
        title: service.name || service.title,
        description: service.description,
        category: catKey,
        icon: service.icon || "Circle",
        service_fee: service.service_fee || "0.00",
      }));

      setCategoryViewServices(servicesArr);
      setView('category');
      setSearchQuery('');
    } catch (error) {
      console.error("Error loading service types:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Navigation Handlers ---
  const openService = (service) => {
    navigate('/transaction', { state: { service, customer } });
  };

  const goHome = () => {
    setView('dashboard');
    setSelectedCategory(null);
    setCategoryViewServices([]);
    setSearchQuery('');
  };

  const goBack = () => {
    if (view === 'reset-password') {
      setView('dashboard');
    } else {
      goHome();
    }
  };

  const handleLogout = () => {
    setNavDropdownOpen(false);
    navigate('/');
  };

  const handleResetPassword = () => {
    setNavDropdownOpen(false);
    setView('reset-password');
  };

  const handlePasswordUpdate = () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    alert('Password updated successfully!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setView('dashboard');
  };

  // --- Feedback Handlers ---
  const submitFeedback = async (feedbackData) => {
    const response = await fetch('http://127.0.0.1:8000/api/service_feedback/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData),
    });
    if (!response.ok) throw new Error('Failed to submit feedback');
    alert('Thank you for your feedback!');
  };

  const handleOpenNotification = () => {
    if (completedServices.length > 0) {
      setPendingFeedbackService(completedServices[0]);
      setShowFullFeedbackModal(true);
      setShowNotification(false);
    }
  };

  const handleFeedbackClose = (feedbackSubmitted) => {
    setShowFullFeedbackModal(false);
    
    // Mark current service as processed
    if (pendingFeedbackService) {
      setProcessedServiceIds(prev => new Set([...prev, pendingFeedbackService.service_request_id]));
    }
    
    // Remove the processed service from completedServices
    const remainingServices = completedServices.filter(
      s => s.service_request_id !== pendingFeedbackService?.service_request_id
    );
    setCompletedServices(remainingServices);
    
    // If there are more completed services, show notification again
    if (remainingServices.length > 0) {
      setShowNotification(true);
    }
    
    setPendingFeedbackService(null);
  };

  if (loading && view === 'dashboard' && Object.keys(serviceCategories).length === 0) {
    return <div className="flex h-screen items-center justify-center">Loading services...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <DashboardHeader
        customerName={customer?.fullName || "Customer"}
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onResetPassword={handleResetPassword}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {/* --- 1. RESET PASSWORD VIEW --- */}
          {view === 'reset-password' && (
            <motion.div 
              key="reset-password" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="h-full overflow-y-auto p-4 md:p-8"
            >
              <div className="max-w-md mx-auto">
                <Button variant="outline" size="sm" onClick={goBack} className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                </Button>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center gap-2 mb-4">
                    <KeyRound className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold">Reset Password</h2>
                  </div>
                  <div className="space-y-4">
                    <input 
                      type="password" 
                      placeholder="Old Password" 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full border rounded-md p-2"
                    />
                    <input 
                      type="password" 
                      placeholder="New Password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border rounded-md p-2"
                    />
                    <input 
                      type="password" 
                      placeholder="Confirm Password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border rounded-md p-2"
                    />
                    <Button className="w-full" onClick={handlePasswordUpdate}>Update Password</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- 2. CATEGORY VIEW --- */}
          {view === 'category' && selectedCategory && serviceCategories[selectedCategory] && (
            <motion.div 
              key="category" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="h-full overflow-y-auto p-4 md:p-8"
            >
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                  <Button variant="outline" size="icon" onClick={goBack} className="shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-slate-800">
                      {serviceCategories[selectedCategory].label}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {serviceCategories[selectedCategory].description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="hidden lg:block w-80 shrink-0">
                    <div className="sticky top-8">
                      <CrossSellCard customer={customer} category={selectedCategory} />
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    {displayedCategoryServices.map((service, i) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <ServiceCard
                          icon={service.icon}
                          title={service.title}
                          description={service.description}
                          onClick={() => openService(service)}
                        />
                      </motion.div>
                    ))}
                    
                    {displayedCategoryServices.length === 0 && !loading && (
                      <div className="text-center py-12 text-slate-400">
                        No services found in this category.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- 3. DASHBOARD VIEW (Default) --- */}
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="h-full overflow-y-auto p-4 md:p-8"
            >
              <div className="max-w-6xl mx-auto">
                <div className="relative max-w-xl mb-10">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for services..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                {filteredServices ? (
                  <div>
                    <h2 className="font-display text-lg font-semibold text-slate-500 mb-4">
                      {filteredServices.length} Results Found
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredServices.map((service, i) => (
                        <motion.div 
                          key={service.id} 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          transition={{ delay: i * 0.05 }}
                        >
                          <ServiceCard
                            icon={service.icon}
                            title={service.title}
                            description={service.description}
                            onClick={() => openService(service)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-xl font-semibold text-slate-700 mb-5">
                      Services
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {Object.entries(serviceCategories).map(([key, cat], i) => (
                        <motion.div 
                          key={key} 
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: i * 0.08 }}
                        >
                          <ServiceCard
                            variant="category"
                            icon={cat.icon}
                            title={cat.label}
                            description={cat.description}
                            onClick={() => openCategory(key)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ChatPanel isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />

      {/* Small Notification Badge - Bottom Left Corner */}
      <AnimatePresence>
        {showNotification && unprocessedCount > 0 && (
          <FeedbackNotification 
            count={unprocessedCount} 
            onOpen={handleOpenNotification} 
          />
        )}
      </AnimatePresence>

      {/* Full Feedback Modal - Only shows when clicking the badge */}
      <AnimatePresence>
        {showFullFeedbackModal && pendingFeedbackService && (
          <FeedbackModal
            service={pendingFeedbackService}
            onClose={handleFeedbackClose}
            onSubmit={submitFeedback}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;