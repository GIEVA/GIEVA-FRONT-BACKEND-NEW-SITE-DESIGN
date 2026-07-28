import models from "../models/index.js";

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
export const createService = async (req, res) => {

    try {

        const service = await Service.create({

            title: req.body.title,

            description: req.body.description,

            iconName: req.body.iconName,

            imageUrl: req.body.imageUrl,

            imageCloudinaryId:
                req.body.imageCloudinaryId,

            href: req.body.href,

            featured: req.body.featured,

            category: req.body.category,

            order: req.body.order,

            status: req.body.status,

            createdBy: req.user.id,
        });

        return res.status(201).json({
            message: "Service created successfully",
            service,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Failed to create service",
        });
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



/**
 * Update
 */
export const updateService = async (req, res) => {

    try {

        const service =
            await Service.findByPk(req.params.id);

        if (!service) {

            return res.status(404).json({
                message: "Service not found",
            });

        }

        await service.update({

            title: req.body.title,

            description: req.body.description,

            iconName: req.body.iconName,

            imageUrl: req.body.imageUrl,

            imageCloudinaryId:
                req.body.imageCloudinaryId,

            href: req.body.href,

            featured: req.body.featured,

            category: req.body.category,

            order: req.body.order,

            status: req.body.status,
        });

        return res.json({
            message: "Service updated",
            service,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Failed to update service",
        });
    }
};



/**
 * Delete
 */
export const deleteService = async (req, res) => {

    try {

        const service =
            await Service.findByPk(req.params.id);

        if (!service) {

            return res.status(404).json({
                message: "Service not found",
            });

        }

        await service.destroy();

        return res.json({
            message: "Service deleted",
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Failed to delete service",
        });
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