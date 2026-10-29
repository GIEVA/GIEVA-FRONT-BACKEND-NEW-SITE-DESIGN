// service/visaSettings.js
// Admin-set values live in visa_settings; env vars are only a fallback (same idea as getHealsFee).
import models from "../models/index.js";

const { VisaSetting } = models;

const FEE_KEY = "application_fee";
const AVAIL_KEY = "availability";

const positive = (n) => Number.isFinite(Number(n)) && Number(n) > 0;

// { normalFee, expeditedFee, currency }
export const getVisaFees = async () => {
  const row = await VisaSetting.findByPk(FEE_KEY);
  const v = row?.value || {};
  return {
    normalFee: positive(v.normalFee) ? Number(v.normalFee) : Number(process.env.VISA_NORMAL_FEE) || 0,
    expeditedFee: positive(v.expeditedFee) ? Number(v.expeditedFee) : Number(process.env.VISA_EXPEDITED_FEE) || 0,
    currency: v.currency || process.env.VISA_FEE_CURRENCY || "NGN",
  };
};

// { isOpen, closedMessage, instructions }
export const getVisaAvailability = async () => {
  const row = await VisaSetting.findByPk(AVAIL_KEY);
  const v = row?.value || {};
  return {
    isOpen: v.isOpen !== false,
    closedMessage: v.closedMessage || null,
    instructions: v.instructions || null,
  };
};

// Everything the apply page needs
export const getVisaSettings = async () => ({ ...(await getVisaFees()), ...(await getVisaAvailability()) });

// The amount the server will charge for an appointment type. The client never chooses it.
export const getVisaFee = async (appointmentType) => {
  const f = await getVisaFees();
  return { amount: appointmentType === "expedited" ? f.expeditedFee : f.normalFee, currency: f.currency };
};

export const saveVisaFees = async (fees, adminId) => {
  await VisaSetting.upsert({ name: FEE_KEY, value: fees, updatedBy: adminId });
  return getVisaFees();
};

export const saveVisaAvailability = async (avail, adminId) => {
  await VisaSetting.upsert({ name: AVAIL_KEY, value: avail, updatedBy: adminId });
  return getVisaAvailability();
};

export const getVisaSettingMeta = async (name) => {
  const row = await VisaSetting.findByPk(name);
  return { updatedAt: row?.updatedAt || null, updatedBy: row?.updatedBy || null };
};
export const FEE_SETTING = FEE_KEY;
export const AVAILABILITY_SETTING = AVAIL_KEY;
