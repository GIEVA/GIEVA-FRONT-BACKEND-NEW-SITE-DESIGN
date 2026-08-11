import models from "../models/index.js";
import { cloudinary } from "../config/cloudinary.js";

const { Partner } = models;

export const adminGetPartners = async (req, res) => {
    try {
        const partners = await Partner.findAll({
            order: [["order", "ASC"], ["createdAt", "DESC"]],
        });
        return res.json(partners);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch partners" });
    }
};

export const adminGetPartner = async (req, res) => {
    try {
        const partner = await Partner.findByPk(req.params.id);
        if (!partner) return res.status(404).json({ message: "Partner not found" });
        return res.json(partner);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch partner" });
    }
};

export const createPartner = async (req, res) => {
    try {
        const partner = await Partner.create({
            name: req.body.name,
            logoUrl: req.file ? req.file.path : null,
            logoCloudinaryId: req.file ? req.file.filename : null,
            href: req.body.href || "#",
            external: req.body.external === "true" || req.body.external === true,
            order: req.body.order,
            status: req.body.status,
            createdBy: req.user.id,
        });

        return res.status(201).json({ message: "Partner created successfully", partner });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to create partner" });
    }
};

export const updatePartner = async (req, res) => {
    try {
        const partner = await Partner.findByPk(req.params.id);
        if (!partner) return res.status(404).json({ message: "Partner not found" });

        if (req.file && partner.logoCloudinaryId) {
            try { await cloudinary.uploader.destroy(partner.logoCloudinaryId); }
            catch (e) { console.error("Cloudinary destroy failed:", e); }
        }

        await partner.update({
            name: req.body.name,
            logoUrl: req.file ? req.file.path : partner.logoUrl,
            logoCloudinaryId: req.file ? req.file.filename : partner.logoCloudinaryId,
            href: req.body.href || "#",
            external: req.body.external === "true" || req.body.external === true,
            order: req.body.order,
            status: req.body.status,
        });

        return res.json({ message: "Partner updated", partner });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to update partner" });
    }
};

export const deletePartner = async (req, res) => {
    try {
        const partner = await Partner.findByPk(req.params.id);
        if (!partner) return res.status(404).json({ message: "Partner not found" });

        if (partner.logoCloudinaryId) {
            try { await cloudinary.uploader.destroy(partner.logoCloudinaryId); }
            catch (e) { console.error("Cloudinary destroy failed:", e); }
        }

        await partner.destroy();
        return res.json({ message: "Partner deleted" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete partner" });
    }
};

export const getPartnerStats = async (req, res) => {
    try {
        const total = await Partner.count();
        const published = await Partner.count({ where: { status: "published" } });
        const drafts = await Partner.count({ where: { status: "draft" } });
        const archived = await Partner.count({ where: { status: "archived" } });

        return res.json({ total, published, drafts, archived });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch stats" });
    }
};