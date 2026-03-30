import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, User, DollarSign, Calendar, FileText, RefreshCw } from 'lucide-react';
import { DashboardHeader } from '@/components/banking/DashboardHeader';

const ProfilePage = () => {
  const navigate = useNavigate();

  // Mock data for pending approvals
  const initialPendingApprovals = [
    {
      id: 1,
      customerId: 'CUST12345',
      customerName: 'John Doe',
      service: 'Wire Transfer',
      charge: '150.00',
      date: '2025-03-25',
    },
    {
      id: 2,
      customerId: 'CUST67890',
      customerName: 'Jane Smith',
      service: 'Account Opening',
      charge: '0.00',
      date: '2025-03-26',
    },
    {
      id: 3,
      customerId: 'CUST11223',
      customerName: 'Robert Johnson',
      service: 'Loan Application',
      charge: '250.00',
      date: '2025-03-24',
    },
  ];

  const [pendingApprovals, setPendingApprovals] = useState(initialPendingApprovals);

  // Header state
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);

  const handleApprove = (id) => {
    // In a real app, you'd call an API here
    console.log(`Approving approval with id ${id}`);
    setPendingApprovals((prev) => prev.filter((item) => item.id !== id));
    alert(`Approval for ID ${id} has been approved.`);
  };

  const handleReject = (id) => {
    console.log(`Rejecting approval with id ${id}`);
    setPendingApprovals((prev) => prev.filter((item) => item.id !== id));
    alert(`Approval for ID ${id} has been rejected.`);
  };

  const handleBack = () => {
    navigate('/dash');
  };

  const handleResetPassword = () => {
    setNavDropdownOpen(false);
    alert('Reset password functionality would go here.');
  };

  const handleLogout = () => {
    setNavDropdownOpen(false);
    navigate('/');
  };

  // Helper to refresh (in case you want to reload from API)
  const handleRefresh = () => {
    // In a real app, fetch from API again
    alert('Refreshing list...');
    // For demo, we just reset to initial list
    setPendingApprovals(initialPendingApprovals);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <DashboardHeader
        customerName="Teller"
        isDropdownOpen={navDropdownOpen}
        setIsDropdownOpen={setNavDropdownOpen}
        onResetPassword={handleResetPassword}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-blue-800 flex items-center gap-2">
                <User className="h-5 w-5" /> Service Cart for John
              </h2>
              {/* <p className="text-sm text-blue-600 mt-1">
                Review and take action on customer requests
              </p> */}
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No pending approvals at the moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-gray-600">Customer ID</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-600">Customer Name</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-600">Service</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-600">Charge</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-600">Date</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingApprovals.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium">{item.customerId}</td>
                        <td className="px-6 py-4">{item.customerName}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-gray-400" />
                            {item.service}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-green-600 font-medium">
                          ${item.charge}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {item.date}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              onClick={() => handleApprove(item.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              onClick={() => handleReject(item.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;