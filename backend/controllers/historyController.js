import models from "../models/index.js";

const { HistoryPage } = models;

export const getHistory = async (req, res) => {
  try {
    const page = await HistoryPage.findOne({
      where: { status: "published" },
      order: [["id", "ASC"]],
    });

    if (!page) {
      return res.status(404).json({ message: "History page not found" });
    }

    return res.json(page);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch history page" });
  }
};