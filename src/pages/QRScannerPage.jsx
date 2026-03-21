import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, QrCode, XCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QRScannerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedApproval = location.state?.approval;

  const [scanResult, setScanResult] = useState(null);
  const [showApprovalDetails, setShowApprovalDetails] = useState(false);

  const [approvalData, setApprovalData] = useState({
    customerId: '',
    customerName: '',
    charge: '',
    service: '',
    date: new Date().toISOString().split('T')[0],
  });

  /* ================= SCANNER ================= */
  useEffect(() => {
    if (!selectedApproval) return;

    let html5QrCode;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("qr-reader-scanner");

        const devices = await Html5Qrcode.getCameras();

        if (devices && devices.length) {
          const cameraId = devices[0].id;

          await html5QrCode.start(
            cameraId,
            {
              fps: 10,
              qrbox: 250,
            },
            (decodedText) => {
              if (!scanResult) {
                setScanResult(decodedText);

                const mockCustomerData = {
                  customerId: 'CUST12345',
                  customerName: 'John Doe',
                  charge: selectedApproval?.serviceCharge?.toString() || '25.00',
                  service: selectedApproval?.service || 'Wire Transfer',
                  date: new Date().toISOString().split('T')[0],
                };

                setApprovalData(mockCustomerData);
                setShowApprovalDetails(true);

                // Stop scanner after success
                html5QrCode.stop().catch(() => {});
              }
            },
            () => {}
          );
        }
      } catch (err) {
        console.error("Scanner error:", err);
      }
    };

    // small delay to ensure DOM ready
    const timeout = setTimeout(startScanner, 300);

    return () => {
      clearTimeout(timeout);
      if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [selectedApproval, scanResult]);

  /* ================= ACTIONS ================= */

  const handleApprove = () => {
    alert('Service approved successfully!');
    navigate('/dashboard', { state: { refreshApprovals: true } });
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  /* ================= FALLBACK ================= */

  if (!selectedApproval) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="text-lg font-semibold">No approval selected</p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="mt-4"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-md mx-auto w-full">

        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="bg-white rounded-xl shadow-sm border p-6">

          <div className="flex items-center gap-2 mb-4">
            <QrCode className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">
              Scan Customer QR Code
            </h2>
          </div>

          {!showApprovalDetails ? (
            <>
              {/* 🔥 IMPORTANT: height added */}
              <div
                id="qr-reader-scanner"
                className="w-full max-w-sm mx-auto min-h-[300px]"
              />

              <p className="text-center text-sm text-slate-500 mt-4">
                Position the QR code within the frame to scan.
              </p>
            </>
          ) : (
            <div className="space-y-4">

              <div>
                <label className="text-sm text-gray-500">Customer ID</label>
                <p className="text-lg font-semibold">{approvalData.customerId}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Customer Name</label>
                <p className="text-lg">{approvalData.customerName}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Service</label>
                <p className="text-lg">{approvalData.service}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Charge</label>
                <p className="text-lg">${approvalData.charge}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Date</label>
                <p className="text-lg">{approvalData.date}</p>
              </div>

              <div className="flex gap-3 mt-6">

                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Service
                </Button>

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowApprovalDetails(false);
                    setScanResult(null);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
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