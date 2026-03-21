import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, QrCode, XCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QRScannerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedApproval = location.state?.approval; // the approval item to be processed

  const [scanResult, setScanResult] = useState(null);
  const [showApprovalDetails, setShowApprovalDetails] = useState(false);
  const [approvalData, setApprovalData] = useState({
    customerId: '',
    customerName: '',
    charge: '',
    service: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Initialize scanner when component mounts
  useEffect(() => {
    if (!selectedApproval) {
      // If no approval was passed, go back
      navigate('/dashboard');
      return;
    }

    const scanner = new Html5QrcodeScanner('qr-reader-scanner', { fps: 10, qrbox: 250 }, false);
    scanner.render(handleScan, handleError);

    return () => {
      scanner.clear();
    };
  }, [selectedApproval, navigate]);

  const handleScan = (data) => {
    if (data && !scanResult) {
      setScanResult(data);
      // Simulate fetching customer data from QR code (replace with real API call)
      const mockCustomerData = {
        customerId: 'CUST12345',
        customerName: 'John Doe',
        charge: selectedApproval?.serviceCharge?.toString() || '25.00',
        service: selectedApproval?.service || 'Wire Transfer',
        date: new Date().toISOString().split('T')[0],
      };
      setApprovalData(mockCustomerData);
      setShowApprovalDetails(true);
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  const handleApprove = async () => {
    // Here you would call your API to update the approval status
    // For now, we simulate success
    alert('Service approved successfully!');
    // Navigate back to dashboard, optionally with a refresh flag
    navigate('/dashboard', { state: { refreshApprovals: true } });
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (!selectedApproval) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-8">
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

          {!showApprovalDetails ? (
            <>
              <div id="qr-reader-scanner" className="w-full max-w-sm mx-auto" />
              <p className="text-center text-sm text-slate-500 mt-4">
                Position the QR code within the frame to scan.
              </p>
            </>
          ) : (
            <div className="space-y-4">
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
    </div>
  );
};

export default QRScannerPage;