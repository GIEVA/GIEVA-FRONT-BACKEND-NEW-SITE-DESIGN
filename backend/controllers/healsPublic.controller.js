// controllers/healsPublic.controller.js
// PUBLIC (no login): what the HEALS guideline page needs to show.
import { getHealsFee } from "../service/healsSettings.js";

export const getPublicHealsInfo = async (req, res) => {
  try {
    const fee = await getHealsFee(); // { amount, currency } set by the admin, with env fallback
    res.json({ amount: fee.amount, currency: fee.currency });
  } catch (err) {
    console.error("[heals public] info", err);
    res.status(500).json({ message: "Failed to load HEALS information" });
  }
};
