import models from "../models/index.js";
import { cloudinary } from "../config/cloudinary.js";

const { Staff } = models;

/**
 * Admin — get all staff (any status)
 */
export const adminGetStaffList = async (req, res) => {
    try {
        const staff = await Staff.findAll({
            order: [
                ["order", "ASC"],
                ["createdAt", "DESC"],
            ],
        });

        return res.json(staff);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch staff" });
    }
};

/**
 * Admin — get one staff member
 */
export const adminGetStaff = async (req, res) => {
    try {
        const staff = await Staff.findByPk(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: "Staff member not found" });
        }

        return res.json(staff);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch staff member" });
    }
};

/**
 * Create staff member
 */
export const createStaff = async (req, res) => {
    try {
        let socials = {};
        if (req.body.socials) {
            try {
                socials = JSON.parse(req.body.socials);
            } catch {
                socials = {};
            }
        }

        const staff = await Staff.create({
            name: req.body.name,
            role: req.body.role,
            bio: req.body.bio || "",
            imageUrl: req.file ? req.file.path : null,
            imageCloudinaryId: req.file ? req.file.filename : null,
            socials,
            order: req.body.order,
            status: req.body.status,
            createdBy: req.user.id,
        });

        return res.status(201).json({ message: "Staff member created successfully", staff });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to create staff member" });
    }
};

/**
 * Update staff member
 */
export const updateStaff = async (req, res) => {
    try {
        const staff = await Staff.findByPk(req.params.id);
        if (!staff) return res.status(404).json({ message: "Staff member not found" });

        // If a new image was uploaded, delete the old Cloudinary asset first
        if (req.file && staff.imageCloudinaryId) {
            try {
                await cloudinary.uploader.destroy(staff.imageCloudinaryId);
            } catch (cloudErr) {
                console.error("Cloudinary destroy failed:", cloudErr);
            }
        }

        let socials = staff.socials;
        if (req.body.socials) {
            try {
                socials = JSON.parse(req.body.socials);
            } catch {
                // keep existing socials if parsing fails
            }
        }

        await staff.update({
            name: req.body.name,
            role: req.body.role,
            bio: req.body.bio || "",
            imageUrl: req.file ? req.file.path : staff.imageUrl,
            imageCloudinaryId: req.file ? req.file.filename : staff.imageCloudinaryId,
            socials,
            order: req.body.order,
            status: req.body.status,
        });

        return res.json({ message: "Staff member updated", staff });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to update staff member" });
    }
};

/**
 * Delete staff member
 */
export const deleteStaff = async (req, res) => {
    try {
        const staff = await Staff.findByPk(req.params.id);

        if (!staff) {
            return res.status(404).json({ message: "Staff member not found" });
        }

        if (staff.imageCloudinaryId) {
            try {
                await cloudinary.uploader.destroy(staff.imageCloudinaryId);
            } catch (cloudErr) {
                console.error("Cloudinary destroy failed:", cloudErr);
            }
        }

        await staff.destroy();

        return res.json({ message: "Staff member deleted" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete staff member" });
    }
};

/**
 * Dashboard statistics
 */
export const getStaffStats = async (req, res) => {
    try {
        const total = await Staff.count();
        const published = await Staff.count({ where: { status: "published" } });
        const drafts = await Staff.count({ where: { status: "draft" } });
        const archived = await Staff.count({ where: { status: "archived" } });

        return res.json({ total, published, drafts, archived });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch stats" });
    }
};