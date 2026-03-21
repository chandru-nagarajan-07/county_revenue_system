import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, User, DollarSign, Calendar, FileText } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const approvalData = location.state?.approvalData;

  // Redirect to dashboard if no data
  useEffect(() => {
    if (!approvalData) {
      navigate('/dashboard');
    }
  }, [approvalData, navigate]);

  // If no data, render nothing (redirect will happen in useEffect)
  if (!approvalData) {
    return null;
  }

  const handleApprove = () => {
    // Simulate API call
    console.log('Approving:', approvalData);
    navigate('/dashboard', {
      state: {
        updatedApproval: {
          id: approvalData.id,
          approved: true,
        },
      },
    });
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-blue-800 flex items-center gap-2">
              <User className="h-5 w-5" /> Customer Profile
            </h2>
            <p className="text-sm text-blue-600 mt-1">
              Review the details and approve the service
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <User className="h-4 w-4" /> Customer ID
                </label>
                <p className="text-lg font-semibold text-slate-800">
                  {approvalData.customerId}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <User className="h-4 w-4" /> Customer Name
                </label>
                <p className="text-lg font-semibold text-slate-800">
                  {approvalData.customerName}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <DollarSign className="h-4 w-4" /> Charge
                </label>
                <p className="text-lg font-semibold text-green-600">
                  ${approvalData.charge}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <FileText className="h-4 w-4" /> Service
                </label>
                <p className="text-lg font-semibold text-slate-800">
                  {approvalData.service}
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Date
                </label>
                <p className="text-lg font-semibold text-slate-800">
                  {approvalData.date}
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button
                onClick={handleApprove}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Approve Service
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