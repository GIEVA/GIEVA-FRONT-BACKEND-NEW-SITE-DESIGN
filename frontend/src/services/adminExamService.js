// services/adminExamService.js

import API from "./api";

export const getExamStats = async () => {
  const { data } = await API.get(
    "/admin/exam-registrations/stats"
  );
  return data;
};

export const getRegistrations = async (
  params
) => {
  const { data } = await API.get(
    "/admin/exam-registrations",
    { params }
  );

  return data;
};

export const getRegistrationById =
  async (id) => {
    const { data } =
      await API.get(
        `/admin/exam-registrations/${id}`
      );

    return data;
  };

export const updateRegistrationStatus =
  async (id, payload) => {
    const { data } =
      await API.patch(
        `/admin/exam-registrations/${id}/status`,
        payload
      );

    return data;
  };

export const assignRegistration =
  async (id) => {
    const { data } =
      await API.patch(
        `/admin/exam-registrations/${id}/assign`
      );

    return data;
  };

export const updateNotes =
  async (id, adminNotes) => {
    const { data } =
      await API.patch(
        `/admin/exam-registrations/${id}/notes`,
        {
          adminNotes,
        }
      );

    return data;
  };

export const addComment =
  async (id, comment) => {
    const { data } =
      await API.post(
        `/admin/exam-registrations/${id}/comments`,
        {
          comment,
        }
      );

    return data;
  };

export const resendEmail =
  async (id) => {
    const { data } =
      await API.post(
        `/admin/exam-registrations/${id}/resend-email`
      );

    return data;
  };

export const getPayments =
  async () => {
    const { data } =
      await API.get(
        "/admin/exam-registrations/payments/all"
      );

    return data;
  };

  export const getExamRegistrations = async (
  params = {}
) => {
  const { data } = await API.get(
    "/admin/exam-registrations",
    {
      params,
    }
  );

  return data;
};

export const updateExamStatus =
  async (id, payload) => {
    const { data } =
      await API.patch(
        `/admin/exam-registrations/${id}/status`,
        payload
      );

    return data;
  };

export const assignExamRegistration =
  async (id, processorId) => {
    const { data } =
      await API.patch(
        `/admin/exam-registrations/${id}/assign`,
        {
          processorId,
        }
      );

    return data;
  };

export const deleteExamRegistration =
  async (id) => {
    const { data } =
      await API.delete(
        `/admin/del/exam-registrations/${id}`
      );

    return data;
  };

export const resendExamEmail =
  async (id) => {
    const { data } =
      await API.post(
        `/admin/exam-registrations/${id}/resend-email`
      );

    return data;
  };
  
  export const getExamRegistrationById =
  async (id) => {
    const { data } =
      await API.get(
        `/admin/exam-registrations/${id}`
      );

    return data;
  };

  export const getExamPayments =
  async (params = {}) => {
    const { data } =
      await API.get(
        "/admin/exam-registrations/payments/all",
        {
          params,
        }
      );

    return data;
  };

export const getExamPaymentById =
  async (id) => {
    const { data } =
      await API.get(
        `/admin/exam-registrations/payments/${id}`
      );

    return data;
  };

  export const downloadExamReceipt =
  async (paymentId) => {

    const response =
      await API.get(
        `/admin/exam-payments/${paymentId}/receipt`,
        {
          responseType: "blob",
        }
      );

    const url =
      window.URL.createObjectURL(
        new Blob([
          response.data,
        ])
      );

    const link =
      document.createElement("a");

    link.href = url;

    link.setAttribute(
      "download",
      `exam-receipt-${paymentId}.pdf`
    );

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();
  };

  export const exportExamRegistrations =
  async () => {

    const response =
      await API.get(
        "/admin/exam-registrations/export",
        {
          responseType: "blob",
        }
      );

    const blob =
      new Blob(
        [response.data],
        {
          type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );

    const url =
      window.URL.createObjectURL(
        blob
      );

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `exam-registrations-${Date.now()}.xlsx`;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    window.URL.revokeObjectURL(
      url
    );

    return true;
  };