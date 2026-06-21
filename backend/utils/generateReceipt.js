// utils/generateReceipt.js

import PDFDocument from "pdfkit";

export const generateReceiptPDF = (data) => {
  const doc = new PDFDocument({ margin: 50 });

  const buffers = [];

  doc.on("data", buffers.push.bind(buffers));

  return new Promise((resolve) => {
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // ---------------- CONTENT ----------------
    doc.fontSize(20).text("Payment Receipt", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Name: ${data.fullName}`);
    doc.text(`Email: ${data.email}`);
    doc.moveDown();

    doc.text(`Course: ${data.courseTitle}`);
    doc.text(`Duration: ${data.duration || "N/A"}`);
    doc.moveDown();

    doc.text(`Amount: ${data.currency} ${data.amount}`);
    doc.text(`Payment Method: ${data.paymentMethod}`);
    doc.text(`Reference: ${data.reference}`);
    doc.text(`Date: ${data.date}`);
    doc.moveDown();

    doc.text("Status: SUCCESS", { color: "green" });

    doc.end();
  });
};