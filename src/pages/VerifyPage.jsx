import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const VerifyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get full API response
  const stateData = location.state?.userData;
  const savedData = JSON.parse(localStorage.getItem("verifiedUser"));
  const data = stateData || savedData;

  useEffect(() => {
    if (stateData) {
      localStorage.setItem("verifiedUser", JSON.stringify(stateData));
    }
  }, [stateData]);

  useEffect(() => {
    if (!data) {
      navigate("/");
    }
  }, [data, navigate]);

  if (!data) return null;

  const user = data.user_basic_info;
  const accounts = data.accounts || [];

  const handleChangeCustomer = () => {
    localStorage.removeItem("verifiedUser");
    navigate("/");
  };

  const handleProceed = () => {
    navigate("/dashboard", { state: { userData: data } });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center p-4 bg-[#f4f6f8]"
    >
      <div className="w-full max-w-md bg-green-50 rounded-xl shadow-sm border border-green-200 overflow-hidden">

        {/* Header */}
        <div className="bg-green-100 p-6 border-b border-green-200 text-center">
          <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800">
            Customer Verification
          </h2>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-green-200 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium text-gray-800">
              {user?.name}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Customer ID:</span>
            <span className="font-medium text-gray-800">
              {user?.user_ID}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Phone:</span>
            <span className="font-medium text-gray-800">
              {user?.phone}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium text-gray-800">
              {user?.email}
            </span>
          </div>
        </div>

        {/* Accounts Section */}
        <div className="p-4 space-y-4">
          <h3 className="font-semibold text-sm text-gray-700">
            Accounts ({accounts.length})
          </h3>

          {accounts.length > 0 ? (
            accounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
              >
                {/* Row 1 */}
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold text-gray-800">
                    {acc.account_number}
                  </p>

                  <p className="text-sm font-bold text-gray-900">
                    Ksh {Number(acc.balance).toLocaleString()}
                  </p>
                </div>

                {/* Row 2 */}
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    {acc.account_type_name || "Savings Account"}
                  </p>

                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      acc.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : acc.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {acc.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center">
              No accounts available
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="p-4 border-t border-green-200 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={handleChangeCustomer}
          >
            Change Customer
          </Button>

          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleProceed}
          >
            Proceed
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default VerifyPage;