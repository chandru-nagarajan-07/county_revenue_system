import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  User, 
  DollarSign, 
  Calendar, 
  FileText, 
  RefreshCw,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Phone,
  Hash,
  PauseCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { DashboardHeader } from '@/components/banking/DashboardHeader1';

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cartData = location.state;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serviceCart, setServiceCart] = useState(null);
  const [processingServices, setProcessingServices] = useState([]);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [updatingServiceId, setUpdatingServiceId] = useState(null);

  // API base URL
  const API_BASE_URL = 'http://localhost:8000/api';

  // Status options
  const STATUS_OPTIONS = {
    ON_HOLD: 'ON_HOLD',
    COMPLETED: 'COMPLETED',
    REJECTED: 'REJECTED'
  };

  // Function to fetch service cart from backend
  const fetchServiceCart = async (cartId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/service_cart/${cartId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data) {
        // Calculate total charge (adjust based on your actual pricing)
        const totalCharge = data.total_services * 10;
        
        setServiceCart({
          cartId: data.cart_id,
          customerName: data.customer_name,
          mobileNumber: data.mobile_number,
          totalServices: data.total_services,
          cartStatus: data.cart_status,
          services: data.services,
          charge: totalCharge.toFixed(2),
          date: new Date().toISOString().split('T')[0],
        });
        
        // Set processing services (services that are pending, on hold, or in progress)
        const processing = data.services.filter(s => 
          s.status === 'pending' || s.status === 'processing' || s.status === 'ON_HOLD'
        );
        setProcessingServices(processing);
      }
    } catch (err) {
      console.error('Error fetching service cart:', err);
      setError(err.message || 'Failed to fetch service cart details');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (cartData && cartData.cartId) {
      // If data was passed from QR scanner, use it directly
      setServiceCart(cartData);
      const processing = cartData.services.filter(s => 
        s.status === 'pending' || s.status === 'processing' || s.status === 'ON_HOLD'
      );
      setProcessingServices(processing);
    } else {
      // If no data was passed, you might want to redirect or show a message
      setError('No service cart data found. Please scan a QR code first.');
    }
  }, [cartData]);

  // Function to update service status
  const updateServiceStatus = async (serviceId, status) => {
    setUpdatingServiceId(serviceId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/service_cart_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceId,
          status: status
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Refresh the cart data to get updated statuses
      if (serviceCart && serviceCart.cartId) {
        await fetchServiceCart(serviceCart.cartId);
      }
      
      // Show success message based on status
      let message = '';
      switch(status) {
        case STATUS_OPTIONS.COMPLETED:
          message = 'Service marked as completed successfully!';
          break;
        case STATUS_OPTIONS.ON_HOLD:
          message = 'Service put on hold successfully!';
          break;
        case STATUS_OPTIONS.REJECTED:
          message = 'Service rejected successfully!';
          break;
        default:
          message = 'Service status updated successfully!';
      }
      
      alert(message);
      
    } catch (err) {
      console.error('Error updating service status:', err);
      alert(`Failed to update service status: ${err.message}`);
    } finally {
      setUpdatingServiceId(null);
    }
  };

  // Function to get service status icon
  const getServiceStatusIcon = (status) => {
    switch(status?.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'ON_HOLD':
        return <PauseCircle className="h-4 w-4 text-orange-500" />;
      case 'REJECTED':
        return <ThumbsDown className="h-4 w-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <ClipboardList className="h-4 w-4 text-gray-500" />;
    }
  };

  // Function to get service status color
  const getServiceStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'ON_HOLD':
        return 'bg-orange-100 text-orange-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get human-readable status text
  const getStatusText = (status) => {
    switch(status?.toUpperCase()) {
      case 'COMPLETED':
        return 'Completed';
      case 'ON_HOLD':
        return 'On Hold';
      case 'REJECTED':
        return 'Rejected';
      case 'PENDING':
        return 'Pending';
      case 'PROCESSING':
        return 'Processing';
      default:
        return status || 'Unknown';
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (serviceCart && serviceCart.cartId) {
      await fetchServiceCart(serviceCart.cartId);
    } else {
      alert('No cart ID available to refresh');
    }
  };

  const handleBack = () => {
    navigate('/dash');
  };

  const handleResetPassword = () => {
    setNavDropdownOpen(false);
    alert('Reset password functionality would go here.');
  };

  const handleLogout = () => {
    setNavDropdownOpen(false);
    navigate('/');
  };

  // Calculate service statistics
  const completedServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'COMPLETED').length || 0;
  const onHoldServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'ON_HOLD').length || 0;
  const rejectedServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'REJECTED').length || 0;
  const pendingServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'PENDING' || s.status?.toUpperCase() === 'PROCESSING').length || 0;
  const progressPercentage = (completedServicesCount / (serviceCart?.totalServices || 1)) * 100 || 0;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <DashboardHeader
          customerName="Teller"
          isDropdownOpen={navDropdownOpen}
          setIsDropdownOpen={setNavDropdownOpen}
          onResetPassword={handleResetPassword}
          onLogout={handleLogout}
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading service cart details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <DashboardHeader
          customerName="Teller"
          isDropdownOpen={navDropdownOpen}
          setIsDropdownOpen={setNavDropdownOpen}
          onResetPassword={handleResetPassword}
          onLogout={handleLogout}
        />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Button variant="outline" size="sm" onClick={handleBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
              <p className="text-red-600">{error}</p>
              <Button onClick={handleBack} className="mt-4">
                Go Back
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!serviceCart) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <DashboardHeader
          customerName="Teller"
          isDropdownOpen={navDropdownOpen}
          setIsDropdownOpen={setNavDropdownOpen}
          onResetPassword={handleResetPassword}
          onLogout={handleLogout}
        />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Button variant="outline" size="sm" onClick={handleBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Service Cart Data</h3>
              <p className="text-yellow-600">Please scan a QR code first to view service details.</p>
              <Button onClick={() => navigate('/qr-scanner')} className="mt-4">
                Go to Scanner
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <DashboardHeader
        customerName="Teller"
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onResetPassword={handleResetPassword}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-600" />
                    Service Cart Details
                  </h2>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Cart ID:</span>
                      <span className="text-sm font-semibold text-gray-800">{serviceCart.cartId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Customer:</span>
                      <span className="text-sm font-semibold text-gray-800">{serviceCart.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Mobile:</span>
                      <span className="text-sm font-semibold text-gray-800">{serviceCart.mobileNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="text-sm font-semibold text-gray-800">{serviceCart.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">KSh{serviceCart.charge}</div>
                  <div className="text-sm text-gray-500 mt-1">Total Charge</div>
                </div>
              </div>
            </div>

            {/* Service Progress Section */}
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700">Service Progress</h3>
                <span className="text-sm text-gray-600">
                  {completedServicesCount}/{serviceCart.totalServices} Completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div>
                  <div className="text-green-600 font-semibold">{completedServicesCount}</div>
                  <div className="text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-orange-600 font-semibold">{onHoldServicesCount}</div>
                  <div className="text-gray-600">On Hold</div>
                </div>
                <div>
                  <div className="text-red-600 font-semibold">{rejectedServicesCount}</div>
                  <div className="text-gray-600">Rejected</div>
                </div>
                <div>
                  <div className="text-yellow-600 font-semibold">{pendingServicesCount}</div>
                  <div className="text-gray-600">Pending</div>
                </div>
              </div>
            </div>

            {/* Services Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Service ID</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Service Name</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {serviceCart.services.map((service) => {
                    const currentStatus = service.status?.toUpperCase();
                    const isUpdating = updatingServiceId === service.service_id;
                    
                    return (
                      <tr key={service.service_id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-mono text-xs">{service.service_id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getServiceStatusIcon(currentStatus)}
                            <span className="font-medium">{service.service_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceStatusColor(currentStatus)}`}>
                            {getStatusText(currentStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isUpdating ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                              <span className="text-xs text-gray-500">Updating...</span>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              {currentStatus !== STATUS_OPTIONS.COMPLETED && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                  onClick={() => updateServiceStatus(service.service_id, STATUS_OPTIONS.COMPLETED)}
                                  title="Mark as Completed"
                                >
                                  <ThumbsUp className="h-4 w-4 mr-1" /> Complete
                                </Button>
                              )}
                              {currentStatus !== STATUS_OPTIONS.ON_HOLD && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                                  onClick={() => updateServiceStatus(service.service_id, STATUS_OPTIONS.ON_HOLD)}
                                  title="Put on Hold"
                                >
                                  <PauseCircle className="h-4 w-4 mr-1" /> Hold
                                </Button>
                              )}
                              {currentStatus !== STATUS_OPTIONS.REJECTED && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                  onClick={() => updateServiceStatus(service.service_id, STATUS_OPTIONS.REJECTED)}
                                  title="Reject"
                                >
                                  <ThumbsDown className="h-4 w-4 mr-1" /> Reject
                                </Button>
                              )}
                            </div>
                          )}
                          {currentStatus === STATUS_OPTIONS.COMPLETED && (
                            <div className="text-green-600 text-sm flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> Completed
                            </div>
                          )}
                          {currentStatus === STATUS_OPTIONS.ON_HOLD && (
                            <div className="text-orange-600 text-sm flex items-center gap-1">
                              <PauseCircle className="h-4 w-4" /> On Hold
                            </div>
                          )}
                          {currentStatus === STATUS_OPTIONS.REJECTED && (
                            <div className="text-red-600 text-sm flex items-center gap-1">
                              <ThumbsDown className="h-4 w-4" /> Rejected
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Section */}
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-600">Cart Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    serviceCart.cartStatus === 'FULLY_SERVED' ? 'bg-green-100 text-green-700' :
                    serviceCart.cartStatus === 'PARTIALLY_SERVED' ? 'bg-yellow-100 text-yellow-700' :
                    serviceCart.cartStatus === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {serviceCart.cartStatus || 'Active'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Total Services:</span>
                  <span className="ml-2 font-semibold text-gray-800">{serviceCart.totalServices}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;