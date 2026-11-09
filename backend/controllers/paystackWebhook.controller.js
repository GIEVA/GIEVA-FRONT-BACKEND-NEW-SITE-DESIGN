import { visaPaymentWebhook } from "./visaPayment.controller.js";
import { healsPaystackWebhook } from "./healsPaymentController.js";
import { coursePaymentWebhook } from "./paymentController.js";
import { examPaymentWebhook } from "./ExamRegistrationPaymentController.js";

const handlers = [
  ["visa", visaPaymentWebhook],
  ["heals", healsPaystackWebhook],
  ["course", coursePaymentWebhook],
  ["exam", examPaymentWebhook],
];

// Each handler verifies the signature and replies itself; we capture its status instead
const captureRes = () => {
  const r = { code: 200 };
  r.status = (c) => { r.code = c; return r; };
  r.sendStatus = (c) => { r.code = c; return r; };
  r.json = () => r;
  r.send = () => r;
  r.end = () => r;
  return r;
};

export const paystackWebhook = async (req, res) => {
  const codes = await Promise.all(
    handlers.map(async ([name, fn]) => {
      const r = captureRes();
      try {
        await fn(req, r);
      } catch (err) {
        console.error(`[webhook:${name}]`, err);
        r.code = 500;
      }
      return r.code;
    })
  );

  if (codes.includes(401)) return res.sendStatus(401);          // bad signature
  if (codes.some((c) => c >= 500)) return res.sendStatus(500);  // Paystack retries
  return res.sendStatus(200);
};