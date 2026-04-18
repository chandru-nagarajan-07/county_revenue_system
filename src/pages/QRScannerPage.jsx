import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ArrowLeft,
  QrCode,
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
  Wallet,
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
  const [pendingCartData, setPendingCartData] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userData, setUserData] = useState(null);
  
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

  const API_BASE_URL = 'http://localhost:8000/api';

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
      
      const data = await response.json();
      console.log('Fetched user details from local API:', data);
      
      const userInfo = data.serializer;
      const accountInfo = data.acoount_data;
      
      const combinedUserData = {
        ...userInfo,
        account_number: accountInfo?.account_number || 'N/A',
        account_type: accountInfo?.account_category || 'N/A',
        account_balance: accountInfo?.balance || '0.00',
        account_status: accountInfo?.status || 'N/A',
      };
      
      setUserDetails(combinedUserData);
      return combinedUserData;
      
    } catch (err) {
      console.error('Error fetching user details:', err);
      return null;
    } finally {
      setIsLoadingUserDetails(false);
    }
  };

  const sendOtp = async () => {
    if (!userEmail) {
      setOtpError('User email not found. Please try scanning again.');
      return;
    }
    
    setOtpLoading(true);
    setOtpError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/send-otp/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });
      
      const data = await response.json();
      console.log('Send OTP response:', data);
      
      if (response.ok) {
        setOtpSent(true);
        setOtpError('');
        console.log('OTP sent successfully to:', userEmail);
      } else {
        setOtpError(data.message || data.error || 'Failed to send OTP. Please try again.');
      }
      
    } catch (err) {
      console.error('Send OTP error:', err);
      setOtpError('Network error. Could not send OTP. Please check your connection.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    // Allow only single digit
    if (value.length > 1) return;
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedDigits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (pastedDigits) {
      const newOtp = [...otpCode];
      for (let i = 0; i < pastedDigits.length; i++) {
        newOtp[i] = pastedDigits[i];
      }
      setOtpCode(newOtp);
      
      // Focus on the next empty input or last filled
      const nextIndex = Math.min(pastedDigits.length, 5);
      if (nextIndex <= 5) {
        inputRefs.current[nextIndex]?.focus();
      }
    }
  };

  const verifyOtp = async () => {
    const otpValue = otpCode.join('');
    console.log('Verifying OTP:', otpValue, 'for email:', userEmail);
    
    if (otpValue.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setOtpLoading(true);
    setOtpError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/otp-verification/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          otp: otpValue,
        }),
      });
      
      const data = await response.json();
      console.log('OTP verification response:', data);
      
      if (response.ok) {
        if (userData) {
          sessionStorage.setItem("customerData", JSON.stringify(userData));
        }
        localStorage.setItem("verifiedCustomer", JSON.stringify(data));
        
        setShowOtpModal(false);
        resetOtpState();
        
        if (pendingCartData) {
          displayCartData(pendingCartData);
          setPendingCartData(null);
        }
      } else {
        setOtpError(data.message || data.error || 'Invalid OTP. Please try again.');
      }
      
    } catch (err) {
      console.error('OTP verification error:', err);
      setOtpError('Network error. Could not verify OTP. Please check your connection.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = () => {
    setOtpSent(false);
    setOtpCode(['', '', '', '', '', '']);
    sendOtp();
  };

  const displayCartData = (data) => {
    if (data) {
      const totalCharge = data.total_services * 10;
      
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
      
      const processing = data.services.filter(s => 
        s.status === 'pending' || s.status === 'processing'
      );
      setProcessingServices(processing);
      
      setShowApprovalDetails(true);
      setError(null);
    }
  };

  const fetchServiceCart = async (cartId) => {
    setIsLoading(true);
    setError(null);
    setUserDetails(null);
    
    try {
      const teller_id = JSON.parse(sessionStorage.getItem("userData1"))?.teller_id;
      
      const response = await fetch(`${API_BASE_URL}/service_cart/${cartId}/${teller_id || ''}/`, {
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
        const userDataFromLocal = await fetchUserByMobile(data.mobile_number);
        
        if (userDataFromLocal && userDataFromLocal.email) {
          setUserEmail(userDataFromLocal.email);
          setUserData(userDataFromLocal);
          setPendingCartData(data);
          setShowOtpModal(true);
          setOtpSent(false);
          setOtpCode(['', '', '', '', '', '']);
        } else {
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

  const resetOtpState = () => {
    setOtpCode(['', '', '', '', '', '']);
    setOtpSent(false);
    setOtpError('');
    setPendingCartData(null);
    setUserEmail('');
    setUserData(null);
  };

  useEffect(() => {
    if (showOtpModal && userEmail && !otpSent && !otpLoading) {
      sendOtp();
    }
  }, [showOtpModal, userEmail, otpSent, otpLoading]);

  const handleScanSuccess = async (decodedText) => {
    if (isScanning) return;
    setIsScanning(true);
    setScanResult(decodedText);
    setError(null);
    
    try {
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
      } catch (parseError) {
        qrData = { cart_id: decodedText };
      }
      
      const cartId = qrData.cart_id || qrData.cartId || decodedText;
      
      if (!cartId) {
        throw new Error('No cart ID found in QR code');
      }
      
      console.log('Extracted cart ID:', cartId);
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
          errorMsg += 'Please check your device settings.';
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
    console.log('Navigating to profile page with data:',userDetails)
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

  const formatAccountType = (type) => {
    if (!type || type === 'N/A') return 'N/A';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
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
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Customer Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-blue-100">
                    <div>
                      <label className="block text-xs font-medium text-slate-600">Cart ID</label>
                      <p className="text-sm font-semibold text-gray-800">{approvalData.cartId}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600">Customer Name</label>
                      <p className="text-sm text-gray-800">{approvalData.customerName}</p>
                    </div>
                  </div>
                  
                  {userDetails && (
                    <div className="mb-3 pb-3 border-b border-blue-100">
                      <div className="flex items-center gap-1 mb-2">
                        <Wallet className="h-4 w-4 text-blue-600" />
                        <label className="text-xs font-semibold text-blue-700">Account Details</label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500">Account Number</label>
                          <p className="text-sm font-mono font-semibold text-gray-800">
                            {userDetails.account_number}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500">Account Type</label>
                          <p className="text-sm font-semibold text-gray-800">
                            {formatAccountType(userDetails.account_type)}
                          </p>
                        </div>
                        {/* <div>
                          <label className="block text-xs text-slate-500">Account Balance</label>
                          <p className="text-sm font-semibold text-green-600">
                            KSh {parseFloat(userDetails.account_balance).toLocaleString()}
                          </p>
                        </div> */}
                        <div>
                          <label className="block text-xs text-slate-500">Account Status</label>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            userDetails.account_status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {userDetails.account_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Mobile Number</label>
                    <p className="text-sm text-gray-800">{approvalData.mobileNumber || 'N/A'}</p>
                  </div>
                  
                  {userDetails?.email && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-slate-600">Email</label>
                      <p className="text-sm text-gray-800">{userDetails.email}</p>
                    </div>
                  )}
                </div>

                {approvalData.services.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-blue-600" />
                      Services Preview
                    </h3>
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
                    <span className="text-xl font-bold text-blue-600">KSh {approvalData.charge}</span>
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

      {/* OTP Verification Modal - Fixed typing */}
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
              <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                {otpCode.map((value, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={value}
                    onChange={(e) => handleOtpChange(e, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onFocus={(e) => e.target.select()}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className="w-12 h-14 text-center text-xl font-semibold border-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                  />
                ))}
              </div>
              
              {otpError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600 text-center">{otpError}</p>
                </div>
              )}
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
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
                  onClick={handleResendOtp}
                  disabled={otpLoading}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                >
                  Resend OTP
                </button>
              </div>
              
              <div className="text-center text-xs text-gray-400">
                <p>Can't find OTP? Check your spam folder</p>
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
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handlePasswordUpdate}>
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