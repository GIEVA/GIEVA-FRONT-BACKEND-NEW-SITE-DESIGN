import { Op } from "sequelize";
import models from "../models/index.js";
import { cloudinary } from "../config/cloudinary.js";
import { slugify } from "../utils/slugify.js";

const { Project } = models;

const ensureUniqueSlug = async (base, excludeId = null) => {
  let slug = base;
  let counter = 2;
  while (true) {
    const where = { slug };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await Project.findOne({ where });
    if (!existing) return slug;
    slug = `${base}-${counter++}`;
  }
};

export const adminGetProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      order: [["order", "ASC"], ["createdAt", "DESC"]],
    });
    return res.json(projects);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch projects" });
  }
};

export const adminGetProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json(project);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch project" });
  }
};

export const createProject = async (req, res) => {
  try {
    const baseSlug = slugify(req.body.slug || req.body.title || "project");
    const slug = await ensureUniqueSlug(baseSlug);

    const project = await Project.create({
      title: req.body.title,
      slug,
      description: req.body.description,
      imageUrl: req.file ? req.file.path : null,
      imageCloudinaryId: req.file ? req.file.filename : null,
      category: req.body.category || "General",
      partnerName: req.body.partnerName || null,
      href: req.body.href || null,
      external: req.body.external === "true" || req.body.external === true,
      featured: req.body.featured === "true" || req.body.featured === true,
      order: req.body.order || 0,
      status: req.body.status || "draft",
      createdBy: req.user.id,
    });

    return res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create project" });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (req.file && project.imageCloudinaryId) {
      try { await cloudinary.uploader.destroy(project.imageCloudinaryId); }
      catch (e) { console.error("Cloudinary destroy failed:", e); }
    }

    let slug = project.slug;
    const requestedSlugBase = req.body.slug || req.body.title;
    if (requestedSlugBase) {
      const base = slugify(requestedSlugBase);
      if (base !== project.slug) {
        slug = await ensureUniqueSlug(base, project.id);
      }
    }

    await project.update({
      title: req.body.title,
      slug,
      description: req.body.description,
      imageUrl: req.file ? req.file.path : project.imageUrl,
      imageCloudinaryId: req.file ? req.file.filename : project.imageCloudinaryId,
      category: req.body.category || project.category,
      partnerName: req.body.partnerName ?? project.partnerName,
      href: req.body.href ?? project.href,
      external: req.body.external === "true" || req.body.external === true,
      featured: req.body.featured === "true" || req.body.featured === true,
      order: req.body.order ?? project.order,
      status: req.body.status || project.status,
    });

    return res.json({ message: "Project updated", project });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update project" });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.imageCloudinaryId) {
      try { await cloudinary.uploader.destroy(project.imageCloudinaryId); }
      catch (e) { console.error("Cloudinary destroy failed:", e); }
    }

    await project.destroy();
    return res.json({ message: "Project deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete project" });
  }
};

export const getProjectStats = async (req, res) => {
  try {
    const total = await Project.count();
    const published = await Project.count({ where: { status: "published" } });
    const drafts = await Project.count({ where: { status: "draft" } });
    const archived = await Project.count({ where: { status: "archived" } });

    return res.json({ total, published, drafts, archived });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
};