import models from "../models/index.js";
import { cloudinary } from "../config/cloudinary.js";
const { Service } = models;


/**
 * Admin
 * Get all services
 */
export const adminGetServices = async (req, res) => {

    try {

        const services = await Service.findAll({
            order: [
                ["order", "ASC"],
                ["createdAt", "DESC"],
            ],
        });

        return res.json(services);

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch services",
        });
    }
};



/**
 * Create service
 */
// controllers/adminService.controller.js

export const createService = async (req, res) => {
    try {
        let offices = [];
        if (req.body.offices) {
            try { offices = JSON.parse(req.body.offices); } catch { offices = []; }
        }
        let resources = [];
        if (req.body.resources) {
            try { resources = JSON.parse(req.body.resources); } catch { resources = []; }
        }
        let ctaButtons = [];
        if (req.body.ctaButtons) {
            try { ctaButtons = JSON.parse(req.body.ctaButtons); } catch { ctaButtons = []; }
        }

        const service = await Service.create({
            title: req.body.title,
            description: req.body.description,
            content: req.body.content || null,
            iconName: req.body.iconName,
            imageUrl: req.file ? req.file.path : null,
            imageCloudinaryId: req.file ? req.file.filename : null,
            href: req.body.href,
            featured: req.body.featured === "true" || req.body.featured === true,
            category: req.body.category,
            offices,
            resources,
            ctaButtons,
            order: req.body.order,
            status: req.body.status,
            createdBy: req.user.id,
        });

        return res.status(201).json({ message: "Service created successfully", service });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to create service" });
    }
};

export const updateService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) return res.status(404).json({ message: "Service not found" });

        if (req.file && service.imageCloudinaryId) {
            try { await cloudinary.uploader.destroy(service.imageCloudinaryId); }
            catch (cloudErr) { console.error("Cloudinary destroy failed:", cloudErr); }
        }

        let offices = service.offices || [];
        if (req.body.offices) {
            try { offices = JSON.parse(req.body.offices); } catch { offices = service.offices; }
        }
        let resources = service.resources || [];
        if (req.body.resources) {
            try { resources = JSON.parse(req.body.resources); } catch { resources = service.resources; }
        }
        let ctaButtons = service.ctaButtons || [];
        if (req.body.ctaButtons) {
            try { ctaButtons = JSON.parse(req.body.ctaButtons); } catch { ctaButtons = service.ctaButtons; }
        }

        await service.update({
            title: req.body.title,
            description: req.body.description,
            content: req.body.content ?? service.content,
            iconName: req.body.iconName,
            imageUrl: req.file ? req.file.path : service.imageUrl,
            imageCloudinaryId: req.file ? req.file.filename : service.imageCloudinaryId,
            href: req.body.href,
            featured: req.body.featured === "true" || req.body.featured === true,
            category: req.body.category,
            offices,
            resources,
            ctaButtons,
            order: req.body.order,
            status: req.body.status,
        });

        return res.json({ message: "Service updated", service });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to update service" });
    }
};




/**
 * Get one service
 */
export const adminGetService = async (req, res) => {

    try {

        const service =
            await Service.findByPk(req.params.id);

        if (!service) {

            return res.status(404).json({
                message: "Service not found",
            });

        }

        return res.json(service);

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch service",
        });
    }
};



// export const updateService = async (req, res) => {
//     try {
//         const service = await Service.findByPk(req.params.id);
//         if (!service) return res.status(404).json({ message: "Service not found" });

//         // If a new file was uploaded, delete the old Cloudinary asset first
//         if (req.file && service.imageCloudinaryId) {
//             try {
//                 await cloudinary.uploader.destroy(service.imageCloudinaryId);
//             } catch (cloudErr) {
//                 console.error("Cloudinary destroy failed:", cloudErr);
//             }
//         }

//         await service.update({
//             title: req.body.title,
//             description: req.body.description,
//             iconName: req.body.iconName,
//             imageUrl: req.file ? req.file.path : service.imageUrl,
//             imageCloudinaryId: req.file ? req.file.filename : service.imageCloudinaryId,
//             href: req.body.href,
//             featured: req.body.featured,
//             category: req.body.category,
//             order: req.body.order,
//             status: req.body.status,
//         });

//         return res.json({ message: "Service updated", service });

//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: "Failed to update service" });
//     }
// };


/**
 * Delete
 */
export const deleteService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Clean up the Cloudinary asset before removing the DB row
        if (service.imageCloudinaryId) {
            try {
                await cloudinary.uploader.destroy(service.imageCloudinaryId);
            } catch (cloudErr) {
                // Don't block deletion if Cloudinary cleanup fails —
                // just log it so it doesn't silently orphan forever
                console.error("Cloudinary destroy failed:", cloudErr);
            }
        }

        await service.destroy();

        return res.json({ message: "Service deleted" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete service" });
    }
};




/**
 * Dashboard statistics
 */
export const getServiceStats = async (req, res) => {

    try {

        const total =
            await Service.count();

        const published =
            await Service.count({
                where: {
                    status: "published",
                },
            });

        const drafts =
            await Service.count({
                where: {
                    status: "draft",
                },
            });

        const archived =
            await Service.count({
                where: {
                    status: "archived",
                },
            });

        const featured =
            await Service.count({
                where: {
                    featured: true,
                },
            });

        return res.json({

            total,

            published,

            drafts,

            archived,

            featured,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch stats",
        });
    }
};