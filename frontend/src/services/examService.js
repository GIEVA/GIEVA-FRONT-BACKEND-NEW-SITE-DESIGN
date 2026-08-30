// services/examService.js  (combined reg + payment)
// FIXES:
//   1. getRegistrationById — guards against undefined id before calling API
//   2. getMyRegistrations — correct API path with leading slash
//   3. downloadReceiptFile — was navigating to React route; now calls API
//   4. getReceiptData — new function for showing receipt inline (modal/page)
//   5. All paths have leading "/" for consistency with axios baseURL

import API from "./api";

// ════════════════════════════════════════════════════════════
// EXAM REGISTRATION
// ════════════════════════════════════════════════════════════

/**
 * Create a new exam registration.
 * Returns { registration, registrationId } — always use registrationId
 * to avoid reading .id from a potentially undefined object.
 */
export const createRegistration = async (examType, data) => {
  const res = await API.post("/api/exam-registrations", { examType, data });
  return res.data;
  // res.data = { registration, registrationId, message, isExisting? }
};

/**
 * Get all registrations for the logged-in student.
 */
export const getMyRegistrations = async (page = 1, limit = 20) => {
  const res = await API.get("/api/exam-registrations/my", {
    params: { page, limit },
  });
  return res.data;
  // res.data = { registrations, total, currentPage, totalPages }
};

/**
 * Get a single registration by ID.
 * FIX: throws early if id is falsy so the API never receives /undefined
 */
export const getRegistrationById = async (id) => {
  // ── Guard: never call API with undefined/null id ──────────
  if (!id || id === "undefined") {
    throw new Error(`getRegistrationById called with invalid id: ${id}`);
  }
  const res = await API.get(`/api/exam-registrations/${id}`);
  return res.data;
  // res.data = { registration }
};

/**
 * Delete a draft or payment-pending registration.
 */
export const deleteRegistration = async (id) => {
  const res = await API.delete(`/api/exam-registrations/${id}`);
  return res.data;
};

// ════════════════════════════════════════════════════════════
// EXAM PAYMENTS
// ════════════════════════════════════════════════════════════

/**
 * Initialize Paystack payment for a registration.
 * Returns { paymentUrl, reference, paymentId, amount }
 */
export const initializeExamPayment = async (registrationId) => {
  if (!registrationId) {
    throw new Error("initializeExamPayment: registrationId is required");
  }
  const res = await API.post("/api/exam-payments/initialize", { registrationId });
  return res.data;
};

/**
 * Verify a Paystack payment after redirect.
 * Returns { success, payment, paymentId }
 */
export const verifyExamPayment = async (reference) => {
  if (!reference) {
    throw new Error("verifyExamPayment: reference is required");
  }
  const res = await API.post("/api/exam-payments/verify", { reference });
  return res.data;
};

/**
 * Get receipt data as JSON (for rendering inline in a modal/page).
 * FIX: previously this was navigating to /exam-payments/receipt/:id
 * as a React route which doesn't exist. This calls the API directly.
 */
export const getReceiptData = async (paymentId) => {
  if (!paymentId) {
    throw new Error("getReceiptData: paymentId is required");
  }
  const res = await API.get(`/api/exam-payments/receipt/${paymentId}`);
  return res.data;
  // res.data = { receipt: { receiptNumber, paymentDate, amount, ... } }
};

/**
 * Download receipt as a file to the user's device.
 * If the backend returns a blob (PDF), it downloads it.
 * If it returns JSON (receipt data), the caller can render it.
 *
 * FIX: never navigate() to a React route for this.
 * Always call the API endpoint directly.
 */
export const downloadReceiptFile = async (
  paymentId,
  filename = "exam-receipt.pdf"
) => {
  if (!paymentId) {
    throw new Error("downloadReceiptFile: paymentId is required");
  }

  try {
    // Try blob download first (works if backend sends PDF)
    const res = await API.get(`/api/exam-payments/receipt/${paymentId}`, {
      responseType: "blob",
    });

    const contentType = res.headers["content-type"] || "";

    // If the response is JSON (receipt data), parse and return it
    if (contentType.includes("application/json")) {
      const text   = await res.data.text();
      const parsed = JSON.parse(text);
      return { isJson: true, data: parsed };
    }

    // Otherwise treat as downloadable blob (PDF, etc.)
    const url  = window.URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href     = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { isJson: false };
  } catch (err) {
    // Fallback: get JSON receipt data so the UI can still show it
    const json = await getReceiptData(paymentId);
    return { isJson: true, data: json };
  }
};

