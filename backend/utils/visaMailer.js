// utils/visaMailer.js
// Thin wrapper over YOUR existing Brevo util (utils/sendMail.js), so the visa emails use the same
// sender, API key and logging as the rest of the app.
//
// Brevo wants attachments as [{ name, content: <base64 string> }]. The visa code passes
// [{ filename, content: Buffer }], and this converts them.
// Brevo limits the total attachment size of a transactional email (about 4 MB, check your plan),
// so the PDF is kept small (see MAX_PHOTO_BYTES in service/visaCore.js).

import sendEmail from "./sendMail.js";

export const sendVisaMail = async ({ to, subject, html, attachments = [] }) => {
  if (!to) return;
  const brevoAttachments = attachments.map((a) => ({
    name: a.filename || a.name || "attachment",
    content: Buffer.isBuffer(a.content) ? a.content.toString("base64") : String(a.content),
  }));
  return sendEmail(to, subject, html, brevoAttachments);
};