import API from "./api";

// ─── Courses ────────────────────────────────────────────────────────────────

/**
 * Fetch all published courses (student/public view).
 * The admin CRUD endpoints (/admin/courses) are separate — you
 * only need a student-facing getAllCourses if you want to control
 * what's exposed (e.g. only isPublished=true). For now we reuse
 * the same GET /courses endpoint; the backend should filter by
 * isPublished automatically for non-admin requests.
 */
export const getAllCourses = async (params = {}) => {
  // params: { category, level, search, page, limit }
  const { data } = await API.get("/api/student/courses", { params });
  return data; // { courses: [...], total, page, pages }
};

/**
 * Fetch a single course by ID.
 * Works for both admin and student — backend returns the same
 * Course record; no need for a separate student route.
 */
export const getCourseById = async (id) => {
  const { data } = await API.get(`/api/student/courses/${id}`);
  return data; // { course: { ...fields, TutorProfile, CourseModules[] } }
};

// ─── Payments ───────────────────────────────────────────────────────────────

/**
 * Step 1 — Initialize a Paystack transaction.
 * Returns { authorization_url, reference, paymentId, amount }
 */
export const initializeCoursePayment =
  async (payload) => {
    const { data } = await API.post(
      "/api/payments/initialize",
      payload
    );

    return data;
  };

/**
 * Step 2 — Verify payment after Paystack callback.
 * Call this on the /payment/callback page with the ?reference query param.
 */
export const verifyPayment = async (reference) => {
  const { data } = await API.post("/api/payments/verify", { reference });
  return data; // { message, amountPaid, courseUnlocked }
};

/**
 * Download PDF receipt for a payment.
 */
export const downloadReceipt = async (paymentId) => {
  const response = await API.get(`/payments/${paymentId}/receipt`, {
    responseType: "blob",
  });
  // Trigger browser download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `receipt-${paymentId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};