import { Op } from "sequelize";
import models from "../models/index.js";
import { cloudinary } from "../config/cloudinary.js";
import { slugify } from "../utils/slugify.js";

const { Program } = models;

const ensureUniqueSlug = async (base, excludeId = null) => {
  let slug = base;
  let counter = 2;

  while (true) {
    const where = { slug };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const existing = await Program.findOne({ where });
    if (!existing) return slug;

    slug = `${base}-${counter++}`;
  }
};

/**
 * Admin — get all programs (any status)
 */
export const adminGetPrograms = async (req, res) => {
    try {
        const programs = await Program.findAll({
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

/**
 * Admin — get one program
 */
export const adminGetProgram = async (req, res) => {
    try {
        const program = await Program.findByPk(req.params.id);
        if (!program) return res.status(404).json({ message: "Program not found" });
        return res.json(program);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch program" });
    }
};

/**
 * Create program
 */
export const createProgram = async (req, res) => {
    try {
        const files = req.files || [];
        const heroFile = files.find((f) => f.fieldname === "heroImage");

        let sections = [];
        if (req.body.sections) {
            try { sections = JSON.parse(req.body.sections); } catch { sections = []; }
        }

        sections = sections.map((s) => {
            const file = files.find((f) => f.fieldname === `sectionImage_${s.id}`);
            return {
                id: s.id,
                name: s.name || "",
                description: s.description || "",
                imageUrl: file ? file.path : null,
                imageCloudinaryId: file ? file.filename : null,
            };
        });

        const baseSlug = slugify(req.body.slug || req.body.title || "program");
        const slug = await ensureUniqueSlug(baseSlug);

        const program = await Program.create({
            title: req.body.title,
            slug,
            tagline: req.body.tagline,
            description: req.body.description,
            heroImageUrl: heroFile ? heroFile.path : null,
            heroImageCloudinaryId: heroFile ? heroFile.filename : null,
            sections,
            category: req.body.category,
            order: req.body.order,
            status: req.body.status,
            createdBy: req.user.id,
        });

        return res.status(201).json({ message: "Program created successfully", program });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to create program" });
    }
};

/**
 * Update program
 */
export const updateProgram = async (req, res) => {
    try {
        const program = await Program.findByPk(req.params.id);
        if (!program) return res.status(404).json({ message: "Program not found" });

        const files = req.files || [];
        const heroFile = files.find((f) => f.fieldname === "heroImage");

        let heroImageUrl = program.heroImageUrl;
        let heroImageCloudinaryId = program.heroImageCloudinaryId;

        if (heroFile) {
            if (program.heroImageCloudinaryId) {
                try { await cloudinary.uploader.destroy(program.heroImageCloudinaryId); }
                catch (e) { console.error("Cloudinary destroy failed:", e); }
            }
            heroImageUrl = heroFile.path;
            heroImageCloudinaryId = heroFile.filename;
        }

        let incomingSections = [];
        if (req.body.sections) {
            try { incomingSections = JSON.parse(req.body.sections); } catch { incomingSections = []; }
        }

        const oldSections = Array.isArray(program.sections) ? program.sections : [];

        const newSections = incomingSections.map((s) => {
            const file = files.find((f) => f.fieldname === `sectionImage_${s.id}`);
            const oldMatch = oldSections.find((o) => o.id === s.id);

            if (file) {
                // Replacing an image — clean up the old one for this section, if any
                if (oldMatch?.imageCloudinaryId) {
                    cloudinary.uploader
                        .destroy(oldMatch.imageCloudinaryId)
                        .catch((e) => console.error("Cloudinary destroy failed:", e));
                }
                return {
                    id: s.id,
                    name: s.name || "",
                    description: s.description || "",
                    imageUrl: file.path,
                    imageCloudinaryId: file.filename,
                };
            }

            // No new file — keep whatever image this section already had
            return {
                id: s.id,
                name: s.name || "",
                description: s.description || "",
                imageUrl: oldMatch?.imageUrl || null,
                imageCloudinaryId: oldMatch?.imageCloudinaryId || null,
            };
        });

        // Clean up images for sections the admin removed entirely
        const newIds = new Set(newSections.map((s) => s.id));
        const removed = oldSections.filter((o) => !newIds.has(o.id));
        for (const r of removed) {
            if (r.imageCloudinaryId) {
                try { await cloudinary.uploader.destroy(r.imageCloudinaryId); }
                catch (e) { console.error("Cloudinary destroy failed:", e); }
            }
        }

        let slug = program.slug;
        const requestedSlugBase = req.body.slug || req.body.title;
        if (requestedSlugBase) {
            const base = slugify(requestedSlugBase);
            if (base !== program.slug) {
                slug = await ensureUniqueSlug(base, program.id);
            }
        }

        await program.update({
            title: req.body.title,
            slug,
            tagline: req.body.tagline,
            description: req.body.description,
            heroImageUrl,
            heroImageCloudinaryId,
            sections: newSections,
            category: req.body.category,
            order: req.body.order,
            status: req.body.status,
        });

        return res.json({ message: "Program updated", program });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to update program" });
    }
};

/**
 * Delete program
 */
export const deleteProgram = async (req, res) => {
    try {
        const program = await Program.findByPk(req.params.id);
        if (!program) return res.status(404).json({ message: "Program not found" });

        if (program.heroImageCloudinaryId) {
            try { await cloudinary.uploader.destroy(program.heroImageCloudinaryId); }
            catch (e) { console.error("Cloudinary destroy failed:", e); }
        }

        const sections = Array.isArray(program.sections) ? program.sections : [];
        for (const s of sections) {
            if (s.imageCloudinaryId) {
                try { await cloudinary.uploader.destroy(s.imageCloudinaryId); }
                catch (e) { console.error("Cloudinary destroy failed:", e); }
            }
        }

        await program.destroy();
        return res.json({ message: "Program deleted" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete program" });
    }
};

/**
 * Dashboard statistics
 */
export const getProgramStats = async (req, res) => {
    try {
        const total = await Program.count();
        const published = await Program.count({ where: { status: "published" } });
        const drafts = await Program.count({ where: { status: "draft" } });
        const archived = await Program.count({ where: { status: "archived" } });

        return res.json({ total, published, drafts, archived });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch stats" });
    }
};