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

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [pendingCartData, setPendingCartData] = useState(null); // Store cart data until OTP verified
  const [userEmail, setUserEmail] = useState(''); // Will be fetched from backend using mobile number
  const [userData, setUserData] = useState(null); // Store user data from local API
  
  const [scanResult, setScanResult] = useState(null);
  const [showApprovalDetails, setShowApprovalDetails] = useState(false);
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);
  const [error, setError] = useState(null);
  const [processingServices, setProcessingServices] = useState([]);
  const [userDetails, setUserDetails] = useState(null);

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

  // API base URL
  const API_BASE_URL = 'http://localhost:8000/api';

  // Function to fetch user details by mobile number from local API
  const fetchUserByMobile = async (mobileNumber) => {
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
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`No user found with mobile number "${mobileNumber}"`);
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const userData = await response.json();
      console.log('Fetched user details from local API:', userData);
      setUserDetails(userData);
      return userData;
      
    } catch (err) {
      console.error('Error fetching user details:', err);
      return null;
    } finally {
      setIsLoadingUserDetails(false);
    }
  };

  // Send OTP function using local API
  const sendOtp = async () => {
    if (!userEmail) {
      setOtpError('User email not found. Please try scanning again.');
      return;
    }
    
    setOtpLoading(true);
    setOtpError('');
    
    try {
      // First, fetch user data from your local API (already have userData from fetchUserByMobile)
      // If userData is not available, we should have it from previous step
      if (!userData) {
        throw new Error('User data not available. Please try scanning again.');
      }

      // Send OTP through your backend
      const response = await fetch(`${API_BASE_URL}/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return;
      }
      
      setOtpSent(true);
      setOtpError('');
      console.log('OTP sent successfully to:', userEmail);
      
    } catch (err) {
      setOtpError(err.message || 'Could not send OTP. Please check your email address.');
      console.error('Send OTP error:', err);
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otpCode];
    newOtp[index] = element.value;
    setOtpCode(newOtp);

    if (element.value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle OTP key down for backspace
  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Verify OTP function using local API
  const verifyOtp = async () => {
    const otpValue = otpCode.join('');
    
    if (otpValue.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setOtpLoading(true);
    setOtpError('');
    
    try {
      // Get user data if not already available
      let localUserData = userData;
      if (!localUserData && pendingCartData?.mobile_number) {
        localUserData = await fetchUserByMobile(pendingCartData.mobile_number);
        if (localUserData) {
          setUserData(localUserData);
        }
      }
      
      if (!localUserData) {
        throw new Error('User data not found. Please try scanning again.');
      }
      
      // Verify OTP with your backend
      const response = await fetch(`${API_BASE_URL}/otp-verification/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          otp: otpValue,
          userData1: localUserData // Send the local user data to backend
        }),
      });
      
      const data = await response.json();
      console.log('OTP verification response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP. Please try again.');
      }
      
      // Store verification data
      // localStorage.setItem("verifiedUser", JSON.stringify(data));
      // sessionStorage.setItem("userData1", JSON.stringify(localUserData));
      sessionStorage.setItem("customerData", JSON.stringify(localUserData));
      localStorage.setItem("verifiedCustomer", JSON.stringify(data));

      // OTP verified successfully - now show the cart data
      setShowOtpModal(false);
      resetOtpState();
      
      // Display the cart data that was stored
      if (pendingCartData) {
        displayCartData(pendingCartData);
        setPendingCartData(null);
      }
      
    } catch (err) {
      setOtpError(err.message || 'Verification failed. Please check your OTP.');
      console.error('OTP verification error:', err);
    } finally {
      setOtpLoading(false);
    }
  };

  // Function to display cart data after OTP verification
  const displayCartData = (data) => {
    if (data) {
      // Calculate total charge
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
      
      // Set processing services
      const processing = data.services.filter(s => 
        s.status === 'pending' || s.status === 'processing'
      );
      setProcessingServices(processing);
      
      setShowApprovalDetails(true);
      setError(null);
    }
  };

  // Function to fetch service cart data from backend
  const fetchServiceCart = async (cartId) => {
    setIsLoading(true);
    setError(null);
    setUserDetails(null);
    const teller_id = JSON.parse(sessionStorage.getItem("userData1"))?.teller_id;
    try {
      const response = await fetch(`${API_BASE_URL}/service_cart/${cartId}/${teller_id}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
      
      if (data && data.mobile_number) {
        // Step 1: Get user details from local API using mobile number
        const userDataFromLocal = await fetchUserByMobile(data.mobile_number);
        
        if (userDataFromLocal && userDataFromLocal.email) {
          // Step 2: Store cart data and user data, then show OTP modal
          setUserEmail(userDataFromLocal.email);
          setUserData(userDataFromLocal); // Store user data for OTP verification
          setPendingCartData(data);
          setShowOtpModal(true);
          setOtpSent(false); // Reset OTP sent status to trigger auto-send
          setOtpCode(['', '', '', '', '', '']); // Reset OTP input
        } else {
          // No email found for this mobile number
          setError('No user account found for this mobile number. Please contact support.');
          setShowApprovalDetails(false);
        }
      } else {
        throw new Error('Invalid cart data: Mobile number not found');
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

  // Reset OTP state
  const resetOtpState = () => {
    setOtpCode(['', '', '', '', '', '']);
    setOtpSent(false);
    setOtpError('');
    setPendingCartData(null);
    setUserEmail('');
    setUserData(null);
  };

  // Auto-send OTP when modal opens
  useEffect(() => {
    if (showOtpModal && userEmail && userData && !otpSent && !otpLoading) {
      sendOtp();
    }
  }, [showOtpModal, userEmail, userData, otpSent, otpLoading]);

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
    // Only log meaningful errors
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

    const cameraAvailable = await checkCameraAvailability();
    if (!cameraAvailable) return;

    await stopCamera();
    await new Promise(resolve => setTimeout(resolve, 500));
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
          formatsToSupport: ['QR_CODE'],
        },
        handleScanSuccess,
        handleScanFailure
      );
      setCameraActive(true);
    } catch (err) {
      console.error(`Failed to start camera:`, err);
      if (facingMode === 'environment') {
        await startCamera('user');
      } else {
        let errorMsg = 'Could not access camera. ';
        if (err.name === 'NotReadableError') {
          errorMsg += 'The camera may be in use by another application.';
        } else if (err.name === 'NotAllowedError') {
          errorMsg += 'Please grant camera permissions.';
        } else if (err.name === 'NotFoundError') {
          errorMsg += 'No camera found on this device.';
        } else {
          errorMsg += 'Please check your device settings and ensure you are using HTTPS.';
        }
        alert(errorMsg);
        setCameraActive(false);
        html5QrCodeRef.current = null;
        container.classList.add('hidden');
      }
    }
  };

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

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Please upload an image smaller than 5MB.');
      event.target.value = '';
      return;
    }

    try {
      await stopCamera();
      setIsLoading(true);
      setError(null);

      const tempContainer = document.createElement('div');
      tempContainer.id = 'qr-reader-temp-' + Date.now();
      tempContainer.style.display = 'none';
      document.body.appendChild(tempContainer);

      const tempScanner = new Html5Qrcode(tempContainer.id);
      
      try {
        const decodedText = await tempScanner.scanFile(file, {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: ['QR_CODE'],
        });
        
        await tempScanner.clear();
        document.body.removeChild(tempContainer);
        await handleScanSuccess(decodedText);
        
      } catch (err) {
        console.error('QR scan from file failed:', err);
        let errorMessage = 'Could not read QR code from image. ';
        
        if (err.message?.includes('No MultiFormat Readers were able to detect') || 
            err.name === 'NotFoundException') {
          errorMessage += 'No QR code found in the image. Please ensure the QR code is clear and well-lit.';
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
      event.target.value = '';
    }
  };

  const retryScan = () => {
    setError(null);
    setScanResult(null);
    setShowApprovalDetails(false);
    setUserDetails(null);
    if (cameraActive) {
      stopCamera();
      setTimeout(() => startCamera(), 500);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleViewServices = () => {
    if (!approvalData.cartId) {
      alert('Please scan a QR code first.');
      return;
    }
    
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
        userDetails: userDetails
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

  const completedServicesCount = approvalData.services.filter(s => s.status === 'completed').length;
  const pendingServicesCount = approvalData.services.filter(s => s.status === 'pending').length;
  const processingServicesCount = approvalData.services.filter(s => s.status === 'processing').length;
  const progressPercentage = (completedServicesCount / approvalData.totalServices) * 100 || 0;

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

      {/* OTP Verification Modal - With 6-digit input fields */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setShowOtpModal(false);
                resetOtpState();
                retryScan();
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Verify Your Identity</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              We've sent a one-time password (OTP) to <strong>{userEmail}</strong>
            </p>
            
            <div className="space-y-4">
              <div className="flex justify-center gap-3">
                {otpCode.map((value, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={value}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onFocus={(e) => e.target.select()}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className="w-12 h-14 text-center text-xl font-semibold border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </div>
              
              {otpError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{otpError}</p>
                </div>
              )}
              
              <Button 
                className="w-full" 
                onClick={verifyOtp}
                disabled={otpLoading || otpCode.join('').length !== 6}
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </Button>
              
              <div className="text-center">
                <button
                  onClick={sendOtp}
                  disabled={otpLoading}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                >
                  Resend OTP
                </button>
              </div>
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