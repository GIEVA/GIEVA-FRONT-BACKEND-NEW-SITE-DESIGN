import express from "express";

import upload
from "../middleware/upload.js";

import {
  authenticate, authorizeRoles
} from "../middleware/auth.js";



import {

  createArticle,
  publishArticle,
  updateArticle,
  getArticles,
  getArticleById,

  deleteArticle,
  archiveArticle,
  scheduleArticle,
  toggleFeaturedArticle,
  getAdminArticles,

} from "../controllers/admin.article.controller.js";

const router =
  express.Router();



// ======================================================
// CREATE ARTICLE
// ======================================================

router.post(
  "/articles",
  authenticate,
  // authorizeRoles(
  //   "admin",
  //   "superadmin"
  // ),
  upload.single("coverImage"),
  createArticle
);

router.post(
  "/upload-image",
  authenticate,
  //authorizeRoles("admin", "superadmin"),
  upload.single("image"),
  async (req, res) => {

    try {

      res.status(200).json({
        imageUrl: req.file.path,
      });

    } catch (err) {

      res.status(500).json({
        message: "Upload failed",
      });
    }
  }
);

// ======================================================
// GET ALL ARTICLES (ADMIN)
// includes drafts/reviews/etc
// ======================================================

router.get(
  "/articles",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  getAdminArticles
);



// ======================================================
// GET SINGLE ARTICLE
// ======================================================

router.get(
  "/articles/:id",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  getArticleById
);



// ======================================================
// UPDATE ARTICLE
// ======================================================

router.put(
  "/articles/:id",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  upload.single("coverImage"),
  updateArticle
);



// ======================================================
// PUBLISH ARTICLE
// ======================================================

router.put(
  "/articles/:id/publish",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  publishArticle
);



// ======================================================
// SCHEDULE ARTICLE
// ======================================================

router.put(
  "/articles/:id/schedule",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  scheduleArticle
);



// ======================================================
// FEATURE ARTICLE
// ======================================================

router.put(
  "/articles/:id/feature",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  toggleFeaturedArticle
);



// ======================================================
// ARCHIVE ARTICLE
// ======================================================

router.put(
  "/articles/:id/archive",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  archiveArticle
);



// ======================================================
// DELETE ARTICLE
// ======================================================

router.delete(
  "/articles/:id",
  authenticate,
  authorizeRoles(
    "admin",
    "superadmin"
  ),
  deleteArticle
);



export default router;