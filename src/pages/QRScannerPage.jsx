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

  const [approvalData, setApprovalData] = useState({
    customerId: '',
    customerName: '',
    charge: serviceData?.charge || '0.00',
    service: serviceData?.service || 'Service Approval',
    date: new Date().toISOString().split('T')[0],
  });

  const qrCodeRegionRef = useRef(null);
  const html5QrCodeRef = useRef(null);

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

  const handleScanSuccess = async (decodedText) => {
    if (isScanning) return;
    setIsScanning(true);
    setScanResult(decodedText);
    const mockCustomerData = {
      customerId: 'CUST12345',
      customerName: 'John Doe',
      charge: approvalData.charge,
      service: approvalData.service,
      date: approvalData.date,
    };
    setApprovalData(mockCustomerData);
    setShowApprovalDetails(true);
    await stopCamera();
    setIsScanning(false);
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
    if (!approvalData.customerId) {
      alert('Please scan a QR code first.');
      return;
    }
    alert('Service approved successfully!');
    navigate('/profile', {
      state: {
        customerId: approvalData.customerId,
        customerName: approvalData.customerName,
      },
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
    alert('Password updated successfully!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowResetModal(false);
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

            {!cameraActive && !showApprovalDetails && (
              <p className="text-center text-sm text-slate-500 mt-4">
                Click "Scan QR Code" to start.
              </p>
            )}

            {showApprovalDetails && (
              <div className="mt-6 space-y-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Customer ID</label>
                  <p className="mt-1 text-lg font-semibold">{approvalData.customerId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Customer Name</label>
                  <p className="mt-1 text-lg">{approvalData.customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Service</label>
                  <p className="mt-1 text-lg">{approvalData.service}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Charge</label>
                  <p className="mt-1 text-lg">${approvalData.charge}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Date</label>
                  <p className="mt-1 text-lg">{approvalData.date}</p>
                </div>
              </div>
            )}

            <div className="mt-6">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={!approvalData.customerId}
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Approve Service
              </Button>
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
