import models from "../models/index.js";

const { Faq } = models;

export const adminGetFaqs = async (req, res) => {
  try {
    const faqs = await Faq.findAll({
      order: [["category", "ASC"], ["order", "ASC"], ["createdAt", "DESC"]],
    });
    return res.json(faqs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch FAQs" });
  }
};

export const adminGetFaq = async (req, res) => {
  try {
    const faq = await Faq.findByPk(req.params.id);
    if (!faq) return res.status(404).json({ message: "FAQ not found" });
    return res.json(faq);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch FAQ" });
  }
};

export const createFaq = async (req, res) => {
  try {
    const faq = await Faq.create({
      question: req.body.question,
      answer: req.body.answer,
      category: req.body.category || "General",
      order: req.body.order || 0,
      status: req.body.status || "draft",
      createdBy: req.user.id,
    });

    return res.status(201).json({ message: "FAQ created successfully", faq });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create FAQ" });
  }
};

export const updateFaq = async (req, res) => {
  try {
    const faq = await Faq.findByPk(req.params.id);
    if (!faq) return res.status(404).json({ message: "FAQ not found" });

    await faq.update({
      question: req.body.question,
      answer: req.body.answer,
      category: req.body.category || faq.category,
      order: req.body.order ?? faq.order,
      status: req.body.status || faq.status,
    });

    return res.json({ message: "FAQ updated", faq });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update FAQ" });
  }
};

export const deleteFaq = async (req, res) => {
  try {
    const faq = await Faq.findByPk(req.params.id);
    if (!faq) return res.status(404).json({ message: "FAQ not found" });

    await faq.destroy();
    return res.json({ message: "FAQ deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete FAQ" });
  }
};

export const getFaqStats = async (req, res) => {
  try {
    const total = await Faq.count();
    const published = await Faq.count({ where: { status: "published" } });
    const drafts = await Faq.count({ where: { status: "draft" } });
    const archived = await Faq.count({ where: { status: "archived" } });

    return res.json({ total, published, drafts, archived });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
};