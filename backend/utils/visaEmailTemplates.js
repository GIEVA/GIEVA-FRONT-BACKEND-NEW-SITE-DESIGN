// utils/visaEmailTemplates.js
// Branded, table-based HTML (works in Gmail/Outlook/mobile). All user-supplied text is escaped.

const NAVY = "#0B1F3A", GREEN = "#1E7F4F", GOLD = "#C9A227";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n, cur = "NGN") => `${cur === "NGN" ? "₦" : `${cur} `}${Number(n).toLocaleString("en-NG")}`;
const fmt = (d) => (d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }) : "");

const shell = (title, inner) => `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
<tr><td style="background:${NAVY};padding:22px 28px"><div style="color:#fff;font-size:20px;font-weight:800;letter-spacing:.3px">GIEVA</div>
<div style="color:${GOLD};font-size:12px;font-weight:700;letter-spacing:1.5px;margin-top:2px">VISA SERVICE</div></td></tr>
<tr><td style="height:4px;background:${GOLD}"></td></tr>
<tr><td style="padding:28px"><h2 style="margin:0 0 14px;font-size:20px;color:${NAVY}">${esc(title)}</h2>${inner}</td></tr>
<tr><td style="padding:18px 28px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.6">
GIEVA · Global Int. Edu. Vol. Assoc. · www.gieva.org<br>Abuja 07035250399 · Lagos +2347035250344 · contact@gieva.org</td></tr>
</table></td></tr></table></body></html>`;

const row = (l, v) => `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:42%">${esc(l)}</td><td style="padding:8px 0;font-weight:700;font-size:14px">${esc(v)}</td></tr>`;
const btn = (href, label) => `<p style="margin:22px 0 0"><a href="${esc(href)}" style="background:${GREEN};color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block">${esc(label)}</a></p>`;

export const visaSubmittedTemplate = ({ fullName, applicationCode, appointmentType, interviewLocation, amount, currency, paymentCode, transactionRef, paidAt, link }) =>
  shell("Your visa application has been received", `
  <p style="font-size:15px;line-height:1.6">Hello ${esc(fullName)}, thank you. Your payment was successful and your application is now with our team. A PDF copy of everything you submitted is attached to this email. Please keep it for your records.</p>
  <table role="presentation" width="100%" style="border-top:1px solid #e2e8f0;margin-top:8px">
    ${row("Application number", applicationCode)}
    ${row("Appointment", `${appointmentType === "expedited" ? "Expedited" : "Normal"} · ${interviewLocation === "abuja" ? "Abuja" : "Lagos"}`)}
    ${row("Amount paid", money(amount, currency))}
    ${row("Payment code", paymentCode)}
    ${row("Transaction reference", transactionRef)}
    ${row("Paid on", fmt(paidAt))}
  </table>
  <p style="font-size:14px;line-height:1.6;margin-top:16px">We will email you every time the status of your application changes. You can also follow it any time from your dashboard.</p>
  ${link ? btn(link, "Track my application") : ""}`);

export const visaStatusTemplate = ({ fullName, applicationCode, statusLabel, status, note, interviewDate, interviewLocation, link }) => {
  const tone = { approved: GREEN, rejected: "#b91c1c", info_required: "#b45309" }[status] || NAVY;
  return shell("Update on your visa application", `
  <p style="font-size:15px;line-height:1.6">Hello ${esc(fullName)}, the status of application <b>${esc(applicationCode)}</b> has changed.</p>
  <p style="margin:16px 0"><span style="background:${tone};color:#fff;padding:8px 16px;border-radius:999px;font-weight:800;font-size:13px">${esc(statusLabel)}</span></p>
  ${interviewDate ? `<p style="font-size:14px"><b>Interview:</b> ${esc(fmt(interviewDate))}${interviewLocation ? ` · ${interviewLocation === "abuja" ? "Abuja" : "Lagos"} office` : ""}</p>` : ""}
  ${note ? `<div style="background:#f8fafc;border-left:4px solid ${tone};padding:12px 16px;border-radius:6px;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(note)}</div>` : ""}
  ${link ? btn(link, "View my application") : ""}`);
};
