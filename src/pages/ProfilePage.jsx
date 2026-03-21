import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, User, DollarSign, Calendar, FileText } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const approvalData = location.state?.approvalData;

  /* ================= DEBUG LOG ================= */
  useEffect(() => {
    console.log("Received approvalData:", approvalData);
  }, [approvalData]);

  /* ================= ACTIONS ================= */

  const handleApprove = () => {
    console.log('Approving:', approvalData);

    alert('Service approved successfully!');

    navigate('/dashboard', {
      state: {
        updatedApproval: {
          id: approvalData?.id,
          approved: true,
        },
      },
    });
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  /* ================= FALLBACK UI ================= */

  if (!approvalData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <p className="text-lg font-semibold">No profile data found</p>
          <p className="text-sm text-gray-500 mt-2">
            Please select a record from dashboard first.
          </p>

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

  /* ================= MAIN UI ================= */

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto w-full">

        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

          <div className="bg-blue-50 px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-blue-800 flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Profile
            </h2>
            <p className="text-sm text-blue-600 mt-1">
              Review the details and approve the service
            </p>
          </div>

          <div className="p-6 space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className="text-sm text-gray-500">Customer ID</label>
                <p className="text-lg font-semibold">
                  {approvalData.customerId}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Customer Name</label>
                <p className="text-lg font-semibold">
                  {approvalData.customerName}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Charge</label>
                <p className="text-lg font-semibold text-green-600">
                  ${approvalData.charge}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Service</label>
                <p className="text-lg font-semibold">
                  {approvalData.service}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-500">Date</label>
                <p className="text-lg font-semibold">
                  {approvalData.date}
                </p>
              </div>

            </div>

            <div className="flex gap-4 pt-4 border-t">

              <Button
                onClick={handleApprove}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Service
              </Button>

              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;