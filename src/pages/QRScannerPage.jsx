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
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/banking/DashboardHeader1';

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
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);
  const [error, setError] = useState(null);
  const [processingServices, setProcessingServices] = useState([]);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [userDetails, setUserDetails] = useState(null); // State to store user details

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
  console.log('Received service data from navigation state:', approvalData);

  const qrCodeRegionRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // API base URL - change this to your actual backend URL
  const API_BASE_URL = 'http://localhost:8000/api';

  // New function to fetch user details by mobile number
  const fetchUserDetails = async (mobileNumber) => {
    if (!mobileNumber) {
      console.log('No mobile number provided');
      return null;
    }

    setIsLoadingUserDetails(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/user_detail/${mobileNumber}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization token if needed
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`User with mobile number "${mobileNumber}" not found`);
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const userData = await response.json();
      console.log('Fetched user details:', userData);
      setUserDetails(userData);
      return userData;
      
    } catch (err) {
      console.error('Error fetching user details:', err);
      // Don't set main error here, just log it
      return null;
    } finally {
      setIsLoadingUserDetails(false);
    }
  };

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
    setUserDetails(null); // Reset user details when fetching new cart
    
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
        if (response.status === 404) {
          throw new Error(`Cart with ID "${cartId}" not found. Please check the QR code.`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched service cart data:', data);  
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
        
        // Fetch user details using the mobile number from the cart
        if (data.mobile_number) {
          await fetchUserDetails(data.mobile_number);
        }
        
        setShowApprovalDetails(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching service cart:', err);
      setError(err.message || 'Failed to fetch service cart details. Please check the QR code and try again.');
      setShowApprovalDetails(false);
      setScanResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSuccess = async (decodedText) => {
    if (isScanning) return;
    setIsScanning(true);
    setScanResult(decodedText);
    setError(null);
    
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
      setShowApprovalDetails(false);
      setScanResult(null);
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanFailure = (error) => {
    // Only log meaningful errors, ignore frequent "No QR code found" messages
    if (error && !error.includes('No QR code found') && !error.includes('NotFoundException')) {
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
          formatsToSupport: ['QR_CODE'], // Only support QR codes for better performance
        },
        handleScanSuccess,
        handleScanFailure
      );
      setCameraActive(true);
      setScanAttempts(0);
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      event.target.value = '';
      return;
    }

    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Please upload an image smaller than 5MB.');
      event.target.value = '';
      return;
    }

    try {
      await stopCamera();
      setIsLoading(true);
      setError(null);

      // Create a temporary container for file scanning
      const tempContainer = document.createElement('div');
      tempContainer.id = 'qr-reader-temp-' + Date.now();
      tempContainer.style.display = 'none';
      document.body.appendChild(tempContainer);

      const tempScanner = new Html5Qrcode(tempContainer.id);
      
      try {
        // Scan the file with configuration
        const decodedText = await tempScanner.scanFile(file, {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: ['QR_CODE'],
        });
        
        await tempScanner.clear();
        document.body.removeChild(tempContainer);
        
        // Process the scanned result
        await handleScanSuccess(decodedText);
        
      } catch (err) {
        console.error('QR scan from file failed:', err);
        
        // Provide more specific error messages
        let errorMessage = 'Could not read QR code from image. ';
        
        if (err.message?.includes('No MultiFormat Readers were able to detect') || 
            err.name === 'NotFoundException') {
          errorMessage += 'No QR code found in the image. Please ensure:\n\n' +
            '• The image contains a clear, visible QR code\n' +
            '• The QR code is not blurry or damaged\n' +
            '• The QR code is well-lit and not obstructed\n\n' +
            'Try taking a clearer photo with better lighting.';
        } else if (err.name === 'NotSupportedError') {
          errorMessage += 'The selected file format is not supported. Please use PNG, JPG, or JPEG format.';
        } else {
          errorMessage += 'Please try another image with a clear QR code.';
        }
        
        setError(errorMessage);
        
        try {
          await tempScanner.clear();
        } catch (e) {
          console.warn('Error clearing scanner:', e);
        }
        document.body.removeChild(tempContainer);
        
      } finally {
        setIsLoading(false);
      }
      
    } catch (err) {
      console.error('File upload error:', err);
      setError('Error processing file. Please try again.');
      setIsLoading(false);
    } finally {
      event.target.value = ''; // reset file input
    }
  };

  // Retry scanning with better quality
  const retryScan = () => {
    setError(null);
    setScanResult(null);
    setShowApprovalDetails(false);
    setUserDetails(null); // Reset user details on retry
    if (cameraActive) {
      // Restart camera for better quality
      stopCamera();
      setTimeout(() => startCamera(), 500);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Updated function to handle view services navigation
  const handleViewServices = () => {
    if (!approvalData.cartId) {
      alert('Please scan a QR code first.');
      return;
    }
    
    // Navigate to ProfilePage with cart data and user details
    navigate('/profilepage', {
      state: {
        cartId: approvalData.cartId,
        customerName: approvalData.customerName,
        mobileNumber: approvalData.mobileNumber,
        totalServices: approvalData.totalServices,
        cartStatus: approvalData.cartStatus,
        services: approvalData.services,
        charge: approvalData.charge,
        date: approvalData.date,
        userDetails: userDetails // Pass user details to profile page
      }
    });
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
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long!');
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
              <div className="flex justify-center mt-4 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopCamera}
                  className="text-red-600"
                >
                  <X className="h-4 w-4 mr-2" /> Stop Camera
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startCamera()}
                >
                  <Camera className="h-4 w-4 mr-2" /> Switch Camera
                </Button>
              </div>
            )}

            {!cameraActive && !showApprovalDetails && !isLoading && !error && (
              <div className="text-center">
                <p className="text-sm text-slate-500 mt-4">
                  Click "Scan QR Code" to start scanning.
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <strong>Tips for better scanning:</strong><br />
                    • Ensure good lighting<br />
                    • Hold the camera steady<br />
                    • Keep QR code within the frame<br />
                    • Avoid glare and reflections
                  </p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center mt-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-2 text-sm text-slate-500">Loading service details...</p>
              </div>
            )}

            {isLoadingUserDetails && (
              <div className="flex items-center justify-center mt-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                <p className="text-xs text-slate-500">Fetching user details...</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retryScan}
                      className="mt-3 text-sm"
                    >
                      <Scan className="h-4 w-4 mr-2" /> Try Again
                    </Button>
                  </div>
                </div>
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

                {/* User Details Section - New */}
                {/* {userDetails && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <User className="h-5 w-5 text-green-600" />
                      Complete User Details
                    </h3>
                    <div className="space-y-2">
                      {userDetails.full_name && (
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <label className="block text-xs font-medium text-slate-600">Full Name</label>
                            <p className="text-sm font-medium">{userDetails.full_name}</p>
                          </div>
                        </div>
                      )}
                      {userDetails.email && (
                        <div className="flex items-start gap-2">
                          <Mail className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <label className="block text-xs font-medium text-slate-600">Email</label>
                            <p className="text-sm">{userDetails.email}</p>
                          </div>
                        </div>
                      )}
                      {userDetails.phone && (
                        <div className="flex items-start gap-2">
                          <Phone className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <label className="block text-xs font-medium text-slate-600">Phone</label>
                            <p className="text-sm">{userDetails.phone}</p>
                          </div>
                        </div>
                      )}
                      {userDetails.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <label className="block text-xs font-medium text-slate-600">Address</label>
                            <p className="text-sm">{userDetails.address}</p>
                          </div>
                        </div>
                      )}
                      {userDetails.city && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <label className="block text-xs font-medium text-slate-600">City</label>
                            <p className="text-sm">{userDetails.city}</p>
                          </div>
                        </div>
                      )}
                      {userDetails.created_at && (
                        <div>
                          <label className="block text-xs font-medium text-slate-600">Member Since</label>
                          <p className="text-sm">{new Date(userDetails.created_at).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )} */}

                {/* Services List Preview */}
                {approvalData.services.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Services Preview</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {approvalData.services.slice(0, 3).map((service, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span>{service.service_name || `Service ${idx + 1}`}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getServiceStatusColor(service.status)}`}>
                            {service.status || 'pending'}
                          </span>
                        </div>
                      ))}
                      {approvalData.services.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{approvalData.services.length - 3} more services
                        </p>
                      )}
                    </div>
                  </div>
                )}

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
                    <span className="text-xl font-bold text-blue-600">KSh{approvalData.charge}</span>
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
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleViewServices}
                disabled={!approvalData.cartId || isLoading}
              >
                <FileText className="h-4 w-4 mr-2" /> 
                View All Services
              </Button>
              {processingServices.length > 0 && (
                <p className="text-xs text-yellow-600 text-center mt-2">
                  {processingServices.length} service{processingServices.length !== 1 ? 's are' : ' is'} pending processing
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
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                Supported formats: PNG, JPG, JPEG<br />
                Maximum file size: 5MB
              </p>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Old Password</label>
                <input
                  type="password"
                  placeholder="Enter old password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
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