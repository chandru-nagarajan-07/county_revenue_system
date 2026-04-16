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
  ThumbsDown,
  Info,
  Send,
  History
} from 'lucide-react';
import { DashboardHeader } from '@/components/banking/DashboardHeader1';

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cartData = location.state;
  const customer = location.state?.customer;
  const branch = customer?.teller_info;
  // const sessionUser = JSON.parse(sessionStorage.getItem("userData1") || "{}");
  const sessionUser = JSON.parse(sessionStorage.getItem("customerData") || "{}");
  const tellerUser = JSON.parse(sessionStorage.getItem("userData1") || "{}");
  const accounts = sessionUser?.account || [];
  console.log("ProfilePage session user:", sessionUser);
  console.log("ProfilePage teller user:", tellerUser);
  
  // Get branch code from session storage
  const branchCode = tellerUser?.teller_info || null;
  const teller_id = tellerUser?.teller_id|| null;
  console.log("Branch code from session:", branchCode);
  // Option 2: If stored separately as 'teller' in sessionStorage
  const tellerFromSession = JSON.parse(sessionStorage.getItem("teller") || "null");
  const branchCodeAlt = tellerFromSession || branchCode;
  
  console.log("Branch Code:", branchCode);
  console.log("Branch Code Alternative:", teller_id);
  
  // Use the branch code that's available
  const finalBranchCode = branchCode || branchCodeAlt;
  console.log("Final Branch Code:", finalBranchCode);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serviceCart, setServiceCart] = useState(null);
  const [processingServices, setProcessingServices] = useState([]);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [updatingServiceId, setUpdatingServiceId] = useState(null);
  const [selectedServiceDetails, setSelectedServiceDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Transfer modal states
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTransferService, setSelectedTransferService] = useState(null);
  const [tellers, setTellers] = useState([]);
  const [isLoadingTellers, setIsLoadingTellers] = useState(false);
  const [selectedTeller, setSelectedTeller] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferReason, setTransferReason] = useState('');

  // History modal states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // API base URL
  const API_BASE_URL = 'http://localhost:8000/api';

  // Status options
  const STATUS_OPTIONS = {
    ON_HOLD: 'ON_HOLD',
    COMPLETED: 'COMPLETED',
    TRANSFERRED: 'TRANSFERRED',
    TO_BE_PROCESSED: 'TO_BE_PROCESSED'
  };

  // Function to fetch service cart from backend
  const fetchServiceCart = async (cartId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/teller_service_cart/${cartId}/${teller_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(' ', data);
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

  // Function to fetch service cart item details
  const fetchServiceCartItemDetails = async (cartId) => {
    setIsLoadingDetails(true);
    setSelectedServiceDetails(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/ServiceCartItemsDetail/${cartId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Service cart item details:', data);
      // The API returns an object with 'cart' and 'service_data' fields
      setSelectedServiceDetails(data);
      setIsDetailsModalOpen(true);
      
    } catch (err) {
      console.error('Error fetching service cart item details:', err);
      alert(`Failed to fetch service details: ${err.message}`);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Function to fetch tellers of the current branch
  const fetchTellersByBranch = async () => {
    setIsLoadingTellers(true);
    setTellers([]);
    
    try {
      if (!branchCode) {
        throw new Error('Branch code not found');
      }
      
      const response = await fetch(`${API_BASE_URL}/fetch_tellers/${encodeURIComponent(branchCode)}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Tellers fetched:", data);
      
      // Transform the data - map teller IDs to user details
      // Since the API returns TellerAllocation data with teller IDs
      const formattedTellers = data.map((allocation) => {
        // You can either fetch user details here or have backend include them
        // For now, we'll use the teller ID and try to get user info from session/local storage
        return {
          id: allocation.teller,
          name: `Teller ${allocation.teller}`, // Temporary name
          email: 'Loading...',
          employee_id: allocation.teller,
          branch_id: allocation.branch,
          allocation_id: allocation.id,
          allocated_at: allocation.allocated_at
        };
      });
      
      setTellers(formattedTellers);
      
      // Fetch user details for each teller
      const tellersWithDetails = await Promise.all(
        formattedTellers.map(async (teller) => {
          try {
            // Try to get user details from your user endpoint
            const userResponse = await fetch(`${API_BASE_URL}/users/${teller.id}/`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              return {
                ...teller,
                name: userData.user?.name || userData.full_name || `Teller ${teller.id}`,
                email: userData.user?.email || 'N/A',
                employee_id: userData.user?.user_ID || userData.employee_id || teller.id,
              };
            }
          } catch (err) {
            console.error(`Error fetching user ${teller.id}:`, err);
          }
          return teller;
        })
      );
      
      setTellers(tellersWithDetails);
      
    } catch (err) {
      console.error('Error fetching tellers:', err);
      alert(`Failed to fetch tellers: ${err.message}`);
    } finally {
      setIsLoadingTellers(false);
    }
  };

  // Function to fetch service history - FIXED FOR ARRAY RESPONSE
    const fetchServiceHistory = async (serviceId) => {
      setIsLoadingHistory(true);
      setHistoryData(null);
        
      try {
        const response = await fetch(`${API_BASE_URL}/referral_history/${serviceId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Service history response:", data);
        
        // Check if data is an array and has items
        if (Array.isArray(data) && data.length > 0) {
          // Get all transfers for timeline
          const allTransfers = data;
          // Get the latest transfer (first item in array)
          const latestTransfer = data[0];
          
          setHistoryData({
            previous_teller: `${latestTransfer?.previous_teller?.name} (${latestTransfer?.previous_teller?.user_ID})`,
            new_teller: `${latestTransfer?.new_teller?.name} (${latestTransfer?.new_teller?.user_ID})`,
            remarks: latestTransfer.remarks,
            created_at: latestTransfer.created_at,
            action: latestTransfer.action,
            service: latestTransfer.service,
            id: latestTransfer.id,
            transfer_history: allTransfers // Store full array for timeline
          });
        } else {
          setHistoryData(null);
        }
        
        setIsHistoryOpen(true);
        
      } catch (err) {
        console.error('Error fetching service history:', err);
        alert(`Failed to fetch service history: ${err.message}`);
      } finally {
        setIsLoadingHistory(false);
      }
    };

  // Function to transfer service to another teller
  const transferService = async () => {
    if (!selectedTransferService || !selectedTeller) {
      alert('Please select a teller to transfer the service');
      return;
    }
    
    // Just check if reason is not empty (any length allowed, even single character)
    if (!transferReason.trim()) {
      alert('Please provide a reason for transferring the service');
      return;
    }
    
    setIsTransferring(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/service_transfer/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          service_id: selectedTransferService.service_id,
          to_teller_id: selectedTeller.id,
          teller_id: teller_id,
          transfer_reason: transferReason.trim(),
          status: 'TO_BE_PROCESSED'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Service transfer response:', data);
      
      // Update UI immediately
      setServiceCart(prev => ({
        ...prev,
        services: prev.services.map(s =>
          s.service_id === data.service.service_id
            ? { ...s, ...data.service }
            : s
        )
      }));
      
      alert(`Service successfully transferred to ${selectedTeller.name}`);
      
      // Close modal and reset states
      setIsTransferModalOpen(false);
      setSelectedTransferService(null);
      setSelectedTeller(null);
      setTellers([]);
      setTransferReason('');
      
    } catch (err) {
      console.error('Error transferring service:', err);
      alert(`Failed to transfer service: ${err.message}`);
    } finally {
      setIsTransferring(false);
    }
  };

  // Handle transfer button click
  const handleTransferClick = async (service) => {
    // Check if branch code is available
    if (!branchCode) {
      alert('Branch information not available. Please refresh and try again.');
      return;
    }
    
    setSelectedTransferService(service);
    setTransferReason(''); // Reset reason when opening modal
    setIsTransferModalOpen(true);
    await fetchTellersByBranch();
  };

  // Handle history button click - Only call if status is TO_BE_PROCESSED
  const handleHistoryClick = (service) => {
    const currentStatus = service.status?.toUpperCase();
    if (currentStatus === 'TO_BE_PROCESSED') {
      fetchServiceHistory(service.service_id);
    }
  };

  // Handle service ID click
  const handleServiceIdClick = (serviceId) => {
    fetchServiceCartItemDetails(serviceId);
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
          teller_id:teller_id,
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
        case STATUS_OPTIONS.TRANSFERRED:
          message = 'Service transferred successfully!';
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
      case 'TO_BE_PROCESSED':
        return <Send className="h-4 w-4 text-purple-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'PROCESSING':
      case 'IN_PROGRESS':
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
      case 'TRANSFERRED':
        return 'bg-purple-100 text-purple-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
      case 'TO_BE_PROCESSED':
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
      case 'TRANSFERRED':
        return 'Transferred';
      case 'PENDING':
        return 'Pending';
      case 'PROCESSING':
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'TO_BE_PROCESSED':
        return 'To Be Processed';
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
  const transferredServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'TRANSFERRED').length || 0;
  const pendingServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'PENDING' || s.status?.toUpperCase() === 'PROCESSING' || s.status?.toUpperCase() === 'IN_PROGRESS').length || 0;
  const progressPercentage = (completedServicesCount / (serviceCart?.totalServices || 1)) * 100 || 0;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `KSh ${parseFloat(amount).toFixed(2)}`;
  };

  // History Modal Component - FIXED FOR ARRAY RESPONSE
  const HistoryModal = () => {
    if (!isHistoryOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Referral History
            </h2>
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                <p className="mt-2 text-gray-600">Loading history...</p>
              </div>
            ) : historyData ? (
              <div className="space-y-4">
                {/* Latest Transfer Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Transfer Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Action:</span>
                      <span className="ml-2 font-medium">{historyData.action || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Previous Teller:</span>
                      <span className="ml-2">{historyData.previous_teller || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">New Teller:</span>
                      <span className="ml-2">{historyData.new_teller || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Remarks/Reason:</span>
                      <span className="ml-2">{historyData.remarks || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2">{formatDate(historyData.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Service ID:</span>
                      <span className="ml-2">{historyData.service || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Transfer History Timeline - Show all transfers */}
                {historyData.transfer_history && historyData.transfer_history.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-blue-50 px-4 py-2 border-b">
                      <h3 className="font-semibold text-blue-900">All Transfers</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {historyData.transfer_history.map((item, index) => (
                        <div key={item.id || index} className="border-l-2 border-blue-300 pl-4 pb-3">
                          <p className="text-sm font-semibold text-gray-800">
                            Transfer #{index + 1}
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-500">From:</span> {item.previous_teller?.name + ` (${item.previous_teller?.user_ID})` || "N/A"}
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-500">To:</span> {item.new_teller?.name + ` (${item.new_teller?.user_ID})` || "N/A"}
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-500">Reason:</span> {item.remarks || "N/A"}
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-500">Date:</span> {formatDate(item.created_at)}
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-500">Action:</span> 
                            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                              {item.action}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No history data available for this service
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
            <Button onClick={() => setIsHistoryOpen(false)}>Close</Button>
          </div>
        </div>
      </div>
    );
  };

  // Transfer Modal Component
  const TransferModal = () => {
    if (!isTransferModalOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Send className="h-5 w-5 text-purple-600" />
              Transfer Service
            </h3>
            <button
              onClick={() => {
                setIsTransferModalOpen(false);
                setSelectedTransferService(null);
                setSelectedTeller(null);
                setTellers([]);
                setTransferReason('');
              }}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Service Information */}
            {selectedTransferService && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Service to Transfer</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Service ID:</span>
                    <span className="ml-2 font-mono font-semibold">{selectedTransferService.service_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Service Name:</span>
                    <span className="ml-2 font-semibold">{selectedTransferService.service_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Status:</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getServiceStatusColor(selectedTransferService.status)}`}>
                      {getStatusText(selectedTransferService.status)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Reason Input - No minimum length restriction */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Transfer Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Please provide a reason for transferring this service..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows="3"
              />
              <p className="mt-1 text-xs text-gray-500">
                This reason will be logged for audit purposes
              </p>
            </div>

            {/* Tellers List */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Select Teller to Transfer To <span className="text-red-500">*</span>
              </h4>
              
              {isLoadingTellers ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
                  <p className="mt-2 text-gray-600">Loading tellers...</p>
                </div>
              ) : tellers.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No tellers found in your branch</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tellers.map((teller) => (
                    <div
                      key={teller.id}
                      onClick={() => setSelectedTeller(teller)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTeller?.id === teller.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold text-gray-800">{teller.name}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>Email: {teller.email || 'N/A'}</div>
                            <div>Employee ID: {teller.employee_id || 'N/A'}</div>
                          </div>
                        </div>
                        {selectedTeller?.id === teller.id && (
                          <CheckCircle className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsTransferModalOpen(false);
                setSelectedTransferService(null);
                setSelectedTeller(null);
                setTellers([]);
                setTransferReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={transferService}
              disabled={!selectedTeller || !transferReason.trim() || isTransferring}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Transferring...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Transfer Service
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Service Details Modal Component
  const ServiceDetailsModal = () => {
    if (!isDetailsModalOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Service Cart Item Details
            </h3>

            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {isLoadingDetails ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                <p className="mt-2 text-gray-600">Loading details...</p>
              </div>

            ) : selectedServiceDetails ? (

              <div className="space-y-6">

                {/* Cart Item Information */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-blue-50 px-4 py-2 border-b">
                    <h4 className="font-semibold text-blue-900">
                      Cart Item Information
                    </h4>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {selectedServiceDetails.cart &&
                        Object.entries(selectedServiceDetails.cart).map(
                          ([key, value]) => {

                            // Remove unwanted fields
                            if (
                              key === "service_data" ||
                              key === "created_at" ||
                              key === "documents" ||
                              key === "core_banking_ref" ||
                              key === "rejection_reason" ||
                              key === "customer_notified" ||
                              key === "processed_at" ||
                              key === "completed_at" ||
                              key === "teller"
                            ) return null;

                            let displayValue = value;

                            if (key === "amount") {
                              displayValue = formatCurrency(value);
                            } 
                            else if (value === null || value === undefined) {
                              displayValue = "N/A";
                            } 
                            else if (typeof value === "boolean") {
                              displayValue = value ? "Yes" : "No";
                            }

                            return (
                              <div key={key} className="flex flex-col">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {key.replace(/_/g, " ")}
                                </span>

                                <span className="text-sm text-gray-900 mt-1 font-medium">
                                  {String(displayValue)}
                                </span>
                              </div>
                            );
                          }
                        )}

                    </div>
                  </div>
                </div>

                {/* Service Data Section */}
                {selectedServiceDetails.service_data && (
                  <div className="border rounded-lg overflow-hidden">

                    <div className="bg-green-50 px-4 py-2 border-b">
                      <h4 className="font-semibold text-green-900">
                        Service Data Details
                      </h4>
                    </div>

                    <div className="p-4">

                      {selectedServiceDetails.service_data.error ? (
                        <div className="text-red-600 p-2 bg-red-50 rounded">
                          Error: {selectedServiceDetails.service_data.error}
                        </div>

                      ) : (

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                          {Object.entries(
                            selectedServiceDetails.service_data
                          ).map(([key, value]) => {

                            // Remove QR image
                            if (key === "qr_img") return null;

                            let displayValue = value;

                            if (key === "created_at") {
                              displayValue = formatDate(value);
                            } 
                            else if (key === "amount") {
                              displayValue = formatCurrency(value);
                            } 
                            else if (value === null || value === undefined) {
                              displayValue = "N/A";
                            }

                            return (
                              <div key={key} className="flex flex-col">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {key.replace(/_/g, " ")}
                                </span>

                                <span className="text-sm text-gray-900 mt-1">
                                  {displayValue}
                                </span>
                              </div>
                            );
                          })}

                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">

                    <div>
                      <span className="text-sm text-gray-600">
                        Service Status:
                      </span>

                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getServiceStatusColor(
                          selectedServiceDetails.cart?.service_status
                        )}`}
                      >
                        {getStatusText(
                          selectedServiceDetails.cart?.service_status
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-sm text-gray-600">
                        Service Code:
                      </span>

                      <span className="ml-2 font-mono text-sm font-semibold text-gray-800">
                        {selectedServiceDetails.cart?.service_code}
                      </span>
                    </div>

                  </div>
                </div>

              </div>

            ) : (

              <div className="text-center py-8 text-gray-500">
                No details available for this service
              </div>

            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
            <Button
              onClick={() => setIsDetailsModalOpen(false)}
            >
              Close
            </Button>
          </div>

        </div>
      </div>
    );
  };

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
                  <div className="text-purple-600 font-semibold">{transferredServicesCount}</div>
                  <div className="text-gray-600">Transferred</div>
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
                    const showHistoryButton = currentStatus === 'TO_BE_PROCESSED';
                    
                    return (
                      <tr key={service.service_id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleServiceIdClick(service.service_id)}
                            className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                            title="Click to view service details"
                          >
                            {service.service_id}
                          </button>
                        </td>
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
                            <div className="flex gap-2 flex-wrap">
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
                              {currentStatus !== STATUS_OPTIONS.TRANSFERRED && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                  onClick={() => handleTransferClick(service)}
                                  title="Transfer Service"
                                >
                                  <Send className="h-4 w-4 mr-1" /> Transfer Desk
                                </Button>
                              )}
                              {/* History Button - ONLY for TO_BE_PROCESSED status */}
                              {showHistoryButton && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                  onClick={() => handleHistoryClick(service)}
                                  title="View History"
                                >
                                  <History className="h-4 w-4 mr-1" /> History
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
                          {currentStatus === STATUS_OPTIONS.TO_BE_PROCESSED && (
                            <div className="text-purple-600 text-sm flex items-center gap-1">
                              <Send className="h-4 w-4" /> To Be Processed
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

      {/* Transfer Modal */}
      <TransferModal />

      {/* Service Details Modal */}
      <ServiceDetailsModal />

      {/* History Modal */}
      <HistoryModal />
    </div>
  );
};

export default ProfilePage;