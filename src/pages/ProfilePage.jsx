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
  History,
  Wallet,
  CreditCard,
  PlayCircle,
  Play
} from 'lucide-react';
import { DashboardHeader } from '@/components/banking/DashboardHeader1';

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cartData = location.state;
  const customer = location.state?.customer;
  const branch = customer?.teller_info;
  const sessionUser = JSON.parse(sessionStorage.getItem("customerData") || "{}");
  const tellerUser = JSON.parse(sessionStorage.getItem("userData1") || "{}");
  const accounts = sessionUser?.account || [];
  
  const accountNumber = sessionUser?.account_number || 'N/A';
  const accountType = sessionUser?.account_type || 'N/A';
  const accountBalance = sessionUser?.account_balance || '0.00';
  const accountStatus = sessionUser?.account_status || 'N/A';
  
  const branchCode = tellerUser?.teller_info || null;
  const teller_id = tellerUser?.teller_id || null;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serviceCart, setServiceCart] = useState(null);
  const [processingServices, setProcessingServices] = useState([]);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [updatingServiceId, setUpdatingServiceId] = useState(null);
  const [selectedServiceDetails, setSelectedServiceDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTransferService, setSelectedTransferService] = useState(null);
  const [tellers, setTellers] = useState([]);
  const [isLoadingTellers, setIsLoadingTellers] = useState(false);
  const [selectedTeller, setSelectedTeller] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferReason, setTransferReason] = useState('');

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const API_BASE_URL = 'http://localhost:8000/api';

  const STATUS_OPTIONS = {
    INITIATED: 'INITIATED',
    ON_HOLD: 'ON_HOLD',
    COMPLETED: 'COMPLETED',
    TO_BE_PROCESSED: 'TO_BE_PROCESSED',
    PROCESSING: 'PROCESSING',
    IN_PROGRESS: 'IN_PROGRESS',
    PENDING: 'PENDING'
  };

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
      console.log('Fetched cart data:', data);
      if (data) {
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
        
        const processing = data.services.filter(s => 
          s.status === 'PENDING' || s.status === 'IN_PROGRESS' || s.status === 'INITIATED' || s.status === 'ON_HOLD'
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
      setSelectedServiceDetails(data);
      setIsDetailsModalOpen(true);
      
    } catch (err) {
      console.error('Error fetching service cart item details:', err);
      alert(`Failed to fetch service details: ${err.message}`);
    } finally {
      setIsLoadingDetails(false);
    }
  };

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
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Tellers fetched:", data);
      
      const formattedTellers = data.map((allocation) => {
        return {
          id: allocation.teller,
          name: `Teller ${allocation.teller}`,
          email: 'Loading...',
          employee_id: allocation.teller,
          branch_id: allocation.branch,
          allocation_id: allocation.id,
          allocated_at: allocation.allocated_at
        };
      });
      
      setTellers(formattedTellers);
      
      const tellersWithDetails = await Promise.all(
        formattedTellers.map(async (teller) => {
          try {
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
      
      if (Array.isArray(data) && data.length > 0) {
        const allTransfers = data;
        const latestTransfer = data[0];
        
        setHistoryData({
          previous_teller: `${latestTransfer?.previous_teller?.name} (${latestTransfer?.previous_teller?.user_ID})`,
          new_teller: `${latestTransfer?.new_teller?.name} (${latestTransfer?.new_teller?.user_ID})`,
          remarks: latestTransfer.remarks,
          created_at: latestTransfer.created_at,
          action: latestTransfer.action,
          service: latestTransfer.service,
          id: latestTransfer.id,
          transfer_history: allTransfers
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

  const transferService = async () => {
    if (!selectedTransferService || !selectedTeller) {
      alert('Please select a teller to transfer the service');
      return;
    }
    
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
      
      if (serviceCart && serviceCart.cartId) {
        await fetchServiceCart(serviceCart.cartId);
      }
      
      alert(`Service successfully transferred to ${selectedTeller.name}`);
      
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

  const handleTransferClick = async (service) => {
    if (!branchCode) {
      alert('Branch information not available. Please refresh and try again.');
      return;
    }
    
    setSelectedTransferService(service);
    setTransferReason('');
    setIsTransferModalOpen(true);
    await fetchTellersByBranch();
  };

  const handleHistoryClick = (service) => {
    const currentStatus = service.status?.toUpperCase();
    if (currentStatus === 'TO_BE_PROCESSED') {
      fetchServiceHistory(service.service_id);
    }
  };

  const handleServiceIdClick = (serviceId) => {
    fetchServiceCartItemDetails(serviceId);
  };

  // NEW FUNCTION: Complete Service - Calls BOTH APIs
  const completeService = async (serviceId) => {
    setUpdatingServiceId(serviceId);
    
    try {
      // FIRST API CALL: Old service_cart_status endpoint with COMPLETED
      console.log('📞 Calling 1st API (OLD): /api/service_cart_status/ with COMPLETED');
      const response1 = await fetch(`${API_BASE_URL}/service_cart_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceId,
          teller_id: teller_id,
          status: 'COMPLETED'
        })
      });
      
      if (!response1.ok) {
        throw new Error(`First API failed! status: ${response1.status}`);
      }
      
      const data1 = await response1.json();
      console.log('✅ 1st API (OLD) response:', data1);
      
      // SECOND API CALL: service_initiate endpoint with COMPLETED status
      console.log('📞 Calling 2nd API: /api/service_initiate/${serviceId}/ with COMPLETED');
      const response2 = await fetch(`${API_BASE_URL}/service_initiate/${serviceId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'COMPLETED'
        })
      });
      
      if (!response2.ok) {
        throw new Error(`Second API failed! status: ${response2.status}`);
      }
      
      const data2 = await response2.json();
      console.log('✅ 2nd API response:', data2);
      
      // Refresh the cart data to get updated status
      if (serviceCart && serviceCart.cartId) {
        await fetchServiceCart(serviceCart.cartId);
      }
      
      alert('✅ Service completed successfully! (Both APIs called)');
      
    } catch (err) {
      console.error('❌ Error completing service:', err);
      alert(`Failed to complete service: ${err.message}`);
    } finally {
      setUpdatingServiceId(null);
    }
  };

  // Initiate Service - Calls ONLY the service_initiate API with INITIATED status
  const initiateService = async (serviceId) => {
    setUpdatingServiceId(serviceId);
    
    try {
      console.log('📞 Calling initiate API: /api/service_initiate/${serviceId}/ with INITIATED');
      const response = await fetch(`${API_BASE_URL}/service_initiate/${serviceId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'INITIATED'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Initiate response:', data);
      
      if (serviceCart && serviceCart.cartId) {
        await fetchServiceCart(serviceCart.cartId);
      }
      
      alert(`✅ Service initiated successfully! Status: INITIATED`);
      
    } catch (err) {
      console.error('❌ Error initiating service:', err);
      alert(`Failed to initiate service: ${err.message}`);
    } finally {
      setUpdatingServiceId(null);
    }
  };

  // Update Service Status (for HOLD and RESUME) - Uses OLD API
  const updateServiceStatus = async (serviceId, status) => {
    setUpdatingServiceId(serviceId);
    
    try {
      console.log(`📞 Calling OLD API: /api/service_cart_status/ with ${status}`);
      const response = await fetch(`${API_BASE_URL}/service_cart_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceId,
          teller_id: teller_id,
          status: status
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Status update response:', data);
      
      if (serviceCart && serviceCart.cartId) {
        await fetchServiceCart(serviceCart.cartId);
      }
      
      let message = '';
      switch(status) {
        case STATUS_OPTIONS.ON_HOLD:
          message = '✅ Service put on hold successfully!';
          break;
        case STATUS_OPTIONS.INITIATED:
          message = '✅ Service resumed from hold!';
          break;
        default:
          message = '✅ Service status updated successfully!';
      }
      
      alert(message);
      
    } catch (err) {
      console.error('❌ Error updating service status:', err);
      alert(`Failed to update service status: ${err.message}`);
    } finally {
      setUpdatingServiceId(null);
    }
  };

  const getServiceStatusIcon = (status) => {
    const upperStatus = status?.toUpperCase() || '';
    switch(upperStatus) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'ON_HOLD':
        return <PauseCircle className="h-4 w-4 text-orange-500" />;
      case 'TO_BE_PROCESSED':
        return <Send className="h-4 w-4 text-purple-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'INITIATED':
      case 'IN_PROGRESS':
      case 'PROCESSING':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <ClipboardList className="h-4 w-4 text-gray-500" />;
    }
  };

  const getServiceStatusColor = (status) => {
    const upperStatus = status?.toUpperCase() || '';
    switch(upperStatus) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'ON_HOLD':
        return 'bg-orange-100 text-orange-800';
      case 'TO_BE_PROCESSED':
        return 'bg-indigo-100 text-indigo-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'INITIATED':
      case 'IN_PROGRESS':
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    const upperStatus = status?.toUpperCase() || '';
    switch(upperStatus) {
      case 'COMPLETED':
        return 'Completed';
      case 'ON_HOLD':
        return 'On Hold';
      case 'TO_BE_PROCESSED':
        return 'To Be Processed';
      case 'PENDING':
        return 'Pending';
      case 'INITIATED':
        return 'Initiated';
      case 'IN_PROGRESS':
      case 'PROCESSING':
        return 'In Progress';
      default:
        return status || 'Unknown';
    }
  };

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

  const formatAccountType = (type) => {
    if (!type || type === 'N/A') return 'N/A';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `KSh ${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  useEffect(() => {
    if (cartData && cartData.cartId) {
      setServiceCart(cartData);
      const processing = cartData.services.filter(s => 
        s.status === 'PENDING' || s.status === 'IN_PROGRESS' || s.status === 'INITIATED' || s.status === 'ON_HOLD'
      );
      setProcessingServices(processing);
    } else {
      setError('No service cart data found. Please scan a QR code first.');
    }
  }, [cartData]);

  const completedServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'COMPLETED').length || 0;
  const onHoldServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'ON_HOLD').length || 0;
  const transferredServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'TO_BE_PROCESSED').length || 0;
  const pendingServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'PENDING').length || 0;
  const initiatedServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'INITIATED' || s.status?.toUpperCase() === 'IN_PROGRESS').length || 0;
  const progressPercentage = (completedServicesCount / (serviceCart?.totalServices || 1)) * 100 || 0;

  // History Modal Component
  const HistoryModal = () => {
    if (!isHistoryOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          
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

          <div className="p-6">
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                <p className="mt-2 text-gray-600">Loading history...</p>
              </div>
            ) : historyData ? (
              <div className="space-y-4">
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

          <div className="p-6">
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

          <div className="p-6">
            {isLoadingDetails ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                <p className="mt-2 text-gray-600">Loading details...</p>
              </div>
            ) : selectedServiceDetails ? (
              <div className="space-y-6">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-blue-50 px-4 py-2 border-b">
                    <h4 className="font-semibold text-blue-900">Cart Item Information</h4>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedServiceDetails.cart &&
                        Object.entries(selectedServiceDetails.cart).map(
                          ([key, value]) => {
                            if (
                              key === "service_data" ||
                              key === "documents" ||
                              key === "core_banking_ref" ||
                              key === "rejection_reason" ||
                              key === "customer_notified"
                            ) return null;
                            let displayValue = value;
                            if (key === "amount") {
                              displayValue = formatCurrency(value);
                            } else if (value === null || value === undefined) {
                              displayValue = "N/A";
                            } else if (typeof value === "boolean") {
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

                {selectedServiceDetails.service_data && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-green-50 px-4 py-2 border-b">
                      <h4 className="font-semibold text-green-900">Service Data Details</h4>
                    </div>
                    <div className="p-4">
                      {selectedServiceDetails.service_data.error ? (
                        <div className="text-red-600 p-2 bg-red-50 rounded">
                          Error: {selectedServiceDetails.service_data.error}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(selectedServiceDetails.service_data).map(([key, value]) => {
                            if (key === "qr_img") return null;
                            let displayValue = value;
                            if (key === "created_at") {
                              displayValue = formatDate(value);
                            } else if (key === "amount") {
                              displayValue = formatCurrency(value);
                            } else if (value === null || value === undefined) {
                              displayValue = "N/A";
                            }
                            return (
                              <div key={key} className="flex flex-col">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {key.replace(/_/g, " ")}
                                </span>
                                <span className="text-sm text-gray-900 mt-1">{displayValue}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm text-gray-600">Service Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getServiceStatusColor(selectedServiceDetails.cart?.service_status)}`}>
                        {getStatusText(selectedServiceDetails.cart?.service_status)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Service Code:</span>
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

          <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
            <Button onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
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
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-600" />
                    Service Cart Details
                  </h2>
                  
                  {accountNumber !== 'N/A' && (
                    <div className="mt-4 bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Wallet className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-800">Customer Account Details</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <CreditCard className="h-3 w-3" />
                            Account Number
                          </div>
                          <p className="text-sm font-mono font-semibold text-gray-800">{accountNumber}</p>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Account Type</div>
                          <p className="text-sm font-semibold text-gray-800">{formatAccountType(accountType)}</p>
                        </div>
                        {/* <div>
                          <div className="text-xs text-gray-500 mb-1">Account Balance</div>
                          <p className="text-sm font-bold text-green-600">{formatCurrency(accountBalance)}</p>
                        </div> */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Account Status</div>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            accountStatus === 'ACTIVE' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {accountStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-5 gap-2 text-center text-sm">
                <div>
                  <div className="text-green-600 font-semibold">{completedServicesCount}</div>
                  <div className="text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-blue-600 font-semibold">{initiatedServicesCount}</div>
                  <div className="text-gray-600">Initiated</div>
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
                    const currentStatus = service.status?.toUpperCase() || '';
                    const isUpdating = updatingServiceId === service.service_id;
                    
                    const isPending = currentStatus === 'PENDING';
                    const isInProgress = currentStatus === 'IN_PROGRESS';
                    const isInitiated = currentStatus === 'INITIATED';
                    const isOnHold = currentStatus === 'ON_HOLD';
                    const isToBeProcessed = currentStatus === 'TO_BE_PROCESSED';
                    const isCompleted = currentStatus === 'COMPLETED';
                    
                    const showInitiateButton = isPending || isInProgress;
                    const showActionButtons = isInitiated;
                    
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
                              {/* INITIATE BUTTON - calls initiateService with INITIATED */}
                              {showInitiateButton && (
                                <Button
                                  size="sm"
                                  className="bg-blue-600 text-white hover:bg-blue-700"
                                  onClick={() => initiateService(service.service_id)}
                                >
                                  <PlayCircle className="h-4 w-4 mr-1" /> Initiate
                                </Button>
                              )}
                              
                              {/* ACTION BUTTONS - for INITIATED status */}
                              {showActionButtons && (
                                <>
                                  {/* COMPLETE button - calls completeService (BOTH APIs) */}
                                  <Button
                                    size="sm"
                                    className="bg-green-600 text-white hover:bg-green-700"
                                    onClick={() => completeService(service.service_id)}
                                  >
                                    <ThumbsUp className="h-4 w-4 mr-1" /> Complete
                                  </Button>
                                  
                                  {/* HOLD button - calls updateServiceStatus with ON_HOLD */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                                    onClick={() => updateServiceStatus(service.service_id, STATUS_OPTIONS.ON_HOLD)}
                                  >
                                    <PauseCircle className="h-4 w-4 mr-1" /> Hold
                                  </Button>
                                  
                                  {/* TRANSFER button */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                    onClick={() => handleTransferClick(service)}
                                  >
                                    <Send className="h-4 w-4 mr-1" /> Transfer Desk
                                  </Button>
                                </>
                              )}
                              
                              {/* ON_HOLD buttons */}
                              {isOnHold && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                    onClick={() => updateServiceStatus(service.service_id, STATUS_OPTIONS.INITIATED)}
                                  >
                                    <Play className="h-4 w-4 mr-1" /> Resume
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                    onClick={() => handleTransferClick(service)}
                                  >
                                    <Send className="h-4 w-4 mr-1" /> Transfer Desk
                                  </Button>
                                </>
                              )}
                              
                              {/* TO_BE_PROCESSED buttons */}
                              {isToBeProcessed && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 text-white hover:bg-green-700"
                                    onClick={() => completeService(service.service_id)}
                                  >
                                    <ThumbsUp className="h-4 w-4 mr-1" /> Complete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                    onClick={() => handleTransferClick(service)}
                                  >
                                    <Send className="h-4 w-4 mr-1" /> Transfer Desk
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                    onClick={() => handleHistoryClick(service)}
                                  >
                                    <History className="h-4 w-4 mr-1" /> History
                                  </Button>
                                </>
                              )}
                              
                              {/* COMPLETED - no buttons */}
                              {isCompleted && (
                                <div className="text-green-600 text-sm flex items-center gap-1">
                                  <CheckCircle2 className="h-4 w-4" /> Completed
                                </div>
                              )}
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

      <TransferModal />
      <ServiceDetailsModal />
      <HistoryModal />
    </div>
  );
};

export default ProfilePage; 