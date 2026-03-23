import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  ArrowLeft,
  QrCode,
  XCircle,
  CheckCircle,
  KeyRound,
  X,
  User,
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

  const [approvalData, setApprovalData] = useState({
    customerId: '',
    customerName: '',
    charge: serviceData?.charge || '0.00',
    service: serviceData?.service || 'Service Approval',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-reader-scanner', { fps: 10, qrbox: 250 }, false);
    scanner.render(handleScan, handleError);

    return () => {
      clearTimeout(timeout);
      if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, []);

  const handleScan = (data) => {
    if (data && !scanResult) {
      setScanResult(data);
      const mockCustomerData = {
        customerId: 'CUST12345',
        customerName: 'John Doe',
        charge: approvalData.charge,
        service: approvalData.service,
        date: approvalData.date,
      };
      setApprovalData(mockCustomerData);
      setShowApprovalDetails(true);
    }
  };

  /* ================= ACTIONS ================= */

  const handleApprove = async () => {
    // Option 2: change this to navigate to profile if you want the approve button to also go to profile
    // navigate('/profile');
    alert('Service approved successfully!');
    navigate('/dashboard');
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

  /* ================= UI ================= */

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
              <h2 className="text-xl font-semibold">Scan Customer QR Code</h2>
            </div>

            {/* QR Scanner (always visible) */}
            <div id="qr-reader-scanner" className="w-full max-w-sm mx-auto" />
            <p className="text-center text-sm text-slate-500 mt-4">
              Position the QR code within the frame to scan.
            </p>

            {/* ===== PROFILE BUTTON - ALWAYS VISIBLE ===== */}
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('/profilepage')}
                className=""
              >
                <div className="" /> Approve
              </Button>
            </div>
            {/* ========================================== */}

            {/* Show approval details only after scanning */}
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

                <div className="flex gap-3 mt-6">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve Service
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowApprovalDetails(false)}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Reset Password Modal (unchanged) */}
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