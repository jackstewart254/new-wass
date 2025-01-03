import { apiConnection } from "../hooks/calls";

export const validateUser = async (instance, accounts) => {
  if (accounts.length === 0) {
    console.error("No accounts found");
    return { allow: false };
  }

  // Set the active account
  instance.setActiveAccount(accounts[0]);
  const account = instance.getActiveAccount();

  if (!account) {
    console.error("No active account");
    return { allow: false };
  }

  const response = await apiConnection(
    { email: account.username, name: account.name },
    "authenticate"
  );

  if (response?.allow === true) {
    return response;
  } else {
    return response;
  }
};
