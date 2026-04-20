  import { useState, useEffect, memo } from 'react';
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

  // ---------- Modal Components (memoized, fully functional) ----------
  const TransferModal = memo(({ isOpen, onClose, service, tellers, isLoadingTellers, onTransfer, isTransferring }) => {
    const [selectedTeller, setSelectedTeller] = useState(null);
    const [reason, setReason] = useState('');

    useEffect(() => {
      if (!isOpen) {
        setSelectedTeller(null);
        setReason('');
      }
    }, [isOpen]);

    if (!isOpen) return null;

    const getStatusColor = (status) => {
      switch(status?.toUpperCase()) {
        case 'COMPLETED': return 'bg-green-100 text-green-800';
        case 'ON_HOLD': return 'bg-orange-100 text-orange-800';
        case 'TO_BE_PROCESSED': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
    const getStatusText = (status) => status ? status.replace(/_/g, ' ') : 'Unknown';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Send className="h-5 w-5 text-purple-600" />
              Transfer Service
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          <div className="p-6">
            {service && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Service to Transfer</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Service ID:</span> <span className="ml-2 font-mono font-semibold">{service.service_id}</span></div>
                  <div><span className="text-gray-500">Service Name:</span> <span className="ml-2 font-semibold">{service.service_name}</span></div>
                  <div><span className="text-gray-500">Current Status:</span> <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>{getStatusText(service.status)}</span></div>
                </div>
              </div>
            )}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Transfer Reason <span className="text-red-500">*</span></label>
              <textarea 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                placeholder="Please provide a detailed reason for transferring this service..." 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none" 
                rows="3"
              />
              <p className="mt-1 text-xs text-gray-500">This reason will be logged for audit purposes</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><User className="h-4 w-4" /> Select Teller <span className="text-red-500">*</span></h4>
              {isLoadingTellers ? (
                <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" /><p>Loading tellers...</p></div>
              ) : tellers.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg"><AlertCircle className="h-12 w-12 text-gray-400 mx-auto" /><p>No tellers found</p></div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tellers.map((teller) => (
                    <div key={teller.id} onClick={() => setSelectedTeller(teller)} className={`p-4 border rounded-lg cursor-pointer ${selectedTeller?.id === teller.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <div><div className="font-semibold">{teller.name}</div><div className="text-sm text-gray-600">Email: {teller.email || 'N/A'} | ID: {teller.employee_id}</div></div>
                        {selectedTeller?.id === teller.id && <CheckCircle className="h-5 w-5 text-purple-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onTransfer(service, selectedTeller, reason)} disabled={!selectedTeller || !reason.trim() || isTransferring} className="bg-purple-600 hover:bg-purple-700">
              {isTransferring ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Transferring...</> : <><Send className="h-4 w-4 mr-2" /> Transfer Service</>}
            </Button>
          </div>
        </div>
      </div>
    );
  });

  const HoldModal = memo(({ isOpen, onClose, service, onConfirmHold, isHolding }) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
      if (!isOpen) setReason('');
    }, [isOpen]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="border-b px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><PauseCircle className="h-5 w-5 text-orange-600" /> Hold Service</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><XCircle className="h-6 w-6" /></button>
          </div>
          <div className="p-6">
            {service && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Service ID: <span className="font-mono font-semibold">{service.service_id}</span></p>
                <p className="text-sm text-gray-600 mt-1">Service Name: <span className="font-medium">{service.service_name}</span></p>
              </div>
            )}
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hold Reason <span className="text-red-500">*</span></label>
            <textarea 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              placeholder="Why is this service being put on hold?" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none" 
              rows="3"
            />
            <p className="mt-1 text-xs text-gray-500">This reason will be recorded for tracking purposes</p>
          </div>
          <div className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onConfirmHold(service, reason)} disabled={!reason.trim() || isHolding} className="bg-orange-600 hover:bg-orange-700">
              {isHolding ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Holding...</> : <>Confirm Hold</>}
            </Button>
          </div>
        </div>
      </div>
    );
  });

  const ServiceDetailsModal = memo(({ isOpen, onClose, details, isLoading, formatCurrency, formatDate, getServiceStatusColor, getStatusText }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><Info className="h-5 w-5 text-blue-600" /> Service Cart Item Details</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><XCircle className="h-6 w-6" /></button>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" /><p>Loading details...</p></div>
            ) : details ? (
              <div className="space-y-6">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-blue-50 px-4 py-2 border-b"><h4 className="font-semibold text-blue-900">Cart Item Information</h4></div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {details.cart && Object.entries(details.cart).map(([key, value]) => {
                      if (['service_data','created_at','documents','core_banking_ref','rejection_reason','customer_notified','processed_at','completed_at','teller'].includes(key)) return null;
                      let display = value;
                      if (key === 'amount') display = formatCurrency(value);
                      else if (value === null || value === undefined) display = 'N/A';
                      else if (typeof value === 'boolean') display = value ? 'Yes' : 'No';
                      return (
                        <div key={key}>
                          <span className="text-xs font-medium text-gray-500 uppercase">{key.replace(/_/g, ' ')}</span>
                          <div className="text-sm text-gray-900 mt-1 font-medium">{String(display)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {details.service_data && !details.service_data.error && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-green-50 px-4 py-2 border-b"><h4 className="font-semibold text-green-900">Service Data Details</h4></div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(details.service_data).map(([key, value]) => {
                        if (key === 'qr_img') return null;
                        let display = value;
                        if (key === 'created_at') display = formatDate(value);
                        else if (key === 'amount') display = formatCurrency(value);
                        else if (value === null || value === undefined) display = 'N/A';
                        return (
                          <div key={key}>
                            <span className="text-xs font-medium text-gray-500 uppercase">{key.replace(/_/g, ' ')}</span>
                            <div className="text-sm text-gray-900 mt-1">{String(display)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                  <div><span className="text-sm text-gray-600">Service Status:</span> <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getServiceStatusColor(details.cart?.service_status)}`}>{getStatusText(details.cart?.service_status)}</span></div>
                  <div><span className="text-sm text-gray-600">Service Code:</span> <span className="ml-2 font-mono text-sm font-semibold">{details.cart?.service_code}</span></div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No details available</div>
            )}
          </div>
          <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  });

  const HistoryModal = memo(({ isOpen, onClose, history, isLoading, formatDate }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><History className="h-5 w-5 text-blue-600" /> Referral History</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><XCircle className="h-6 w-6" /></button>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" /><p>Loading history...</p></div>
            ) : history ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Transfer Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Action:</span> <span className="ml-2 font-medium">{history.action || "N/A"}</span></div>
                    <div><span className="text-gray-500">Previous Teller:</span> <span className="ml-2">{history.previous_teller || "N/A"}</span></div>
                    <div><span className="text-gray-500">New Teller:</span> <span className="ml-2">{history.new_teller || "N/A"}</span></div>
                    <div><span className="text-gray-500">Remarks:</span> <span className="ml-2">{history.remarks || "N/A"}</span></div>
                    <div><span className="text-gray-500">Date:</span> <span className="ml-2">{formatDate(history.created_at)}</span></div>
                    <div><span className="text-gray-500">Service ID:</span> <span className="ml-2">{history.service || "N/A"}</span></div>
                  </div>
                </div>
                {history.transfer_history && history.transfer_history.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-blue-50 px-4 py-2 border-b"><h3 className="font-semibold text-blue-900">All Transfers</h3></div>
                    <div className="p-4 space-y-4">
                      {history.transfer_history.map((item, idx) => (
                        <div key={item.id || idx} className="border-l-2 border-blue-300 pl-4 pb-3">
                          <p className="text-sm font-semibold">Transfer #{idx+1}</p>
                          <p><span className="text-gray-500">From:</span> {item.previous_teller?.name + ` (${item.previous_teller?.user_ID})` || "N/A"}</p>
                          <p><span className="text-gray-500">To:</span> {item.new_teller?.name + ` (${item.new_teller?.user_ID})` || "N/A"}</p>
                          <p><span className="text-gray-500">Reason:</span> {item.remarks || "N/A"}</p>
                          <p><span className="text-gray-500">Date:</span> {formatDate(item.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No history data available</div>
            )}
          </div>
          <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  });

  // ---------- Main ProfilePage Component ----------
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
    const tellerFromSession = JSON.parse(sessionStorage.getItem("teller") || "null");
    const finalBranchCode = branchCode || tellerFromSession;
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [serviceCart, setServiceCart] = useState(null);
    const [processingServices, setProcessingServices] = useState([]);
    const [navDropdownOpen, setNavDropdownOpen] = useState(false);
    const [updatingServiceId, setUpdatingServiceId] = useState(null);
    const [selectedServiceDetails, setSelectedServiceDetails] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    
    // Transfer modal
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [selectedTransferService, setSelectedTransferService] = useState(null);
    const [tellers, setTellers] = useState([]);
    const [isLoadingTellers, setIsLoadingTellers] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    
    // Hold modal
    const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
    const [selectedHoldService, setSelectedHoldService] = useState(null);
    const [isHolding, setIsHolding] = useState(false);
    
    // History modal
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
    
    // Helper functions
    const formatCurrency = (amount) => amount ? `KSh ${parseFloat(amount).toLocaleString()}` : 'N/A';
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString() : 'N/A';
    const formatAccountType = (type) => (type && type !== 'N/A') ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : 'N/A';
    const getServiceStatusColor = (status) => {
      switch(status?.toUpperCase()) {
        case 'COMPLETED': return 'bg-green-100 text-green-800';
        case 'ON_HOLD': return 'bg-orange-100 text-orange-800';
        case 'TO_BE_PROCESSED': return 'bg-purple-100 text-purple-800';
        case 'INITIATED':
        case 'IN_PROGRESS':
        case 'PROCESSING': return 'bg-blue-100 text-blue-800';
        case 'PENDING': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
    const getStatusText = (status) => {
      switch(status?.toUpperCase()) {
        case 'COMPLETED': return 'Completed';
        case 'ON_HOLD': return 'On Hold';
        case 'TO_BE_PROCESSED': return 'To Be Processed';
        case 'INITIATED': return 'Initiated';
        case 'IN_PROGRESS':
        case 'PROCESSING': return 'In Progress';
        case 'PENDING': return 'Pending';
        default: return status || 'Unknown';
      }
    };
    const getServiceStatusIcon = (status) => {
      switch(status?.toUpperCase()) {
        case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        case 'ON_HOLD': return <PauseCircle className="h-4 w-4 text-orange-500" />;
        case 'TO_BE_PROCESSED': return <Send className="h-4 w-4 text-purple-500" />;
        case 'INITIATED':
        case 'IN_PROGRESS':
        case 'PROCESSING': return <PlayCircle className="h-4 w-4 text-blue-500" />;
        case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />;
        default: return <ClipboardList className="h-4 w-4 text-gray-500" />;
      }
    };
    
    // Fetch service cart
    const fetchServiceCart = async (cartId) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/teller_service_cart/${cartId}/${teller_id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
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
          const processing = data.services.filter(s => s.status === 'PENDING' || s.status === 'PROCESSING' || s.status === 'ON_HOLD');
          setProcessingServices(processing);
        }
      } catch (err) {
        console.error('Error fetching service cart:', err);
        setError(err.message || 'Failed to fetch service cart details');
      } finally {
        setIsLoading(false);
      }
    };
    
    // NEW: Initiate Service (calls service_initiate API with INITIATED)
    const initiateService = async (serviceId) => {
      setUpdatingServiceId(serviceId);
      try {
        const response = await fetch(`${API_BASE_URL}/service_initiate/${serviceId}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'INITIATED' })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('Initiate response:', data);
        if (serviceCart?.cartId) await fetchServiceCart(serviceCart.cartId);
        alert('Service initiated successfully!');
      } catch (err) {
        console.error('Error initiating service:', err);
        alert(`Failed to initiate service: ${err.message}`);
      } finally {
        setUpdatingServiceId(null);
      }
    };
    
    // Complete Service (calls both APIs: service_cart_status and service_initiate)
    const completeService = async (serviceId) => {
      setUpdatingServiceId(serviceId);
      try {
        // First API: old service_cart_status
        const response1 = await fetch(`${API_BASE_URL}/service_cart_status/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service_id: serviceId, teller_id: teller_id, status: 'COMPLETED' })
        });
        if (!response1.ok) throw new Error(`First API failed: ${response1.status}`);
        // Second API: service_initiate with COMPLETED
        const response2 = await fetch(`${API_BASE_URL}/service_initiate/${serviceId}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COMPLETED' })
        });
        if (!response2.ok) throw new Error(`Second API failed: ${response2.status}`);
        if (serviceCart?.cartId) await fetchServiceCart(serviceCart.cartId);
        alert('Service completed successfully!');
      } catch (err) {
        console.error('Error completing service:', err);
        alert(`Failed to complete service: ${err.message}`);
      } finally {
        setUpdatingServiceId(null);
      }
    };
    
    // Update service status (for HOLD and RESUME) - uses old API
    const updateServiceStatus = async (serviceId, status, reason = null) => {
      setUpdatingServiceId(serviceId);
      try {
        const body = { service_id: serviceId, teller_id: teller_id, status: status };
        if (status === STATUS_OPTIONS.ON_HOLD && reason) body.hold_reason = reason;
        
        const response = await fetch(`${API_BASE_URL}/service_cart_status/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        await response.json();
        if (serviceCart?.cartId) await fetchServiceCart(serviceCart.cartId);
        alert(status === STATUS_OPTIONS.ON_HOLD ? 'Service put on hold!' : status === STATUS_OPTIONS.INITIATED ? 'Service resumed!' : 'Status updated!');
      } catch (err) {
        console.error('Error updating service status:', err);
        alert(`Failed to update status: ${err.message}`);
      } finally {
        setUpdatingServiceId(null);
      }
    };
    
    // Fetch service cart item details
    const fetchServiceCartItemDetails = async (cartId) => {
      setIsLoadingDetails(true);
      setSelectedServiceDetails(null);
      try {
        const response = await fetch(`${API_BASE_URL}/ServiceCartItemsDetail/${cartId}/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setSelectedServiceDetails(data);
        setIsDetailsModalOpen(true);
      } catch (err) {
        console.error('Error fetching details:', err);
        alert(`Failed to fetch service details: ${err.message}`);
      } finally {
        setIsLoadingDetails(false);
      }
    };
    
    // Fetch tellers using finalBranchCode
    const fetchTellersByBranch = async () => {
      if (!finalBranchCode) {
        alert('Branch code not found');
        return;
      }
      setIsLoadingTellers(true);
      setTellers([]);
      try {
        const response = await fetch(`${API_BASE_URL}/fetch_tellers/${encodeURIComponent(finalBranchCode)}/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const formattedTellers = data.map((allocation) => ({
          id: allocation.teller,
          name: `Teller ${allocation.teller}`,
          email: 'Loading...',
          employee_id: allocation.teller,
          branch_id: allocation.branch,
        }));
        const tellersWithDetails = await Promise.all(formattedTellers.map(async (teller) => {
          try {
            const userResponse = await fetch(`${API_BASE_URL}/users/${teller.id}/`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              return { ...teller, name: userData.user?.name || userData.full_name || `Teller ${teller.id}`, email: userData.user?.email || 'N/A', employee_id: userData.user?.user_ID || userData.employee_id || teller.id };
            }
          } catch (err) { console.error(err); }
          return teller;
        }));
        setTellers(tellersWithDetails);
      } catch (err) {
        console.error('Error fetching tellers:', err);
        alert(`Failed to fetch tellers: ${err.message}`);
      } finally {
        setIsLoadingTellers(false);
      }
    };
    
    // Transfer service handler
    const handleTransfer = async (service, selectedTeller, reason) => {
      if (!selectedTeller || !reason.trim()) return;
      setIsTransferring(true);
      try {
        const response = await fetch(`${API_BASE_URL}/service_transfer/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: service.service_id,
            to_teller_id: selectedTeller.id,
            teller_id: teller_id,
            transfer_reason: reason.trim(),
            status: 'TO_BE_PROCESSED'
          })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setServiceCart(prev => ({
          ...prev,
          services: prev.services.map(s => s.service_id === data.service.service_id ? { ...s, ...data.service } : s)
        }));
        alert(`Service successfully transferred to ${selectedTeller.name}`);
        setIsTransferModalOpen(false);
        setSelectedTransferService(null);
        setTellers([]);
      } catch (err) {
        console.error('Error transferring service:', err);
        alert(`Failed to transfer service: ${err.message}`);
      } finally {
        setIsTransferring(false);
      }
    };
    
    // Hold handler
    const handleHold = async (service, reason) => {
      if (!reason.trim()) return;
      setIsHolding(true);
      await updateServiceStatus(service.service_id, STATUS_OPTIONS.ON_HOLD, reason.trim());
      setIsHoldModalOpen(false);
      setSelectedHoldService(null);
      setIsHolding(false);
    };
    
    // Resume from hold
    const handleResume = async (serviceId) => {
      await updateServiceStatus(serviceId, STATUS_OPTIONS.INITIATED);
    };
    
    // Fetch service history
    const fetchServiceHistory = async (serviceId) => {
      setIsLoadingHistory(true);
      setHistoryData(null);
      try {
        const response = await fetch(`${API_BASE_URL}/referral_history/${serviceId}/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const latestTransfer = data[0];
          setHistoryData({
            previous_teller: `${latestTransfer?.previous_teller?.name} (${latestTransfer?.previous_teller?.user_ID})`,
            new_teller: `${latestTransfer?.new_teller?.name} (${latestTransfer?.new_teller?.user_ID})`,
            remarks: latestTransfer.remarks,
            created_at: latestTransfer.created_at,
            action: latestTransfer.action,
            service: latestTransfer.service,
            id: latestTransfer.id,
            transfer_history: data
          });
        } else setHistoryData(null);
        setIsHistoryOpen(true);
      } catch (err) {
        console.error('Error fetching history:', err);
        alert(`Failed to fetch history: ${err.message}`);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    // Handlers for buttons
    const handleTransferClick = async (service) => {
      if (!finalBranchCode) { alert('Branch information not available.'); return; }
      setSelectedTransferService(service);
      setIsTransferModalOpen(true);
      await fetchTellersByBranch();
    };
    const handleHoldClick = (service) => {
      setSelectedHoldService(service);
      setIsHoldModalOpen(true);
    };
    const handleHistoryClick = (service) => {
      if (service.status?.toUpperCase() === 'TO_BE_PROCESSED') fetchServiceHistory(service.service_id);
    };
    const handleServiceIdClick = (serviceId) => fetchServiceCartItemDetails(serviceId);
    const handleRefresh = async () => { if (serviceCart?.cartId) await fetchServiceCart(serviceCart.cartId); else alert('No cart ID'); };
    const handleBack = () => navigate('/dash');
    const handleResetPassword = () => { setNavDropdownOpen(false); alert('Reset password functionality would go here.'); };
    const handleLogout = () => { setNavDropdownOpen(false); navigate('/'); };
    
    // Load data on mount
    useEffect(() => {
      if (cartData && cartData.cartId) {
        setServiceCart(cartData);
        const processing = cartData.services.filter(s => s.status === 'PENDING' || s.status === 'PROCESSING' || s.status === 'ON_HOLD');
        setProcessingServices(processing);
      } else {
        setError('No service cart data found. Please scan a QR code first.');
      }
    }, [cartData]);
    
    // Statistics
    const completedServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'COMPLETED').length || 0;
    const onHoldServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'ON_HOLD').length || 0;
    const transferredServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'TO_BE_PROCESSED').length || 0;
    const pendingServicesCount = serviceCart?.services?.filter(s => ['PENDING','PROCESSING','IN_PROGRESS'].includes(s.status?.toUpperCase()))?.length || 0;
    const progressPercentage = (completedServicesCount / (serviceCart?.totalServices || 1)) * 100;
    
    // Loading / error / empty states
    if (isLoading) {
      return (
        <div className="flex flex-col min-h-screen bg-slate-50">
          <DashboardHeader customerName="Teller" isDropdownOpen={navDropdownOpen} setIsDropdownOpen={setNavDropdownOpen} onResetPassword={handleResetPassword} onLogout={handleLogout} />
          <main className="flex-1 flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></main>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col min-h-screen bg-slate-50">
          <DashboardHeader customerName="Teller" isDropdownOpen={navDropdownOpen} setIsDropdownOpen={setNavDropdownOpen} onResetPassword={handleResetPassword} onLogout={handleLogout} />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
              <Button variant="outline" size="sm" onClick={handleBack} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"><AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" /><h3 className="text-lg font-semibold text-red-800">Error</h3><p className="text-red-600">{error}</p><Button onClick={handleBack} className="mt-4">Go Back</Button></div>
            </div>
          </main>
        </div>
      );
    }
    if (!serviceCart) {
      return (
        <div className="flex flex-col min-h-screen bg-slate-50">
          <DashboardHeader customerName="Teller" isDropdownOpen={navDropdownOpen} setIsDropdownOpen={setNavDropdownOpen} onResetPassword={handleResetPassword} onLogout={handleLogout} />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
              <Button variant="outline" size="sm" onClick={handleBack} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center"><AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" /><h3 className="text-lg font-semibold text-yellow-800">No Service Cart Data</h3><p>Please scan a QR code first.</p><Button onClick={() => navigate('/qr-scanner')} className="mt-4">Go to Scanner</Button></div>
            </div>
          </main>
        </div>
      );
    }
    
    // Main render
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <DashboardHeader customerName="Teller" isDropdownOpen={navDropdownOpen} setIsDropdownOpen={setNavDropdownOpen} onResetPassword={handleResetPassword} onLogout={handleLogout} />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center mb-4">
              <Button variant="outline" size="sm" onClick={handleBack}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
              <Button variant="outline" size="sm" onClick={handleRefresh}><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {/* Header with Account Details */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-6 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="h-6 w-6 text-blue-600" /> Service Cart Details</h2>
                    {accountNumber !== 'N/A' && (
                      <div className="mt-4 bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                        <div className="flex items-center gap-2 mb-3"><Wallet className="h-5 w-5 text-blue-600" /><h3 className="font-semibold">Customer Account Details</h3></div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div><div className="text-xs text-gray-500">Account Number</div><p className="text-sm font-mono font-semibold">{accountNumber}</p></div>
                          <div><div className="text-xs text-gray-500">Account Type</div><p className="text-sm font-semibold">{formatAccountType(accountType)}</p></div>
                          <div><div className="text-xs text-gray-500">Balance</div><p className="text-sm font-bold text-green-600">{formatCurrency(accountBalance)}</p></div>
                          <div><div className="text-xs text-gray-500">Status</div><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${accountStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{accountStatus}</span></div>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-gray-500" /><span className="text-sm text-gray-600">Cart ID:</span><span className="text-sm font-semibold">{serviceCart.cartId}</span></div>
                      <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-500" /><span className="text-sm text-gray-600">Customer:</span><span className="text-sm font-semibold">{serviceCart.customerName}</span></div>
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-500" /><span className="text-sm text-gray-600">Mobile:</span><span className="text-sm font-semibold">{serviceCart.mobileNumber || 'N/A'}</span></div>
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-500" /><span className="text-sm text-gray-600">Date:</span><span className="text-sm font-semibold">{serviceCart.date}</span></div>
                    </div>
                  </div>
                  <div className="text-right"><div className="text-3xl font-bold text-blue-600">KSh{serviceCart.charge}</div><div className="text-sm text-gray-500">Total Charge</div></div>
                </div>
              </div>
              {/* Progress */}
              <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="flex justify-between items-center mb-2"><h3 className="font-semibold">Service Progress</h3><span>{completedServicesCount}/{serviceCart.totalServices} Completed</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3"><div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${progressPercentage}%` }} /></div>
                <div className="grid grid-cols-5 gap-2 text-center text-sm">
                  <div><div className="text-green-600 font-semibold">{completedServicesCount}</div><div className="text-gray-600">Completed</div></div>
                  <div><div className="text-blue-600 font-semibold">{serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'INITIATED' || s.status?.toUpperCase() === 'IN_PROGRESS').length || 0}</div><div className="text-gray-600">Initiated</div></div>
                  <div><div className="text-orange-600 font-semibold">{onHoldServicesCount}</div><div className="text-gray-600">On Hold</div></div>
                  <div><div className="text-purple-600 font-semibold">{transferredServicesCount}</div><div className="text-gray-600">Transferred</div></div>
                  <div><div className="text-yellow-600 font-semibold">{pendingServicesCount}</div><div className="text-gray-600">Pending</div></div>
                </div>
              </div>
              {/* Services Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b"><tr><th className="px-6 py-3 text-left font-medium text-gray-600">Service ID</th><th className="px-6 py-3 text-left font-medium text-gray-600">Service Name</th><th className="px-6 py-3 text-left font-medium text-gray-600">Status</th><th className="px-6 py-3 text-left font-medium text-gray-600">Actions</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {serviceCart.services.map((service) => {
                      const currentStatus = service.status?.toUpperCase();
                      const isUpdating = updatingServiceId === service.service_id;
                      const showInitiateButton = currentStatus === 'PENDING' || currentStatus === 'IN_PROGRESS' || currentStatus === 'PROCESSING';
                      const showActionButtons = currentStatus === 'INITIATED';
                      const isOnHold = currentStatus === 'ON_HOLD';
                      const isToBeProcessed = currentStatus === 'TO_BE_PROCESSED';
                      const isCompleted = currentStatus === 'COMPLETED';
                      
                      return (
                        <tr key={service.service_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4"><button onClick={() => handleServiceIdClick(service.service_id)} className="font-mono text-xs text-blue-600 hover:underline">{service.service_id}</button></td>
                          <td className="px-6 py-4"><div className="flex items-center gap-2">{getServiceStatusIcon(currentStatus)}<span className="font-medium">{service.service_name}</span></div></td>
                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceStatusColor(currentStatus)}`}>{getStatusText(currentStatus)}</span></td>
                          <td className="px-6 py-4">
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> : (
                              <div className="flex gap-2 flex-wrap">
                                {/* INITIATE BUTTON */}
                                {showInitiateButton && (
                                  <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => initiateService(service.service_id)}>
                                    <PlayCircle className="h-4 w-4 mr-1" /> Initiate
                                  </Button>
                                )}
                                
                                {/* ACTION BUTTONS for INITIATED status */}
                                {showActionButtons && (
                                  <>
                                    <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => completeService(service.service_id)}>
                                      <ThumbsUp className="h-4 w-4 mr-1" /> Complete
                                    </Button>
                                    <Button size="sm" variant="outline" className="bg-orange-50 text-orange-700 border-orange-200" onClick={() => handleHoldClick(service)}>
                                      <PauseCircle className="h-4 w-4 mr-1" /> Hold
                                    </Button>
                                    <Button size="sm" variant="outline" className="bg-purple-50 text-purple-700 border-purple-200" onClick={() => handleTransferClick(service)}>
                                      <Send className="h-4 w-4 mr-1" /> Transfer Desk
                                    </Button>
                                  </>
                                )}
                                
                                {/* ON HOLD buttons */}
                                {isOnHold && (
                                  <>
                                    <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleResume(service.service_id)}>
                                      <Play className="h-4 w-4 mr-1" /> Resume
                                    </Button>
                                    <Button size="sm" variant="outline" className="bg-purple-50 text-purple-700 border-purple-200" onClick={() => handleTransferClick(service)}>
                                      <Send className="h-4 w-4 mr-1" /> Transfer Desk
                                    </Button>
                                  </>
                                )}
                                
                                {/* TO_BE_PROCESSED buttons */}
                                {isToBeProcessed && (
                                  <>
                                    <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => completeService(service.service_id)}>
                                      <ThumbsUp className="h-4 w-4 mr-1" /> Complete
                                    </Button>
                                    <Button size="sm" variant="outline" className="bg-purple-50 text-purple-700 border-purple-200" onClick={() => handleTransferClick(service)}>
                                      <Send className="h-4 w-4 mr-1" /> Transfer Desk
                                    </Button>
                                    <Button size="sm" variant="outline" className="bg-blue-50 text-blue-700 border-blue-200" onClick={() => handleHistoryClick(service)}>
                                      <History className="h-4 w-4 mr-1" /> History
                                    </Button>
                                  </>
                                )}
                                
                                {/* COMPLETED - no buttons */}
                                {isCompleted && (
                                  <div className="text-green-600 text-sm flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Completed</div>
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
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                <div><span className="text-sm text-gray-600">Cart Status:</span><span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${serviceCart.cartStatus === 'FULLY_SERVED' ? 'bg-green-100 text-green-700' : serviceCart.cartStatus === 'PARTIALLY_SERVED' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{serviceCart.cartStatus || 'Active'}</span></div>
                <div><span className="text-sm text-gray-600">Total Services:</span><span className="ml-2 font-semibold">{serviceCart.totalServices}</span></div>
              </div>
            </div>
          </div>
        </main>
        
        {/* Modals */}
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => { setIsTransferModalOpen(false); setSelectedTransferService(null); setTellers([]); }}
          service={selectedTransferService}
          tellers={tellers}
          isLoadingTellers={isLoadingTellers}
          onTransfer={handleTransfer}
          isTransferring={isTransferring}
        />
        <HoldModal
          isOpen={isHoldModalOpen}
          onClose={() => { setIsHoldModalOpen(false); setSelectedHoldService(null); }}
          service={selectedHoldService}
          onConfirmHold={handleHold}
          isHolding={isHolding}
        />
        <ServiceDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          details={selectedServiceDetails}
          isLoading={isLoadingDetails}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getServiceStatusColor={getServiceStatusColor}
          getStatusText={getStatusText}
        />
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={historyData}
          isLoading={isLoadingHistory}
          formatDate={formatDate}
        />
      </div>
    );
  };

  export default ProfilePage;