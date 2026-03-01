// SAFE ACCOUNT FILTER FUNCTION

export const getEligibleAccounts = (customer, service) => {
  const accounts = customer?.accounts ?? [];

  if (!Array.isArray(accounts)) return [];

  return accounts.filter(
    (acc) => acc && acc.status === "ACTIVE"
  );
};