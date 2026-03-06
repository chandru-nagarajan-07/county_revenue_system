// ACCOUNT TYPE LABELS
export const ACCOUNT_TYPE_LABELS = {
  SB: "Savings Account",
  CA: "Current Account",
  FD: "Fixed Deposit",
  RD: "Recurring Deposit"
};


// SAFE ACCOUNT FILTER FUNCTION
export const getEligibleAccounts = (customer, service) => {
  const accounts = customer?.accounts ?? [];

  if (!Array.isArray(accounts)) return [];

  return accounts.filter(
    (acc) => acc && acc.status === "ACTIVE"
  );
};