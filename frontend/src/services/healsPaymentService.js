import API from "./api";

// Start Paystack checkout for a saved draft application
export const startHealsCheckout = (applicationId) =>
  API.post("/api/heals-payments/checkout", { applicationId }).then((r) => r.data);

// Called from the payment callback page
export const verifyHealsPayment = (reference) =>
  API.post("/api/heals-payments/verify", { reference }).then((r) => r.data);

export const getMyHealsPayments = () =>
  API.get("/api/heals-payments/my-payments").then((r) => r.data);

export const getHealsPaymentById = (id) =>
  API.get(`/api/heals-payments/${id}`).then((r) => r.data);