// ════════════════════════════════════════════════════════════
// USAGE EXAMPLES FOR COMPONENTS
// ════════════════════════════════════════════════════════════
/*
// ── Creating a registration and immediately viewing it ──────
const handleCreate = async () => {
  const res = await createRegistration(examType, formData);
  const id  = res.registrationId || res.registration?.id;
  // always store id, then navigate
  navigate(`/exam-registrations/${id}`);
};

// ── Loading a registration on a detail page ─────────────────
const { id } = useParams();
useEffect(() => {
  if (!id || id === "undefined") return;   // ← guard
  getRegistrationById(id)
    .then(res => setRegistration(res.registration))
    .catch(console.error);
}, [id]);

// ── Showing receipt inline (no navigation needed) ───────────
const handleViewReceipt = async (paymentId) => {
  const { receipt } = await getReceiptData(paymentId);
  setReceiptData(receipt);   // open in a Dialog/Modal
};

// ── Downloading receipt as PDF ───────────────────────────────
const handleDownload = async (paymentId) => {
  const result = await downloadReceiptFile(paymentId, "my-exam-receipt.pdf");
  if (result.isJson) {
    // Backend returned JSON, show it in a modal instead
    setReceiptData(result.data.receipt);
    setReceiptModalOpen(true);
  }
  // If !isJson, the file was already downloaded automatically
};

// import API from "./api";

// /**
//  * ==================================
//  * CREATE EXAM REGISTRATION
//  * ==================================
//  */
// export const createRegistration = async (
//   examType,
//   data
// ) => {
//   const response = await API.post(
//     "api/exam-registrations",
//     {
//       examType,
//       data,
//     }
//   );

//   return response.data;
// };

// /**
//  * ==================================
//  * GET MY REGISTRATIONS
//  * ==================================
//  */
// export const getMyRegistrations = async (
//   page = 1,
//   limit = 20
// ) => {
//   const response = await API.get(
//     "api/exam-registrations/my",
//     {
//       params: {
//         page,
//         limit,
//       },
//     }
//   );

//   return response.data;
// };

// /**
//  * ==================================
//  * GET REGISTRATION BY ID
//  * ==================================
//  */
// export const getRegistrationById =
//   async (id) => {
//     const response =
//       await API.get(
//         `api/exam-registrations/${id}`
//       );

//     return response.data;
//   };

// /**
//  * ==================================
//  * DELETE REGISTRATION
//  * ==================================
//  */
// export const deleteRegistration =
//   async (id) => {
//     const response =
//       await API.delete(
//         `api/exam-registrations/${id}`
//       );

//     return response.data;
//   };

// /**
//  * ==================================
//  * INITIALIZE PAYMENT
//  * ==================================
//  */
// export const initializeExamPayment =
//   async (registrationId) => {
//     const response =
//       await API.post(
//         "api/exam-payments/initialize",
//         {
//           registrationId,
//         }
//       );

//     return response.data;
//   };

// /**
//  * ==================================
//  * VERIFY PAYMENT
//  * ==================================
//  */
// export const verifyExamPayment =
//   async (reference) => {
//     const response =
//       await API.post(
//         "api/exam-payments/verify",
//         {
//           reference,
//         }
//       );

//     return response.data;
//   };

// /**
//  * ==================================
//  * DOWNLOAD RECEIPT
//  * ==================================
//  */
// export const downloadReceipt =
//   async (paymentId) => {
//     const response =
//       await API.get(
//         `api/exam-payments/receipt/${paymentId}`,
//         {
//           responseType: "blob",
//         }
//       );

//     return response.data;
//   };

// /**
//  * ==================================
//  * HELPER:
//  * DOWNLOAD RECEIPT TO DEVICE
//  * ==================================
//  */
// export const downloadReceiptFile =
//   async (
//     paymentId,
//     filename =
//       "exam-receipt.pdf"
//   ) => {
//     const blob =
//       await downloadReceipt(
//         paymentId
//       );

//     const url =
//       window.URL.createObjectURL(
//         blob
//       );

//     const link =
//       document.createElement("a");

//     link.href = url;

//     link.download = filename;

//     document.body.appendChild(
//       link
//     );

//     link.click();

//     link.remove();

//     window.URL.revokeObjectURL(
//       url
//     );
//   };