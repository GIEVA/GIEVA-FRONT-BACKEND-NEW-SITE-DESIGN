// controllers/export.controller.js

import models from "../models/index.js";
import { Parser } from "json2csv";

const { CampaignRegistration, Campaign, Notification } = models;

export const exportRegistrationsCSV = async (req, res) => {
  try {
    const registrations = await CampaignRegistration.findAll({
      include: [{ model: Campaign }],
      raw: true,
      nest: true,
    });

    const formatted = registrations.map(r => ({
      fullName: r.fullName,
      email: r.email,
      phoneNumber: r.phoneNumber,
      campaign: r.Campaign?.title,
      createdAt: r.createdAt,
    }));

    const parser = new Parser();
    const csv = parser.parse(formatted);

    res.header("Content-Type", "text/csv");
    res.attachment("registrations.csv");
    return res.send(csv);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Export failed" });
  }
};

import ExcelJS from "exceljs";

export const exportRegistrationsExcel = async (req, res) => {
  try {
    const registrations = await Registration.findAll({
      include: [{ model: Campaign }],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Registrations");

    sheet.columns = [
      { header: "Full Name", key: "fullName" },
      { header: "Email", key: "email" },
      { header: "Phone", key: "phoneNumber" },
      { header: "Campaign", key: "campaign" },
      { header: "Date", key: "createdAt" },
    ];

    registrations.forEach(r => {
      sheet.addRow({
        fullName: r.fullName,
        email: r.email,
        phoneNumber: r.phoneNumber,
        campaign: r.Campaign?.title,
        createdAt: r.createdAt,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=registrations.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Excel export failed" });
  }
};