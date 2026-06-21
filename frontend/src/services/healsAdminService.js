import API from "./api";



// ======================================================
// GET APPLICATIONS
// ======================================================

export const getAllHealsApplications =
  async (params = {}) => {

    const res =
      await API.get(
        "/api/admin/heals/applications",
        { params }
      );

    return res.data;
  };



// ======================================================
// GET SINGLE APPLICATION
// ======================================================

export const getHealsAdminApplicationById =
  async (id) => {

    const res =
      await API.get(
        `/api/admin/heals/applications/${id}`
      );

    return res.data;
  };



// ======================================================
// VERIFY DOCUMENTS
// ======================================================

export const verifyApplicationDocuments =
  async (id, data) => {

    const res =
      await API.put(
        `/api/admin/heals/applications/${id}/verify-documents`,
        data
      );

    return res.data;
  };



// ======================================================
// UPDATE STATUS
// ======================================================

export const updateHealsApplicationStatus =
  async (id, data) => {

    const res =
      await API.put(
        `/api/admin/heals/applications/${id}/status`,
        data
      );

    return res.data;
  };



// ======================================================
// SEND PAYMENT REQUEST
// ======================================================

export const sendHealsPaymentRequest =
  async (id, data) => {

    const res =
      await API.post(
        `/api/admin/heals/${id}/send-payment-request`,
        data
      );

    return res.data;
  };



// ======================================================
// START PROCESSING
// ======================================================

export const startHealsProcessing =
  async (id) => {

    const res =
      await API.put(
        `/api/admin/heals/applications/${id}/start-processing`
      );

    return res.data;
  };



// ======================================================
// COMPLETE APPLICATION
// ======================================================

export const completeHealsApplication =
  async (id) => {

    const res =
      await API.put(
        `/api/admin/heals/applications/${id}/complete`
      );

    return res.data;
  };



// ======================================================
// GET PAYMENTS
// ======================================================

export const getHealsApplicationPayments =
  async (id) => {

    const res =
      await API.get(
        `/api/admin/heals/applications/${id}/payments`
      );

    return res.data;
  };