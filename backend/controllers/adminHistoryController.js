import models from "../models/index.js";
import { cloudinary } from "../config/cloudinary.js";

const { HistoryPage } = models;

const getSingleton = async () => {
  // History is a single page — always operate on the first (and only) row
  let page = await HistoryPage.findOne({ order: [["id", "ASC"]] });
  return page;
};

/**
 * Admin — get the history page record (creates a blank draft if none exists yet)
 */
export const adminGetHistory = async (req, res) => {
  try {
    let page = await getSingleton();
    if (!page) {
      page = await HistoryPage.create({}); // defaults kick in
    }
    return res.json(page);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch history page" });
  }
};

/**
 * Admin — create or update the history page (upsert on the singleton row)
 * Expects multipart/form-data:
 *  - sidebarImage (optional file)
 *  - introParagraphs (JSON string array)
 *  - timeline (JSON string array of { id, year, title, text })
 *  - heroTitle, heroBreadcrumb, introEyebrow, introTitle,
 *    sidebarEyebrow, sidebarTitle, sidebarDescription, sidebarImageAlt, status
 */
export const upsertHistory = async (req, res) => {
  try {
    const files = req.files || [];
    const sidebarFile = files.find((f) => f.fieldname === "sidebarImage");

    let introParagraphs = [];
    if (req.body.introParagraphs) {
      try { introParagraphs = JSON.parse(req.body.introParagraphs); } catch { introParagraphs = []; }
    }

    let timeline = [];
    if (req.body.timeline) {
      try { timeline = JSON.parse(req.body.timeline); } catch { timeline = []; }
    }
    // Normalize timeline entries
    timeline = timeline.map((t, i) => ({
      id: t.id || `t${i + 1}`,
      year: t.year || "",
      title: t.title || "",
      text: t.text || "",
    }));

    let page = await getSingleton();

    let sidebarImageUrl = page?.sidebarImageUrl || null;
    let sidebarImageCloudinaryId = page?.sidebarImageCloudinaryId || null;

    if (sidebarFile) {
      if (page?.sidebarImageCloudinaryId) {
        try { await cloudinary.uploader.destroy(page.sidebarImageCloudinaryId); }
        catch (e) { console.error("Cloudinary destroy failed:", e); }
      }
      sidebarImageUrl = sidebarFile.path;
      sidebarImageCloudinaryId = sidebarFile.filename;
    }

    const payload = {
      heroTitle: req.body.heroTitle,
      heroBreadcrumb: req.body.heroBreadcrumb,
      introEyebrow: req.body.introEyebrow,
      introTitle: req.body.introTitle,
      introParagraphs,
      sidebarEyebrow: req.body.sidebarEyebrow,
      sidebarTitle: req.body.sidebarTitle,
      sidebarDescription: req.body.sidebarDescription,
      sidebarImageUrl,
      sidebarImageCloudinaryId,
      sidebarImageAlt: req.body.sidebarImageAlt,
      timeline,
      status: req.body.status || page?.status || "draft",
      updatedBy: req.user.id,
    };

    if (page) {
      await page.update(payload);
    } else {
      page = await HistoryPage.create(payload);
    }

    return res.json({ message: "History page saved", page });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to save history page" });
  }
};

/**
 * Admin — reset the history page (clears image + content, keeps the row)
 */
export const resetHistory = async (req, res) => {
  try {
    const page = await getSingleton();
    if (!page) return res.status(404).json({ message: "History page not found" });

    if (page.sidebarImageCloudinaryId) {
      try { await cloudinary.uploader.destroy(page.sidebarImageCloudinaryId); }
      catch (e) { console.error("Cloudinary destroy failed:", e); }
    }

    await page.update({
      heroTitle: "Our History",
      heroBreadcrumb: "Our History",
      introEyebrow: null,
      introTitle: null,
      introParagraphs: [],
      sidebarEyebrow: null,
      sidebarTitle: null,
      sidebarDescription: null,
      sidebarImageUrl: null,
      sidebarImageCloudinaryId: null,
      sidebarImageAlt: null,
      timeline: [],
      status: "draft",
      updatedBy: req.user.id,
    });

    return res.json({ message: "History page reset", page });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to reset history page" });
  }
};