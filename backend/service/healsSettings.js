import models from "../models/index.js";

// Returns { amount, currency } from the admin-set value, falling back to the env vars
export const getHealsFee = async () => {
  const row = await models.HealsSetting.findByPk("application_fee");
  if (row?.value?.amount > 0) {
    return { amount: Number(row.value.amount), currency: row.value.currency || "NGN" };
  }
  return {
    amount: Number(process.env.HEALS_APPLICATION_FEE) || 0,
    currency: process.env.HEALS_FEE_CURRENCY || "NGN",
  };
};