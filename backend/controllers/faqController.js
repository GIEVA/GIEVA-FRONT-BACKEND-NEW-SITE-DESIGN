import models from "../models/index.js";

const { Faq } = models;

export const getFaqs = async (req, res) => {
  try {
    const faqs = await Faq.findAll({
      where: { status: "published" },
      order: [["category", "ASC"], ["order", "ASC"], ["createdAt", "DESC"]],
    });
    return res.json(faqs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch FAQs" });
  }
};