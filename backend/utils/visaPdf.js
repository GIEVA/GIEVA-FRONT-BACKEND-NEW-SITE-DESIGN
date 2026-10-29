// utils/visaPdf.js
// Builds the branded "Visa Application Summary" PDF (A4) with PDFKit. Returns a Buffer.
//   const pdf = await buildVisaPdf(application, { photo: Buffer|null, payment })
// The layout follows the paper form: bio-data, identifying details, travel, sponsors, jobs,
// family, education, awards, volunteering, US relatives, social, references, then payment.

import PDFDocument from "pdfkit";

const NAVY = "#0B1F3A";
const GREEN = "#1E7F4F";
const GOLD = "#C9A227";
const INK = "#1F2937";
const MUTED = "#64748B";
const LINE = "#E2E8F0";
const M = 40; // page margin

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(d)) ? `${d}T00:00:00Z` : d);
  return Number.isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
};
const naira = (n, cur = "NGN") => (n === "" || n == null ? "-" : `${cur === "NGN" ? "NGN " : `${cur} `}${Number(n).toLocaleString("en-NG")}`);
const val = (v) => (v === undefined || v === null || v === "" ? "-" : String(v));
const cap = (s) => (s ? String(s).replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "-");

export const buildVisaPdf = (app, { photo = null, payment = null } = {}) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: M, bufferPages: true, info: { Title: `Visa Application ${app.applicationCode || ""}`, Author: "GIEVA" } });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width - M * 2;
    const bottom = () => doc.page.height - 60;
    const ensure = (h) => { if (doc.y + h > bottom()) doc.addPage(); };

    // ── header band ──
    doc.rect(0, 0, doc.page.width, 92).fill(NAVY);
    doc.rect(0, 92, doc.page.width, 4).fill(GOLD);
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(22).text("GIEVA", M, 28, { continue: true });
    doc.font("Helvetica").fontSize(10).fillColor("#cbd5e1").text("  Global Int. Edu. Vol. Assoc.");
    doc.font("Helvetica-Bold").fontSize(12).fillColor(GOLD).text("VISA APPLICATION DOCUMENT", M, 58);
    doc.font("Helvetica").fontSize(9).fillColor("#cbd5e1")
      .text(`Ref: ${app.applicationCode || "-"}   |   Submitted: ${fmtDate(app.submittedAt)}`, M, 74);

    if (photo) {
      try { doc.image(photo, doc.page.width - M - 62, 14, { fit: [62, 72], align: "center" }); } catch { /* unreadable image: skip */ }
    }
    doc.y = 116;

    // ── building blocks ──
    const section = (title) => {
      ensure(54);
      doc.moveDown(0.6);
      const y = doc.y;
      doc.roundedRect(M, y, W, 22, 4).fill(GREEN);
      doc.fillColor("#fff").font("Helvetica-Bold").fontSize(10).text(title.toUpperCase(), M + 10, y + 6.5, { characterSpacing: 0.6 });
      doc.y = y + 30;
    };

    // Two-column label/value grid. rows: [[label, value], ...]
    const grid = (rows, cols = 2) => {
      const colW = W / cols;
      for (let i = 0; i < rows.length; i += cols) {
        const slice = rows.slice(i, i + cols);
        doc.font("Helvetica-Bold").fontSize(10);
        const h = Math.max(...slice.map(([, v]) => doc.heightOfString(val(v), { width: colW - 14 }) + 16));
        ensure(h + 6);
        const y = doc.y;
        slice.forEach(([l, v], c) => {
          const x = M + c * colW;
          doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(String(l).toUpperCase(), x, y, { width: colW - 14, characterSpacing: 0.4 });
          doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text(val(v), x, y + 10, { width: colW - 14 });
        });
        doc.y = y + h;
        doc.moveTo(M, doc.y - 2).lineTo(M + W, doc.y - 2).strokeColor(LINE).lineWidth(0.5).stroke();
      }
    };
    const sub = (t) => { ensure(30); doc.moveDown(0.3).font("Helvetica-Bold").fontSize(9).fillColor(NAVY).text(t); doc.moveDown(0.2); };

    // ── 1. appointment ──
    section("Appointment");
    grid([
      ["Interview location", cap(app.interviewLocation)],
      ["Appointment type", `${cap(app.appointmentType)} appointment`],
    ]);

    // ── 2. bio-data ──
    section("Bio-data (as on international passport)");
    grid([
      ["First name", app.firstName], ["Middle name", app.middleName],
      ["Last name", app.lastName], ["Gender", cap(app.gender)],
      ["Date of birth", fmtDate(app.dateOfBirth)], ["Email", app.email],
    ]);

    section("Identifying details");
    grid([["Phone number", app.phone], ["Alternative phone", app.altPhone]]);
    grid([["Residential / postal address", app.address]], 1);

    // ── travel ──
    section("Travel history (last 5 years)");
    const trips = (app.travelHistory || []).filter((t) => t.country);
    if (!trips.length) grid([["Countries visited", "None declared"]], 1);
    trips.forEach((t, i) => grid([[`Country ${i + 1}`, t.country], ["Period", `${fmtDate(t.from)}  to  ${fmtDate(t.to)}`]]));

    // ── sponsors ──
    section("Sponsors");
    const sp = (s = {}) => [
      ["Relationship", cap(s.type)], ["Name", [s.lastName, s.otherNames].filter(Boolean).join(" ")],
      ["Phone", s.phone], ["Email", s.email],
    ];
    sub("Who is paying for your trip?"); grid(sp(app.tripSponsor));
    sub("Who is paying for your education?"); grid(sp(app.educationSponsor));
    const es = app.educationSponsor || {};
    grid([["On scholarship", es.onScholarship ? "Yes" : "No"], ["Scholarship amount (US$)", es.onScholarship ? val(es.scholarshipAmountUsd) : "-"]]);

    // ── jobs ──
    const jobBlock = (j = {}) => {
      if (!j.status) return grid([["Status", "Not provided"]], 1);
      grid([["Status", cap(j.status)]], 1);
      if (j.status !== "employed") return;
      grid([
        ["Organization", j.organizationName], ["Organization phone", j.organizationPhone],
        ["Organization address", j.organizationAddress], ["Job description", j.jobDescription],
        ["Supervisor", [j.supervisorLastName, j.supervisorOtherNames].filter(Boolean).join(" ")], ["Monthly income", naira(j.monthlyIncome)],
        ["Employed from", fmtDate(j.fromDate)], ["Employed to", fmtDate(j.toDate)],
      ]);
    };
    section("Job history (last 5 years)");
    sub("Current job"); jobBlock(app.currentJob);
    sub("Previous job"); jobBlock(app.previousJob);

    // ── family ──
    section("Family details");
    const fam = (p = {}) => [["Last name", p.lastName], ["First name", p.firstName], ["Date of birth", fmtDate(p.dateOfBirth)], ["Email", p.email]];
    sub("Father"); grid(fam(app.father));
    sub("Mother"); grid(fam(app.mother));

    // ── education ──
    section("Educational information");
    const schools = (app.schools || []).filter((s) => s.name);
    schools.forEach((s, i) => {
      sub(`School ${i + 1}`);
      grid([["Name", s.name], ["Address", s.address], ["Attended", `${fmtDate(s.from)}  to  ${fmtDate(s.to)}`], ["Certificate obtained", s.certificate], ["Phone", s.phone], ["Email", s.email]]);
    });

    section("Awards, courses, conferences and certifications");
    const awards = (app.awards || []).filter((a) => a.name);
    if (!awards.length) grid([["Awards", "None declared"]], 1);
    awards.forEach((a, i) => grid([[`Award ${i + 1}`, a.name], ["Date obtained", fmtDate(a.dateObtained)]]));

    section("Volunteer experience");
    const vols = (app.volunteer || []).filter((v) => v.organization);
    if (!vols.length) grid([["Volunteer work", "None declared"]], 1);
    vols.forEach((v, i) => grid([[`Organization ${i + 1}`, v.organization], ["Period", `${fmtDate(v.from)}  to  ${fmtDate(v.to)}`]]));

    section("Relatives in the USA");
    const rel = (app.usRelatives || []).filter((r) => r.lastName);
    if (!rel.length) grid([["Relatives", "None declared"]], 1);
    rel.forEach((r, i) => grid([[`Relative ${i + 1}`, [r.lastName, r.otherNames].filter(Boolean).join(" ")], ["Relationship", r.relationship], ["State of residence", r.stateOfResidence]], 3));

    section("Social media handles");
    const so = app.social || {};
    grid([["Facebook", so.facebook], ["Instagram", so.instagram], ["Twitter / X", so.twitter], ["LinkedIn", so.linkedin]]);

    section("Two references (non-relatives)");
    (app.references || []).forEach((r, i) => {
      sub(`Reference ${i + 1}`);
      grid([["Name", [r.lastName, r.otherNames].filter(Boolean).join(" ")], ["Phone", r.phone], ["Email", r.email], ["Address", r.address]]);
    });

    // ── documents + payment ──
    section("Uploaded documents");
    const docs = app.documents || {};
    grid([
      ["Passport photograph", docs.passportPhoto?.name ? "Uploaded" : "Missing"],
      ["I-20 document", docs.i20?.name ? "Uploaded" : "Missing"],
      ["Passport bio-data page", docs.passportBio?.name ? "Uploaded" : "Missing"],
    ], 3);

    if (payment) {
      section("Payment");
      grid([
        ["Amount paid", naira(payment.totalAmount, payment.currency)], ["Status", cap(payment.status)],
        ["Payment code", payment.paymentCode], ["Transaction reference", payment.transactionRef],
        ["Paid on", fmtDate(payment.paidAt)], ["Method", cap(payment.paymentMethod)],
      ]);
    }

    // ── footers on every page ──
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const y = doc.page.height - 44;
      doc.moveTo(M, y).lineTo(M + W, y).strokeColor(LINE).lineWidth(0.5).stroke();
      doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(
        "GIEVA  |  www.gieva.org  |  contact@gieva.org  |  Abuja: 07035250399  |  Lagos: +2347035250344",
        M, y + 8, { width: W, align: "left", lineBreak: false }
      );
      doc.text(`Page ${i + 1} of ${range.count}`, M, y + 8, { width: W, align: "right", lineBreak: false });
      doc.text("Confidential: contains personal data.", M, y + 19, { width: W, align: "left", lineBreak: false });
    }
    doc.end();
  });
