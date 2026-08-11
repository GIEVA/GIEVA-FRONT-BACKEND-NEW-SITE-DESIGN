

import models from "../models/index.js";

const { Service } = models;

/**
 * Public services
 * Only published services
 */
export const getServices = async (req, res) => {
    console.log("✅ getServices reached");

    try {
        const services = await Service.findAll({
            where: {
                status: "published",
            },
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


export const getService = async (req, res) => {

    try {

        const service = await Service.findOne({
            where: {
                id: req.params.id,
                status: "published",
            },
        });

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