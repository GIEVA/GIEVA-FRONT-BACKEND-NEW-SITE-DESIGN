import models from "../models/index.js";

const { Project } = models;

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { status: "published" },
      order: [["order", "ASC"], ["createdAt", "DESC"]],
    });
    return res.json(projects);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch projects" });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { slug: req.params.slug, status: "published" },
    });
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json(project);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch project" });
  }
};