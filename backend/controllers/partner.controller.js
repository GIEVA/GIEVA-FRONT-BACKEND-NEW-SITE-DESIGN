import models from "../models/index.js";

const { Partner } = models;

export const getPartners = async (req, res) => {
    try {
        const partners = await Partner.findAll({
            where: { status: "published" },
            order: [["order", "ASC"], ["createdAt", "DESC"]],
        });
        return res.json(partners);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch partners" });
    }
};