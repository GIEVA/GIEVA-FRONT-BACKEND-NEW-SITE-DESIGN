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