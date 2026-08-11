import models from "../models/index.js";

const { Program } = models;

export const getPrograms = async (req, res) => {
    try {
        const programs = await Program.findAll({
            where: { status: "published" },
            order: [
                ["order", "ASC"],
                ["createdAt", "DESC"],
            ],
        });
        return res.json(programs);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch programs" });
    }
};

export const getProgram = async (req, res) => {
    try {
        const program = await Program.findOne({
            where: {
                slug: req.params.slug,
                status: "published",
            },
        });

        if (!program) {
            return res.status(404).json({ message: "Program not found" });
        }

        return res.json(program);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch program" });
    }
};