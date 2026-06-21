import API from "./api";

/**
 * ==================================
 * CREATE EXAM REGISTRATION
 * ==================================
 */
export const createRegistration = async (
  examType,
  data
) => {
  const response = await API.post(
    "api/exam-registrations",
    {
      examType,
      data,
    }
  );

  return response.data;
};

/**
 * ==================================
 * GET MY REGISTRATIONS
 * ==================================
 */
export const getMyRegistrations = async (
  page = 1,
  limit = 20
) => {
  const response = await API.get(
    "api/exam-registrations/my",
    {
      params: {
        page,
        limit,
      },
    }
  );

  return response.data;
};

/**
 * ==================================
 * GET REGISTRATION BY ID
 * ==================================
 */
export const getRegistrationById =
  async (id) => {
    const response =
      await API.get(
        `api/exam-registrations/${id}`
      );

    return response.data;
  };

/**
 * ==================================
 * DELETE REGISTRATION
 * ==================================
 */
export const deleteRegistration =
  async (id) => {
    const response =
      await API.delete(
        `api/exam-registrations/${id}`
      );

    return response.data;
  };

/**
 * ==================================
 * INITIALIZE PAYMENT
 * ==================================
 */
export const initializeExamPayment =
  async (registrationId) => {
    const response =
      await API.post(
        "api/exam-payments/initialize",
        {
          registrationId,
        }
      );

    return response.data;
  };

/**
 * ==================================
 * VERIFY PAYMENT
 * ==================================
 */
export const verifyExamPayment =
  async (reference) => {
    const response =
      await API.post(
        "api/exam-payments/verify",
        {
          reference,
        }
      );

    return response.data;
  };

/**
 * ==================================
 * DOWNLOAD RECEIPT
 * ==================================
 */
export const downloadReceipt =
  async (paymentId) => {
    const response =
      await API.get(
        `api/exam-payments/receipt/${paymentId}`,
        {
          responseType: "blob",
        }
      );

    return response.data;
  };

/**
 * ==================================
 * HELPER:
 * DOWNLOAD RECEIPT TO DEVICE
 * ==================================
 */
export const downloadReceiptFile =
  async (
    paymentId,
    filename =
      "exam-receipt.pdf"
  ) => {
    const blob =
      await downloadReceipt(
        paymentId
      );

    const url =
      window.URL.createObjectURL(
        blob
      );

    const link =
      document.createElement("a");

    link.href = url;

    link.download = filename;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    window.URL.revokeObjectURL(
      url
    );
  };