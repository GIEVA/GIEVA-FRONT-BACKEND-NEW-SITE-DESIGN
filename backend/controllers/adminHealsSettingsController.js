import models from "../models/index.js";
import { getHealsFee } from "../service/healsSettings.js";

const { HealsSetting, ActivityLog } = models;

// PUBLIC: the application form shows this to students
export const getPublicFee = async (req, res) => {
  try {
    res.json(await getHealsFee());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load fee" });
  }
};

// ADMIN: current fee plus who changed it last
export const getAdminFee = async (req, res) => {
  try {
    const fee = await getHealsFee();
    const row = await HealsSetting.findByPk("application_fee");
    res.json({ ...fee, updatedAt: row?.updatedAt || null, updatedBy: row?.updatedBy || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load fee" });
  }
};

// ADMIN: change the fee
export const updateFee = async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const currency = String(req.body.currency || "NGN").toUpperCase();

    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000)
      return res.status(400).json({ message: "Enter a valid amount greater than 0" });
    if (!["NGN", "USD"].includes(currency))
      return res.status(400).json({ message: "Currency must be NGN or USD" });

    const before = await getHealsFee();
    await HealsSetting.upsert({
      name: "application_fee",
      value: { amount, currency },
      updatedBy: req.user.id,
    });

    await ActivityLog.create({
      userId: req.user.id,
      action: "HEALS_FEE_UPDATED",
      meta: { before, after: { amount, currency } },
    });

    res.json({ message: "Application fee updated", amount, currency });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update fee" });
  }
};