import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, CheckCircle, XCircle, User, DollarSign, Calendar, FileText, RefreshCw,
  Clock, Loader2, AlertCircle, CheckCircle2, ClipboardList, Phone, Hash, PauseCircle,
  ThumbsUp, ThumbsDown, Info, Send, History
} from 'lucide-react';
import { DashboardHeader } from '@/components/banking/DashboardHeader1';

// ==================== MODAL COMPONENTS (defined outside to keep stable identity) ====================

// History Modal
const HistoryModal = ({ isOpen, onClose, isLoading, data, formatDate }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" /> Referral History
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <p className="mt-2 text-gray-600">Loading history...</p>
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-3">Transfer Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Action:</span> <span className="ml-2 font-medium">{data.action || "N/A"}</span></div>
                  <div><span className="text-gray-500">Previous Teller:</span> <span className="ml-2">{data.previous_teller || "N/A"}</span></div>
                  <div><span className="text-gray-500">New Teller:</span> <span className="ml-2">{data.new_teller || "N/A"}</span></div>
                  <div><span className="text-gray-500">Remarks/Reason:</span> <span className="ml-2">{data.remarks || "N/A"}</span></div>
                  <div><span className="text-gray-500">Date:</span> <span className="ml-2">{formatDate(data.created_at)}</span></div>
                  <div><span className="text-gray-500">Service ID:</span> <span className="ml-2">{data.service || "N/A"}</span></div>
                </div>
              </div>
              {data.transfer_history && data.transfer_history.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-blue-50 px-4 py-2 border-b"><h3 className="font-semibold text-blue-900">All Transfers</h3></div>
                  <div className="p-4 space-y-4">
                    {data.transfer_history.map((item, idx) => (
                      <div key={item.id || idx} className="border-l-2 border-blue-300 pl-4 pb-3">
                        <p className="text-sm font-semibold">Transfer #{idx+1}</p>
                        <p className="text-sm">From: {item.previous_teller}</p>
                        <p className="text-sm">To: {item.new_teller}</p>
                        <p className="text-sm">Reason: {item.remarks || "N/A"}</p>
                        <p className="text-sm">Date: {formatDate(item.created_at)}</p>
                        <p className="text-sm">Action: <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">{item.action}</span></p>
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
};

// Transfer Modal - STABLE COMPONENT
const TransferModal = ({ 
  isOpen, onClose, service, tellers, selectedTeller, setSelectedTeller,
  transferReason, setTransferReason, isTransferring, isLoadingTellers,
  onTransfer, getServiceStatusColor, getStatusText 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Send className="h-5 w-5 text-purple-600" /> Transfer Service
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
                <div><span className="text-gray-500">Current Status:</span> <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getServiceStatusColor(service.status)}`}>{getStatusText(service.status)}</span></div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Transfer Reason <span className="text-red-500">*</span></label>
            <textarea
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Please provide a reason for transferring this service..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows="3"
              maxLength={500}
              autoFocus
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && !e.shiftKey) e.preventDefault();
              }}
            />
            <p className="mt-1 text-xs text-gray-500">This reason will be logged for audit purposes</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><User className="h-4 w-4" /> Select Teller to Transfer To <span className="text-red-500">*</span></h4>
            {isLoadingTellers ? (
              <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" /><p className="mt-2 text-gray-600">Loading tellers...</p></div>
            ) : tellers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg"><AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" /><p className="text-gray-600">No tellers found in your branch</p></div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tellers.map((teller) => (
                  <div key={teller.id} onClick={() => setSelectedTeller(teller)} className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedTeller?.id === teller.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1"><User className="h-4 w-4 text-gray-500" /><span className="font-semibold text-gray-800">{teller.name}</span></div>
                        <div className="text-sm text-gray-600">Email: {teller.email || 'N/A'}<br />Employee ID: {teller.employee_id || 'N/A'}</div>
                      </div>
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
          <Button onClick={onTransfer} disabled={!selectedTeller || !transferReason.trim() || isTransferring} className="bg-purple-600 hover:bg-purple-700">
            {isTransferring ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Transferring...</> : <><Send className="h-4 w-4 mr-2" /> Transfer Service</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Service Details Modal
const ServiceDetailsModal = ({ isOpen, onClose, isLoading, details, formatDate, formatCurrency, getServiceStatusColor, getStatusText }) => {
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
            <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" /><p className="mt-2 text-gray-600">Loading details...</p></div>
          ) : details ? (
            <div className="space-y-6">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 border-b"><h4 className="font-semibold text-blue-900">Cart Item Information</h4></div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {details.cart && Object.entries(details.cart).map(([key, value]) => {
                      if (["service_data","created_at","documents","core_banking_ref","rejection_reason","customer_notified","processed_at","completed_at","teller"].includes(key)) return null;
                      let displayValue = value;
                      if (key === "amount") displayValue = formatCurrency(value);
                      else if (value === null || value === undefined) displayValue = "N/A";
                      else if (typeof value === "boolean") displayValue = value ? "Yes" : "No";
                      return (
                        <div key={key} className="flex flex-col">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{key.replace(/_/g, " ")}</span>
                          <span className="text-sm text-gray-900 mt-1 font-medium">{String(displayValue)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {details.service_data && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-green-50 px-4 py-2 border-b"><h4 className="font-semibold text-green-900">Service Data Details</h4></div>
                  <div className="p-4">
                    {details.service_data.error ? (
                      <div className="text-red-600 p-2 bg-red-50 rounded">Error: {details.service_data.error}</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(details.service_data).map(([key, value]) => {
                          if (key === "qr_img") return null;
                          let displayValue = value;
                          if (key === "created_at") displayValue = formatDate(value);
                          else if (key === "amount") displayValue = formatCurrency(value);
                          else if (value === null || value === undefined) displayValue = "N/A";
                          return (
                            <div key={key} className="flex flex-col">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{key.replace(/_/g, " ")}</span>
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
                  <div><span className="text-sm text-gray-600">Service Status:</span><span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getServiceStatusColor(details.cart?.service_status)}`}>{getStatusText(details.cart?.service_status)}</span></div>
                  <div><span className="text-sm text-gray-600">Service Code:</span><span className="ml-2 font-mono text-sm font-semibold text-gray-800">{details.cart?.service_code}</span></div>
                </div>
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
};

// ==================== MAIN COMPONENT ====================
const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cartData = location.state;
  const tellerUser = JSON.parse(sessionStorage.getItem("userData1") || "{}");
  const teller_id = tellerUser?.teller_id || null;
  const branchCode = tellerUser?.teller_info || null;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serviceCart, setServiceCart] = useState(null);
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

  const API_BASE_URL = 'http://localhost:8000/api';
  const STATUS_OPTIONS = { ON_HOLD: 'ON_HOLD', COMPLETED: 'COMPLETED', TRANSFERRED: 'TRANSFERRED', TO_BE_PROCESSED: 'TO_BE_PROCESSED' };

  // Fetch service cart
  const fetchServiceCart = async (cartId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/teller_service_cart/${cartId}/${teller_id}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data) {
        const totalCharge = data.total_services * 10;
        setServiceCart({
          cartId: data.cart_id, customerName: data.customer_name, mobileNumber: data.mobile_number,
          totalServices: data.total_services, cartStatus: data.cart_status, services: data.services,
          charge: totalCharge.toFixed(2), date: new Date().toISOString().split('T')[0],
        });
      }
    } catch (err) { console.error(err); setError(err.message); } 
    finally { setIsLoading(false); }
  };

  const fetchServiceCartItemDetails = async (cartId) => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ServiceCartItemsDetail/${cartId}/`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setSelectedServiceDetails(data);
      setIsDetailsModalOpen(true);
    } catch (err) { console.error(err); alert(`Failed to fetch service details: ${err.message}`); } 
    finally { setIsLoadingDetails(false); }
  };

  const fetchTellersByBranch = async () => {
    setIsLoadingTellers(true);
    try {
      if (!branchCode) throw new Error('Branch code not found');
      const response = await fetch(`${API_BASE_URL}/fetch_tellers/${encodeURIComponent(branchCode)}/`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const formattedTellers = data.map(allocation => ({ id: allocation.teller, name: `Teller ${allocation.teller}`, email: 'Loading...', employee_id: allocation.teller, branch_id: allocation.branch, allocation_id: allocation.id, allocated_at: allocation.allocated_at }));
      const tellersWithDetails = await Promise.all(formattedTellers.map(async (teller) => {
        try {
          const userResponse = await fetch(`${API_BASE_URL}/users/${teller.id}/`, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            return { ...teller, name: userData.name || userData.full_name || `Teller ${teller.id}`, email: userData.email || 'N/A', employee_id: userData.user_ID || userData.employee_id || teller.id };
          }
        } catch (err) { console.error(err); }
        return teller;
      }));
      setTellers(tellersWithDetails);
    } catch (err) { console.error(err); alert(`Failed to fetch tellers: ${err.message}`); } 
    finally { setIsLoadingTellers(false); }
  };

  const fetchServiceHistory = async (serviceId) => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${API_BASE_URL}/referral_history/${serviceId}/`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const latestTransfer = data[0];
        setHistoryData({ previous_teller: latestTransfer.previous_teller, new_teller: latestTransfer.new_teller, remarks: latestTransfer.remarks, created_at: latestTransfer.created_at, action: latestTransfer.action, service: latestTransfer.service, id: latestTransfer.id, transfer_history: data });
      } else setHistoryData(null);
      setIsHistoryOpen(true);
    } catch (err) { console.error(err); alert(`Failed to fetch service history: ${err.message}`); } 
    finally { setIsLoadingHistory(false); }
  };

  const transferService = async () => {
    if (!selectedTransferService || !selectedTeller) { alert('Please select a teller'); return; }
    if (!transferReason.trim()) { alert('Please provide a reason'); return; }
    setIsTransferring(true);
    try {
      const response = await fetch(`${API_BASE_URL}/service_transfer/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ service_id: selectedTransferService.service_id, to_teller_id: selectedTeller.id, teller_id: teller_id, transfer_reason: transferReason.trim(), status: 'TO_BE_PROCESSED' })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setServiceCart(prev => ({ ...prev, services: prev.services.map(s => s.service_id === data.service.service_id ? { ...s, ...data.service } : s) }));
      alert(`Service successfully transferred to ${selectedTeller.name}`);
      setIsTransferModalOpen(false); setSelectedTransferService(null); setSelectedTeller(null); setTellers([]); setTransferReason('');
    } catch (err) { console.error(err); alert(`Failed to transfer service: ${err.message}`); } 
    finally { setIsTransferring(false); }
  };

  const handleTransferClick = async (service) => {
    if (!branchCode) { alert('Branch information not available.'); return; }
    setSelectedTransferService(service);
    setTransferReason('');
    setIsTransferModalOpen(true);
    await fetchTellersByBranch();
  };

  const updateServiceStatus = async (serviceId, status) => {
    setUpdatingServiceId(serviceId);
    try {
      const response = await fetch(`${API_BASE_URL}/service_cart_status/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: serviceId, teller_id: teller_id, status: status })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      if (serviceCart && serviceCart.cartId) await fetchServiceCart(serviceCart.cartId);
      alert(`Service ${status.toLowerCase().replace('_', ' ')} successfully!`);
    } catch (err) { console.error(err); alert(`Failed to update service status: ${err.message}`); } 
    finally { setUpdatingServiceId(null); }
  };

  // Helper functions for styling
  const getServiceStatusIcon = (status) => {
    switch(status?.toUpperCase()) {
      case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'ON_HOLD': return <PauseCircle className="h-4 w-4 text-orange-500" />;
      case 'TO_BE_PROCESSED': return <Send className="h-4 w-4 text-purple-500" />;
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'PROCESSING': case 'IN_PROGRESS': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <ClipboardList className="h-4 w-4 text-gray-500" />;
    }
  };
  const getServiceStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ON_HOLD': return 'bg-orange-100 text-orange-800';
      case 'TRANSFERRED': return 'bg-purple-100 text-purple-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': case 'TO_BE_PROCESSED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusText = (status) => {
    switch(status?.toUpperCase()) {
      case 'COMPLETED': return 'Completed';
      case 'ON_HOLD': return 'On Hold';
      case 'TRANSFERRED': return 'Transferred';
      case 'PENDING': return 'Pending';
      case 'PROCESSING': case 'IN_PROGRESS': return 'In Progress';
      case 'TO_BE_PROCESSED': return 'To Be Processed';
      default: return status || 'Unknown';
    }
  };

  const handleBack = () => navigate('/dash');
  const handleResetPassword = () => { setNavDropdownOpen(false); alert('Reset password functionality would go here.'); };
  const handleLogout = () => { setNavDropdownOpen(false); navigate('/'); };
  const handleRefresh = async () => { if (serviceCart && serviceCart.cartId) await fetchServiceCart(serviceCart.cartId); else alert('No cart ID available'); };
  const handleServiceIdClick = (serviceId) => fetchServiceCartItemDetails(serviceId);
  const handleHistoryClick = (service) => { if (service.status?.toUpperCase() === 'TO_BE_PROCESSED') fetchServiceHistory(service.service_id); };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString() : 'N/A';
  const formatCurrency = (amount) => amount ? `KSh ${parseFloat(amount).toFixed(2)}` : 'N/A';

  useEffect(() => {
    if (cartData && cartData.cartId) setServiceCart(cartData);
    else setError('No service cart data found. Please scan a QR code first.');
  }, [cartData]);

  if (isLoading) return ( <div className="flex flex-col min-h-screen bg-slate-50"><DashboardHeader customerName="Teller" isDropdownOpen={navDropdownOpen} setIsDropdownOpen={setNavDropdownOpen} onResetPassword={handleResetPassword} onLogout={handleLogout} /><main className="flex-1 flex items-center justify-center"><div className="text-center"><Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" /><p className="mt-4 text-gray-600">Loading service cart details...</p></div></main></div> );
  if (error) return ( <div className="flex flex-col min-h-screen bg-slate-50"><DashboardHeader customerName="Teller" isDropdownOpen={navDropdownOpen} setIsDropdownOpen={setNavDropdownOpen} onResetPassword={handleResetPassword} onLogout={handleLogout} /><main className="flex-1 p-4 md:p-8"><div className="max-w-6xl mx-auto"><Button variant="outline" size="sm" onClick={handleBack} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button><div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"><AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" /><h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3><p className="text-red-600">{error}</p><Button onClick={handleBack} className="mt-4">Go Back</Button></div></div></main></div> );
  if (!serviceCart) return ( <div className="flex flex-col min-h-screen bg-slate-50"><DashboardHeader customerName="Teller" isDropdownOpen={navDropdownOpen} setIsDropdownOpen={setNavDropdownOpen} onResetPassword={handleResetPassword} onLogout={handleLogout} /><main className="flex-1 p-4 md:p-8"><div className="max-w-6xl mx-auto"><Button variant="outline" size="sm" onClick={handleBack} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center"><AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" /><h3 className="text-lg font-semibold text-yellow-800 mb-2">No Service Cart Data</h3><p className="text-yellow-600">Please scan a QR code first to view service details.</p><Button onClick={() => navigate('/qr-scanner')} className="mt-4">Go to Scanner</Button></div></div></main></div> );

  const completedServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'COMPLETED').length || 0;
  const onHoldServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'ON_HOLD').length || 0;
  const transferredServicesCount = serviceCart?.services?.filter(s => s.status?.toUpperCase() === 'TRANSFERRED').length || 0;
  const pendingServicesCount = serviceCart?.services?.filter(s => ['PENDING','PROCESSING','IN_PROGRESS'].includes(s.status?.toUpperCase()))?.length || 0;
  const progressPercentage = (completedServicesCount / (serviceCart?.totalServices || 1)) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <DashboardHeader customerName="Teller" isDropdownOpen={navDropdownOpen} setIsDropdownOpen={setNavDropdownOpen} onResetPassword={handleResetPassword} onLogout={handleLogout} />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" size="sm" onClick={handleBack}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="h-6 w-6 text-blue-600" /> Service Cart Details</h2>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-gray-500" /><span className="text-sm text-gray-600">Cart ID:</span><span className="text-sm font-semibold text-gray-800">{serviceCart.cartId}</span></div>
                    <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-500" /><span className="text-sm text-gray-600">Customer:</span><span className="text-sm font-semibold text-gray-800">{serviceCart.customerName}</span></div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-500" /><span className="text-sm text-gray-600">Mobile:</span><span className="text-sm font-semibold text-gray-800">{serviceCart.mobileNumber || 'N/A'}</span></div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-500" /><span className="text-sm text-gray-600">Date:</span><span className="text-sm font-semibold text-gray-800">{serviceCart.date}</span></div>
                  </div>
                </div>
                <div className="text-right"><div className="text-3xl font-bold text-blue-600">KSh{serviceCart.charge}</div><div className="text-sm text-gray-500 mt-1">Total Charge</div></div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex justify-between items-center mb-2"><h3 className="font-semibold text-gray-700">Service Progress</h3><span className="text-sm text-gray-600">{completedServicesCount}/{serviceCart.totalServices} Completed</span></div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3"><div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} /></div>
              <div className="grid grid-cols-4 gap-2 text-center text-sm"><div><div className="text-green-600 font-semibold">{completedServicesCount}</div><div className="text-gray-600">Completed</div></div><div><div className="text-orange-600 font-semibold">{onHoldServicesCount}</div><div className="text-gray-600">On Hold</div></div><div><div className="text-purple-600 font-semibold">{transferredServicesCount}</div><div className="text-gray-600">Transferred</div></div><div><div className="text-yellow-600 font-semibold">{pendingServicesCount}</div><div className="text-gray-600">Pending</div></div></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b"><tr><th className="px-6 py-3 text-left font-medium text-gray-600">Service ID</th><th className="px-6 py-3 text-left font-medium text-gray-600">Service Name</th><th className="px-6 py-3 text-left font-medium text-gray-600">Status</th><th className="px-6 py-3 text-left font-medium text-gray-600">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {serviceCart.services.map(service => {
                    const currentStatus = service.status?.toUpperCase();
                    const isUpdating = updatingServiceId === service.service_id;
                    const showHistoryButton = currentStatus === 'TO_BE_PROCESSED';
                    return (
                      <tr key={service.service_id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4"><button onClick={() => handleServiceIdClick(service.service_id)} className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">{service.service_id}</button></td>
                        <td className="px-6 py-4"><div className="flex items-center gap-2">{getServiceStatusIcon(currentStatus)}<span className="font-medium">{service.service_name}</span></div></td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceStatusColor(currentStatus)}`}>{getStatusText(currentStatus)}</span></td>
                        <td className="px-6 py-4">
                          {isUpdating ? <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-blue-500" /><span className="text-xs text-gray-500">Updating...</span></div> :
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
                                  <Send className="h-4 w-4 mr-1" /> Transfer Deck
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
                          }
                          {currentStatus === STATUS_OPTIONS.COMPLETED && <div className="text-green-600 text-sm flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Completed</div>}
                          {currentStatus === STATUS_OPTIONS.ON_HOLD && <div className="text-orange-600 text-sm flex items-center gap-1"><PauseCircle className="h-4 w-4" /> On Hold</div>}
                          {currentStatus === STATUS_OPTIONS.TO_BE_PROCESSED && <div className="text-purple-600 text-sm flex items-center gap-1"><Send className="h-4 w-4" /> To Be Processed</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex justify-between items-center">
                <div><span className="text-sm text-gray-600">Cart Status:</span><span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${serviceCart.cartStatus === 'FULLY_SERVED' ? 'bg-green-100 text-green-700' : serviceCart.cartStatus === 'PARTIALLY_SERVED' ? 'bg-yellow-100 text-yellow-700' : serviceCart.cartStatus === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{serviceCart.cartStatus || 'Active'}</span></div>
                <div><span className="text-sm text-gray-600">Total Services:</span><span className="ml-2 font-semibold text-gray-800">{serviceCart.totalServices}</span></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals - using stable components with props */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => { setIsTransferModalOpen(false); setSelectedTransferService(null); setSelectedTeller(null); setTellers([]); setTransferReason(''); }}
        service={selectedTransferService}
        tellers={tellers}
        selectedTeller={selectedTeller}
        setSelectedTeller={setSelectedTeller}
        transferReason={transferReason}
        setTransferReason={setTransferReason}
        isTransferring={isTransferring}
        isLoadingTellers={isLoadingTellers}
        onTransfer={transferService}
        getServiceStatusColor={getServiceStatusColor}
        getStatusText={getStatusText}
      />

      <ServiceDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        isLoading={isLoadingDetails}
        details={selectedServiceDetails}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        getServiceStatusColor={getServiceStatusColor}
        getStatusText={getStatusText}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        isLoading={isLoadingHistory}
        data={historyData}
        formatDate={formatDate}
      />
    </div>
  );
};

export default ProfilePage;