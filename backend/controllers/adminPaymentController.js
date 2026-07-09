// controllers/adminPaymentController.js
//
// Unified admin view across all three payment domains:
//   - Course/LMS payments      (Payment model)
//   - HEALS application fees   (HealsPayment model)
//   - Exam registration fees   (ExamPayment model)
//
// All routes require authenticate + admin role.
// Mount as:  app.use("/api/admin/payments", adminPaymentRoutes)

import { Op, fn, col, literal } from "sequelize";
import sequelize from "../config/db.js";
import models from "../models/index.js";

const {
  Payment,
  HealsPayment,
  ExamPayment,
  ExamRegistration,
  HealsApplication,
  Course,
  User,
  ActivityLog,
} = models;

// ─────────────────────────────────────────────────────────────
// GUARD
// ─────────────────────────────────────────────────────────────
const ADMIN_ROLES = ["admin", "superadmin", "operational_admin"];

const requireAdmin = (req, res) => {
  if (!ADMIN_ROLES.includes(req.user?.role)) {
    res.status(403).json({ message: "Admin access required" });
    return false;
  }
  return true;
};

// ─────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────

/** Build a date-range where clause for a given column */
const dateRange = (from, to, column = "createdAt") => {
  if (!from && !to) return {};
  const range = {};
  if (from) range[Op.gte] = new Date(from);
  if (to)   range[Op.lte] = new Date(new Date(to).setHours(23, 59, 59, 999));
  return { [column]: range };
};

/** Standard pagination helpers */
const paginate = (page = 1, limit = 20) => ({
  limit:  Math.min(Number(limit), 100),
  offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

// ─────────────────────────────────────────────────────────────
// 1. PLATFORM-WIDE PAYMENT OVERVIEW
//    GET /api/admin/payments/overview
//    Query: from?, to?
// ─────────────────────────────────────────────────────────────
export const getPaymentOverview = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { from, to } = req.query;
    const dr = dateRange(from, to);

    // ── Parallel counts + sums across all three tables ──────
    const [
      // Course payments
      courseTotalCount,
      courseSuccessCount,
      coursePendingCount,
      courseFailedCount,
      courseRevenue,

      // HEALS payments
      healsTotalCount,
      healsSuccessCount,
      healsPendingCount,
      healsFailedCount,
      healsRevenue,

      // Exam payments
      examTotalCount,
      examSuccessCount,
      examPendingCount,
      examFailedCount,
      examRevenue,
    ] = await Promise.all([
      // Course
      Payment.count({ where: dr }),
      Payment.count({ where: { ...dr, status: "success" } }),
      Payment.count({ where: { ...dr, status: "pending" } }),
      Payment.count({ where: { ...dr, status: "failed"  } }),
      Payment.sum("amount", { where: { ...dr, status: "success" } }),

      // HEALS
      HealsPayment.count({ where: dr }),
      HealsPayment.count({ where: { ...dr, status: "success" } }),
      HealsPayment.count({ where: { ...dr, status: "pending" } }),
      HealsPayment.count({ where: { ...dr, status: "failed"  } }),
      HealsPayment.sum("totalAmount", { where: { ...dr, status: "success" } }),

      // Exam
      ExamPayment.count({ where: dr }),
      ExamPayment.count({ where: { ...dr, status: "success" } }),
      ExamPayment.count({ where: { ...dr, status: "pending" } }),
      ExamPayment.count({ where: { ...dr, status: "failed"  } }),
      ExamPayment.sum("amount", { where: { ...dr, status: "success" } }),
    ]);

    const courseRev = Number(courseRevenue || 0);
    const healsRev  = Number(healsRevenue  || 0);
    const examRev   = Number(examRevenue   || 0);
    const totalRev  = courseRev + healsRev + examRev;

    const totalTx      = courseTotalCount   + healsTotalCount   + examTotalCount;
    const totalSuccess = courseSuccessCount + healsSuccessCount + examSuccessCount;
    const totalPending = coursePendingCount + healsPendingCount + examPendingCount;
    const totalFailed  = courseFailedCount  + healsFailedCount  + examFailedCount;

    // ── Monthly revenue breakdown (last 6 months, all 3 tables) ──
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [courseMonthly, healsMonthly, examMonthly] = await Promise.all([
      Payment.findAll({
        where:      { status: "success", createdAt: { [Op.gte]: sixMonthsAgo } },
        attributes: [
          [fn("DATE_TRUNC", "month", col("createdAt")), "month"],
          [fn("SUM", col("amount")), "revenue"],
          [fn("COUNT", col("id")), "count"],
        ],
        group: [fn("DATE_TRUNC", "month", col("createdAt"))],
        order: [[fn("DATE_TRUNC", "month", col("createdAt")), "ASC"]],
        raw:   true,
      }),
      HealsPayment.findAll({
        where:      { status: "success", createdAt: { [Op.gte]: sixMonthsAgo } },
        attributes: [
          [fn("DATE_TRUNC", "month", col("createdAt")), "month"],
          [fn("SUM", col("totalAmount")), "revenue"],
          [fn("COUNT", col("id")), "count"],
        ],
        group: [fn("DATE_TRUNC", "month", col("createdAt"))],
        order: [[fn("DATE_TRUNC", "month", col("createdAt")), "ASC"]],
        raw:   true,
      }),
      ExamPayment.findAll({
        where:      { status: "success", createdAt: { [Op.gte]: sixMonthsAgo } },
        attributes: [
          [fn("DATE_TRUNC", "month", col("createdAt")), "month"],
          [fn("SUM", col("amount")), "revenue"],
          [fn("COUNT", col("id")), "count"],
        ],
        group: [fn("DATE_TRUNC", "month", col("createdAt"))],
        order: [[fn("DATE_TRUNC", "month", col("createdAt")), "ASC"]],
        raw:   true,
      }),
    ]);

    // Merge monthly data into a unified map keyed by ISO month string
    const monthMap = {};
    const addMonth = (rows, domain) => {
      rows.forEach((r) => {
        const key = new Date(r.month).toISOString().slice(0, 7); // "YYYY-MM"
        if (!monthMap[key]) monthMap[key] = { month: key, course: 0, heals: 0, exam: 0, total: 0 };
        monthMap[key][domain] += Number(r.revenue || 0);
        monthMap[key].total   += Number(r.revenue || 0);
      });
    };
    addMonth(courseMonthly, "course");
    addMonth(healsMonthly,  "heals");
    addMonth(examMonthly,   "exam");
    const monthlyRevenue = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      summary: {
        totalRevenue:    totalRev,
        totalTransactions: totalTx,
        totalSuccess,
        totalPending,
        totalFailed,
        successRate: totalTx > 0 ? Math.round((totalSuccess / totalTx) * 100) : 0,
      },
      byDomain: {
        course: {
          total:   courseTotalCount,
          success: courseSuccessCount,
          pending: coursePendingCount,
          failed:  courseFailedCount,
          revenue: courseRev,
        },
        heals: {
          total:   healsTotalCount,
          success: healsSuccessCount,
          pending: healsPendingCount,
          failed:  healsFailedCount,
          revenue: healsRev,
        },
        exam: {
          total:   examTotalCount,
          success: examSuccessCount,
          pending: examPendingCount,
          failed:  examFailedCount,
          revenue: examRev,
        },
      },
      monthlyRevenue,
    });
  } catch (err) {
    console.error("getPaymentOverview:", err);
    res.status(500).json({ message: "Failed to load payment overview" });
  }
};

// ─────────────────────────────────────────────────────────────
// 2. COURSE PAYMENTS — paginated list
//    GET /api/admin/payments/course
//    Query: page, limit, status, search, from, to
// ─────────────────────────────────────────────────────────────
export const getCoursePayments = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { page, limit, status, search, from, to } = req.query;
    const { limit: lim, offset }                    = paginate(page, limit);

    const where = { ...dateRange(from, to) };
    if (status) where.status = status;

    // user search — resolved via include where
    const userWhere = search
      ? { [Op.or]: [
          { fullName: { [Op.iLike]: `%${search}%` } },
          { email:    { [Op.iLike]: `%${search}%` } },
        ]}
      : undefined;

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: User,   attributes: ["id", "fullName", "email"], ...(userWhere ? { where: userWhere } : {}) },
        { model: Course, attributes: ["id", "title", "monthlyPrice"], required: false },
      ],
      order:  [["createdAt", "DESC"]],
      limit:  lim,
      offset,
    });

    res.json({
      total: count,
      page:  Number(page || 1),
      totalPages: Math.ceil(count / lim),
      payments: rows,
    });
  } catch (err) {
    console.error("getCoursePayments:", err);
    res.status(500).json({ message: "Failed to fetch course payments" });
  }
};

// ─────────────────────────────────────────────────────────────
// 3. COURSE PAYMENT — single record
//    GET /api/admin/payments/course/:id
// ─────────────────────────────────────────────────────────────
export const getCoursePaymentById = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        { model: User,   attributes: ["id", "fullName", "email"] },
        { model: Course, attributes: ["id", "title", "monthlyPrice"], required: false },
      ],
    });

    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json({ payment });
  } catch (err) {
    console.error("getCoursePaymentById:", err);
    res.status(500).json({ message: "Failed to fetch payment" });
  }
};

// ─────────────────────────────────────────────────────────────
// 4. HEALS PAYMENTS — paginated list
//    GET /api/admin/payments/heals
//    Query: page, limit, status, type, search, from, to
// ─────────────────────────────────────────────────────────────
export const getHealsPayments = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { page, limit, status, type, search, from, to } = req.query;
    const { limit: lim, offset }                          = paginate(page, limit);

    const where = { ...dateRange(from, to) };
    if (status) where.status = status;
    if (type)   where.type   = type;

    const userWhere = search
      ? { [Op.or]: [
          { fullName: { [Op.iLike]: `%${search}%` } },
          { email:    { [Op.iLike]: `%${search}%` } },
        ]}
      : undefined;

    const { count, rows } = await HealsPayment.findAndCountAll({
      where,
      include: [
        { model: User,             attributes: ["id", "fullName", "email"], ...(userWhere ? { where: userWhere } : {}) },
        { model: HealsApplication, attributes: ["id", "fullName", "desiredCountry", "status"], required: false },
      ],
      order:  [["createdAt", "DESC"]],
      limit:  lim,
      offset,
    });

    res.json({
      total: count,
      page:  Number(page || 1),
      totalPages: Math.ceil(count / lim),
      payments: rows,
    });
  } catch (err) {
    console.error("getHealsPayments:", err);
    res.status(500).json({ message: "Failed to fetch HEALS payments" });
  }
};

// ─────────────────────────────────────────────────────────────
// 5. HEALS PAYMENT — single record
//    GET /api/admin/payments/heals/:id
// ─────────────────────────────────────────────────────────────
export const getHealsPaymentById = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const payment = await HealsPayment.findByPk(req.params.id, {
      include: [
        { model: User,             attributes: ["id", "fullName", "email"] },
        { model: HealsApplication, attributes: ["id", "fullName", "desiredCountry", "status"], required: false },
      ],
    });

    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json({ payment });
  } catch (err) {
    console.error("getHealsPaymentById:", err);
    res.status(500).json({ message: "Failed to fetch HEALS payment" });
  }
};

// ─────────────────────────────────────────────────────────────
// 6. EXAM PAYMENTS — paginated list
//    GET /api/admin/payments/exam
//    Query: page, limit, status, examType, search, from, to
// ─────────────────────────────────────────────────────────────
export const getExamPayments = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { page, limit, status, examType, search, from, to } = req.query;
    const { limit: lim, offset }                              = paginate(page, limit);

    const where = { ...dateRange(from, to) };
    if (status) where.status = status;

    const registrationWhere = {};
    if (examType) registrationWhere.examType = { [Op.iLike]: `%${examType}%` };

    const userWhere = search
      ? { [Op.or]: [
          { fullName: { [Op.iLike]: `%${search}%` } },
          { email:    { [Op.iLike]: `%${search}%` } },
        ]}
      : undefined;

    const { count, rows } = await ExamPayment.findAndCountAll({
      where,
      include: [
        { model: User,             attributes: ["id", "fullName", "email"], ...(userWhere ? { where: userWhere } : {}) },
        {
          model:    ExamRegistration,
          attributes: ["id", "examType", "registrationCode", "status", "paymentStatus"],
          required: Object.keys(registrationWhere).length > 0,
          ...(Object.keys(registrationWhere).length > 0 ? { where: registrationWhere } : {}),
        },
      ],
      order:  [["createdAt", "DESC"]],
      limit:  lim,
      offset,
    });

    res.json({
      total: count,
      page:  Number(page || 1),
      totalPages: Math.ceil(count / lim),
      payments: rows,
    });
  } catch (err) {
    console.error("getExamPayments:", err);
    res.status(500).json({ message: "Failed to fetch exam payments" });
  }
};

// ─────────────────────────────────────────────────────────────
// 7. EXAM PAYMENT — single record
//    GET /api/admin/payments/exam/:id
// ─────────────────────────────────────────────────────────────
export const getExamPaymentById = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const payment = await ExamPayment.findByPk(req.params.id, {
      include: [
        { model: User,             attributes: ["id", "fullName", "email"] },
        { model: ExamRegistration, attributes: ["id", "examType", "registrationCode", "status", "paymentStatus", "formData"], required: false },
      ],
    });

    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json({ payment });
  } catch (err) {
    console.error("getExamPaymentById:", err);
    res.status(500).json({ message: "Failed to fetch exam payment" });
  }
};

// ─────────────────────────────────────────────────────────────
// 8. UNIFIED RECENT PAYMENTS FEED
//    GET /api/admin/payments/recent
//    Query: limit (default 20) — pulls from all 3 tables,
//           merges and returns sorted by createdAt desc
// ─────────────────────────────────────────────────────────────
export const getRecentPayments = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const lim = Math.min(Number(req.query.limit || 20), 50);

    const [courseRows, healsRows, examRows] = await Promise.all([
      Payment.findAll({
        order:   [["createdAt", "DESC"]],
        limit:   lim,
        include: [
          { model: User,   attributes: ["id", "fullName", "email"] },
          { model: Course, attributes: ["id", "title"], required: false },
        ],
      }),
      HealsPayment.findAll({
        order:   [["createdAt", "DESC"]],
        limit:   lim,
        include: [
          { model: User,             attributes: ["id", "fullName", "email"] },
          { model: HealsApplication, attributes: ["id", "desiredCountry"], required: false },
        ],
      }),
      ExamPayment.findAll({
        order:   [["createdAt", "DESC"]],
        limit:   lim,
        include: [
          { model: User,             attributes: ["id", "fullName", "email"] },
          { model: ExamRegistration, attributes: ["id", "examType", "registrationCode"], required: false },
        ],
      }),
    ]);

    // Normalize to a common shape
    const normalize = (rows, domain) =>
      rows.map((p) => {
        const plain = p.toJSON();
        return {
          id:          plain.id,
          domain,
          status:      plain.status,
          amount:      Number(plain.totalAmount || plain.amount || 0),
          currency:    plain.currency || "NGN",
          transactionRef: plain.transactionRef,
          createdAt:   plain.createdAt,
          paidAt:      plain.paidAt,
          user: plain.User
            ? { id: plain.User.id, fullName: plain.User.fullName, email: plain.User.email }
            : null,
          // domain-specific label
          label:
            domain === "course" ? plain.Course?.title
            : domain === "heals"  ? `${plain.title} — ${plain.HealsApplication?.desiredCountry || ""}`
            : plain.ExamRegistration?.examType || "Exam",
          meta: {
            ...(domain === "course" && { courseId:        plain.courseId, durationMonths: plain.durationMonths }),
            ...(domain === "heals"  && { applicationId:   plain.applicationId, type: plain.type }),
            ...(domain === "exam"   && { registrationId:  plain.registrationId, examType: plain.ExamRegistration?.examType }),
          },
        };
      });

    const all = [
      ...normalize(courseRows, "course"),
      ...normalize(healsRows,  "heals"),
      ...normalize(examRows,   "exam"),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, lim);

    res.json({ payments: all });
  } catch (err) {
    console.error("getRecentPayments:", err);
    res.status(500).json({ message: "Failed to fetch recent payments" });
  }
};

// ─────────────────────────────────────────────────────────────
// 9. PER-USER PAYMENT HISTORY (all domains)
//    GET /api/admin/payments/user/:userId
// ─────────────────────────────────────────────────────────────
export const getUserPaymentHistory = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, { attributes: ["id", "fullName", "email"] });
    if (!user) return res.status(404).json({ message: "User not found" });

    const [coursePayments, healsPayments, examPayments] = await Promise.all([
      Payment.findAll({
        where:   { userId },
        include: [{ model: Course, attributes: ["id", "title"], required: false }],
        order:   [["createdAt", "DESC"]],
      }),
      HealsPayment.findAll({
        where:   { userId },
        include: [{ model: HealsApplication, attributes: ["id", "desiredCountry", "status"], required: false }],
        order:   [["createdAt", "DESC"]],
      }),
      ExamPayment.findAll({
        where:   { userId },
        include: [{ model: ExamRegistration, attributes: ["id", "examType", "registrationCode", "status"], required: false }],
        order:   [["createdAt", "DESC"]],
      }),
    ]);

    // Totals
    const sum = (rows, field = "amount") =>
      rows.filter((r) => r.status === "success").reduce((acc, r) => acc + Number(r[field] || 0), 0);

    res.json({
      user,
      summary: {
        courseTotalSpent: sum(coursePayments),
        healsTotalSpent:  sum(healsPayments, "totalAmount"),
        examTotalSpent:   sum(examPayments),
        grandTotal:       sum(coursePayments) + sum(healsPayments, "totalAmount") + sum(examPayments),
      },
      coursePayments,
      healsPayments,
      examPayments,
    });
  } catch (err) {
    console.error("getUserPaymentHistory:", err);
    res.status(500).json({ message: "Failed to fetch user payment history" });
  }
};

// ─────────────────────────────────────────────────────────────
// 10. MARK PAYMENT AS REFUNDED (manual override)
//     PATCH /api/admin/payments/:domain/:id/refund
//     domain: "course" | "heals" | "exam"
//     Body: { reason? }
// ─────────────────────────────────────────────────────────────
export const markPaymentRefunded = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { domain, id } = req.params;
    const { reason = "Manual refund by admin" } = req.body;

    const MODEL_MAP = {
      course: { model: Payment,       amountField: "amount"      },
      heals:  { model: HealsPayment,  amountField: "totalAmount" },
      exam:   { model: ExamPayment,   amountField: "amount"      },
    };

    const entry = MODEL_MAP[domain];
    if (!entry) return res.status(400).json({ message: "Invalid domain. Use: course | heals | exam" });

    const payment = await entry.model.findByPk(id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment.status !== "success") {
      return res.status(400).json({ message: `Cannot refund a payment with status "${payment.status}"` });
    }

    payment.status = "refunded";
    payment.meta   = { ...(payment.meta || {}), refundReason: reason, refundedBy: req.user.id, refundedAt: new Date() };
    await payment.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: "ADMIN_PAYMENT_REFUNDED",
      meta:   { domain, paymentId: id, reason, amount: payment[entry.amountField] },
    });

    res.json({ message: "Payment marked as refunded", payment });
  } catch (err) {
    console.error("markPaymentRefunded:", err);
    res.status(500).json({ message: "Failed to mark payment as refunded" });
  }
};
