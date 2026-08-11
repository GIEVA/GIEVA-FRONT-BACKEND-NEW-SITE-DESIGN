import models from "../models/index.js";

const { Staff } = models;

/**
 * Public staff list
 * Only published staff
 */
export const getStaffList = async (req, res) => {
    try {
        const staff = await Staff.findAll({
            where: {
                status: "published",
            },
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

export const getStaff = async (req, res) => {
    try {
        const staff = await Staff.findOne({
            where: {
                id: req.params.id,
                status: "published",
            },
        });

        if (!staff) {
            return res.status(404).json({ message: "Staff member not found" });
        }

        return res.json(staff);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch staff member" });
    }
};