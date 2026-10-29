// controllers/adminVisaSettings.controller.js
// Fee + availability managed from the admin dashboard (mirrors adminHealsSettingsController).
import models from "../models/index.js";
import {
  getVisaFees, getVisaAvailability, saveVisaFees, saveVisaAvailability, getVisaSettingMeta, FEE_SETTING, AVAILABILITY_SETTING,
} from "../service/visaSettings.js";

const { ActivityLog } = models;
const log = (userId, action, meta) => ActivityLog?.create({ userId, action, meta }).catch(() => {});

// ADMIN: current fees plus who changed them last
export const getAdminFee = async (_req, res) => {
  try {
    res.json({ ...(await getVisaFees()), ...(await getVisaSettingMeta(FEE_SETTING)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load fees" });
  }
};

// ADMIN: change the fees
export const updateFee = async (req, res) => {
  try {
    const normalFee = Number(req.body.normalFee);
    const expeditedFee = Number(req.body.expeditedFee);
    const currency = String(req.body.currency || "NGN").toUpperCase();

    const bad = (n) => !Number.isFinite(n) || n <= 0 || n > 100000000;
    if (bad(normalFee)) return res.status(400).json({ message: "Enter a valid normal fee greater than 0" });
    if (bad(expeditedFee)) return res.status(400).json({ message: "Enter a valid expedited fee greater than 0" });
    if (!["NGN", "USD"].includes(currency)) return res.status(400).json({ message: "Currency must be NGN or USD" });

    const before = await getVisaFees();
    const after = { normalFee: Math.round(normalFee * 100) / 100, expeditedFee: Math.round(expeditedFee * 100) / 100, currency };
    await saveVisaFees(after, req.user.id);
    await log(req.user.id, "VISA_FEE_UPDATED", { before, after });

    res.json({ message: "Visa fees updated. New payments will be charged these amounts.", ...after });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update fees" });
  }
};

// ADMIN: open/pause applications + apply-page instructions
export const getAdminAvailability = async (_req, res) => {
  try {
    res.json({ ...(await getVisaAvailability()), ...(await getVisaSettingMeta(AVAILABILITY_SETTING)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load settings" });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const b = req.body || {};
    const after = {
      isOpen: !!b.isOpen,
      closedMessage: String(b.closedMessage || "").slice(0, 255) || null,
      instructions: String(b.instructions || "").slice(0, 4000) || null,
    };
    const before = await getVisaAvailability();
    await saveVisaAvailability(after, req.user.id);
    await log(req.user.id, "VISA_AVAILABILITY_UPDATED", { before: { isOpen: before.isOpen }, after: { isOpen: after.isOpen } });
    res.json({ message: "Settings saved", ...after });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save settings" });
  }
};
