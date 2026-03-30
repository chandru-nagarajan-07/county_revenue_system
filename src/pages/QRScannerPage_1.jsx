import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ArrowLeft,
  QrCode,
  XCircle,
  CheckCircle,
  KeyRound,
  X,
  Camera,
  Upload,
  Scan,
  Loader2,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader';

const QRScannerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const serviceData = location.state?.serviceData;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [scanResult, setScanResult] = useState(null);
  const [showApprovalDetails, setShowApprovalDetails] = useState(false);
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingServices, setProcessingServices] = useState([]);

  const [approvalData, setApprovalData] = useState({
    cartId: '',
    customerName: '',
    mobileNumber: '',
    totalServices: 0,
    cartStatus: '',
    services: [],
    charge: serviceData?.charge || '0.00',
    service: serviceData?.service || 'Service Approval',
    date: new Date().toISOString().split('T')[0],
  });

  const qrCodeRegionRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // API base URL - change this to your actual backend URL
  const API_BASE_URL = 'http://localhost:8000/api';

  // Check if camera is available
  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      if (videoDevices.length === 0) {
        alert('No camera found on this device.');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error enumerating devices:', err);
      return false;
    }
  };

  // Function to get service status icon
  const getServiceStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <ClipboardList className="h-4 w-4 text-gray-500" />;
    }
  };

  // Function to get service status color
  const getServiceStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to fetch service cart data from backend
  const fetchServiceCart = async (cartId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/service_cart/${cartId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization token if needed
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data) {
        // Count services by status
        const completedCount = data.services.filter(s => s.status === 'completed').length;
        const pendingCount = data.services.filter(s => s.status === 'pending').length;
        const processingCount = data.services.filter(s => s.status === 'processing').length;
        
        // Calculate total charge (adjust based on your actual pricing)
        const totalCharge = data.total_services * 10; // Example calculation - modify as needed
        
        setApprovalData({
          cartId: data.cart_id,
          customerName: data.customer_name,
          mobileNumber: data.mobile_number,
          totalServices: data.total_services,
          cartStatus: data.cart_status,
          services: data.services,
          charge: totalCharge.toFixed(2),
          service: `${data.total_services} Service${data.total_services !== 1 ? 's' : ''}`,
          date: new Date().toISOString().split('T')[0],
        });
        
        // Set processing services (services that are pending or in progress)
        const processing = data.services.filter(s => 
          s.status === 'pending' || s.status === 'processing'
        );
        setProcessingServices(processing);
        
        setShowApprovalDetails(true);
      }
    } catch (err) {
      console.error('Error fetching service cart:', err);
      setError(err.message || 'Failed to fetch service cart details. Please check the QR code and try again.');
      alert(error || 'Failed to fetch service cart details');
      setScanResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSuccess = async (decodedText) => {
    if (isScanning) return;
    setIsScanning(true);
    setScanResult(decodedText);
    
    try {
      // Try to parse the QR data as JSON
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
      } catch (parseError) {
        // If not JSON, treat the whole text as cart_id
        qrData = { cart_id: decodedText };
      }
      
      // Extract cart_id from QR data
      const cartId = qrData.cart_id || qrData.cartId || decodedText;
      
      if (!cartId) {
        throw new Error('No cart ID found in QR code');
      }
      
      console.log('Extracted cart ID:', cartId);
      
      // Fetch service cart details from backend
      await fetchServiceCart(cartId);
      
    } catch (err) {
      console.error('QR code processing error:', err);
      setError(err.message || 'Failed to process QR code');
      alert(`Error processing QR code: ${err.message}`);
      setScanResult(null);
      setShowApprovalDetails(false);
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanFailure = (error) => {
    if (error && !error.includes('No QR code found')) {
      console.warn('QR scan error:', error);
    }
  };

  const startCamera = async (facingMode = 'environment') => {
    const container = document.getElementById('qr-reader');
    if (!container) {
      alert('Scanner container not ready. Please refresh.');
      return;
    }

    // Ensure camera is available
    const cameraAvailable = await checkCameraAvailability();
    if (!cameraAvailable) return;

    // Stop any existing scanner
    await stopCamera();

    // Wait a bit to ensure camera is released
    await new Promise(resolve => setTimeout(resolve, 500));

    // Make container visible
    container.classList.remove('hidden');

    const html5QrCode = new Html5Qrcode('qr-reader');
    html5QrCodeRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        handleScanSuccess,
        handleScanFailure
      );
      setCameraActive(true);
    } catch (err) {
      console.error(`Failed to start camera with facingMode=${facingMode}:`, err);
      if (facingMode === 'environment') {
        // Try with default camera (user)
        console.log('Trying with default facing mode...');
        await startCamera('user');
      } else {
        // Both attempts failed
        let errorMsg = 'Could not access camera. ';
        if (err.name === 'NotReadableError') {
          errorMsg += 'The camera may be in use by another application. Please close other apps using the camera and try again.';
        } else if (err.name === 'NotAllowedError') {
          errorMsg += 'Please grant camera permissions.';
        } else if (err.name === 'NotFoundError') {
          errorMsg += 'No camera found on this device.';
        } else {
          errorMsg += 'Please check your device settings and ensure you are using HTTPS (required for camera access).';
        }
        alert(errorMsg);
        setCameraActive(false);
        html5QrCodeRef.current = null;
        container.classList.add('hidden');
      }
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error while stopping camera:', err);
      } finally {
        html5QrCodeRef.current = null;
        setCameraActive(false);
        const container = document.getElementById('qr-reader');
        if (container) container.classList.add('hidden');
      }
    } else {
      setCameraActive(false);
      const container = document.getElementById('qr-reader');
      if (container) container.classList.add('hidden');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await stopCamera();

      // Create a temporary container for file scanning
      const tempContainer = document.createElement('div');
      tempContainer.id = 'qr-reader-temp-' + Date.now();
      tempContainer.style.display = 'none';
      document.body.appendChild(tempContainer);

      const tempScanner = new Html5Qrcode(tempContainer.id);
      try {
        const decodedText = await tempScanner.scanFile(file, true);
        await tempScanner.clear();
        document.body.removeChild(tempContainer);
        await handleScanSuccess(decodedText);
      } catch (err) {
        console.error('QR scan from file failed:', err);
        try {
          await tempScanner.clear();
        } catch (e) {
          console.warn('Error clearing scanner:', e);
        }
        document.body.removeChild(tempContainer);
        alert('Could not read QR code from image. Please try another image with a clear QR code.');
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Error processing file. Please try again.');
    } finally {
      event.target.value = ''; // reset file input
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleApprove = async () => {
    if (!approvalData.cartId) {
      alert('Please scan a QR code first.');
      return;
    }
    
    // Check if there are pending services
    if (processingServices.length > 0) {
      alert(`There are ${processingServices.length} service(s) pending processing. Please complete them before approving.`);
      return;
    }
    
    // Here you can make an API call to approve the service
    try {
      // Example: Update cart status to approved
      // const response = await fetch(`${API_BASE_URL}/service_cart/${approvalData.cartId}/approve/`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      // });
      
      alert('Service approved successfully!');
      navigate('/profilepage', {
        state: {
          cartId: approvalData.cartId,
          customerName: approvalData.customerName,
          totalServices: approvalData.totalServices,
        },
      });
    } catch (err) {
      console.error('Error approving service:', err);
      alert('Failed to approve service. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate('/dash');
  };

  const handleResetPassword = () => {
    setIsDropdownOpen(false);
    setShowResetModal(true);
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    navigate('/');
  };

  const handlePasswordUpdate = () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    alert('Password updated successfully!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowResetModal(false);
  };

  // Calculate service statistics
  const completedServicesCount = approvalData.services.filter(s => s.status === 'completed').length;
  const pendingServicesCount = approvalData.services.filter(s => s.status === 'pending').length;
  const processingServicesCount = approvalData.services.filter(s => s.status === 'processing').length;
  const progressPercentage = (completedServicesCount / approvalData.totalServices) * 100 || 0;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <DashboardHeader
        customerName="Customer"
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        onResetPassword={handleResetPassword}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-hidden flex flex-col p-4 md:p-8">
        <div className="max-w-md mx-auto w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold">QR Scanner</h2>
            </div>

            <div className="flex justify-center mb-6">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowScanOptions(true)}
                disabled={isLoading}
              >
                <Scan className="h-5 w-5 mr-2" /> Scan QR Code
              </Button>
            </div>

            <div
              id="qr-reader"
              ref={qrCodeRegionRef}
              className="w-full max-w-sm mx-auto hidden"
              style={{ minHeight: cameraActive ? '300px' : '0px' }}
            />

            <div id="qr-reader-file" className="hidden" />

            {cameraActive && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopCamera}
                  className="text-red-600"
                >
                  <X className="h-4 w-4 mr-2" /> Stop Camera
                </Button>
              </div>
            )}

            {!cameraActive && !showApprovalDetails && !isLoading && (
              <p className="text-center text-sm text-slate-500 mt-4">
                Click "Scan QR Code" to start.
              </p>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center mt-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-2 text-sm text-slate-500">Loading service details...</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {showApprovalDetails && !isLoading && (
              <div className="mt-6 space-y-4 border-t pt-4">
                {/* Customer Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Customer Information</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Cart ID</label>
                      <p className="text-lg font-semibold">{approvalData.cartId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Customer Name</label>
                      <p className="text-lg">{approvalData.customerName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Mobile Number</label>
                      <p className="text-lg">{approvalData.mobileNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Service Progress */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Service Progress</h3>
                    <span className="text-sm text-gray-600">
                      {completedServicesCount}/{approvalData.totalServices} Completed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <div className="text-green-600 font-semibold">{completedServicesCount}</div>
                      <div className="text-gray-600">Completed</div>
                    </div>
                    <div>
                      <div className="text-yellow-600 font-semibold">{pendingServicesCount}</div>
                      <div className="text-gray-600">Pending</div>
                    </div>
                    <div>
                      <div className="text-blue-600 font-semibold">{processingServicesCount}</div>
                      <div className="text-gray-600">Processing</div>
                    </div>
                  </div>
                </div>

                {/* Services List */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Services to Process</h3>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {approvalData.services.map((service, index) => (
                      <div 
                        key={index} 
                        className={`flex justify-between items-center p-3 rounded-lg border ${
                          service.status === 'pending' ? 'border-yellow-200 bg-yellow-50' :
                          service.status === 'processing' ? 'border-blue-200 bg-blue-50' :
                          service.status === 'completed' ? 'border-green-200 bg-green-50' :
                          'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {getServiceStatusIcon(service.status)}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{service.service_name}</p>
                            <p className="text-xs text-gray-500">Service ID: {service.service_id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${getServiceStatusColor(service.status)}`}>
                            {service.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cart Summary */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Services:</span>
                    <span className="font-semibold">{approvalData.totalServices}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium">Cart Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      approvalData.cartStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {approvalData.cartStatus || 'Active'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium">Total Charge:</span>
                    <span className="text-xl font-bold text-blue-600">${approvalData.charge}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium">Date:</span>
                    <span className="text-gray-600">{approvalData.date}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={!approvalData.cartId || isLoading || processingServices.length > 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" /> 
                {processingServices.length > 0 
                  ? `Complete ${processingServices.length} Pending Service(s) First` 
                  : 'Approve Service'}
              </Button>
              {processingServices.length > 0 && (
                <p className="text-xs text-yellow-600 text-center mt-2">
                  Please complete all pending services before approval
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Scan Options Modal */}
      {showScanOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Choose Scan Method</h2>
              <button
                onClick={() => setShowScanOptions(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <Button
                className="w-full flex items-center justify-center gap-2"
                onClick={async () => {
                  setShowScanOptions(false);
                  await startCamera();
                }}
              >
                <Camera className="h-5 w-5" />
                Open Camera
              </Button>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 relative overflow-hidden"
              >
                <Upload className="h-5 w-5" />
                Choose from Gallery
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={(e) => {
                    setShowScanOptions(false);
                    handleFileUpload(e);
                  }}
                />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
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
              <Button className="w-full" onClick={handlePasswordUpdate}>
                Update Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScannerPage;