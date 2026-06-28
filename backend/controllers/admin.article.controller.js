
  // controllers/admin.article.controller.js
// FIXES:
//   - updateArticle: `id` is now read from req.params, `transaction` removed
//   - getAdminArticles: added Op import at the top of the file
//   - updateArticle: now handles tags/seoKeywords JSON parsing like createArticle does
//   - publishArticle: accepts both admin and superadmin roles
//   - All functions consistent with the Article model fields

import { Op } from "sequelize";
import models from "../models/index.js";
import { cloudinary } from "../config/cloudinary.js";
import { slugify } from "../utils/slugify.js";
import { calculateReadingTime } from "../utils/readingTime.js";

const { Article, ActivityLog, User } = models;

// ──────────────────────────────────────────────────────────────
// CREATE ARTICLE
// ──────────────────────────────────────────────────────────────

export const createArticle = async (req, res) => {
  try {
    if (!["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Admins only" });
    }

    const {
      title, subtitle, excerpt, content,
      category, tags, seoTitle, seoDescription, seoKeywords,
      isFeatured, allowComments, status,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    // Unique slug — strip HTML from title first for clean slug
    const plainTitle = title.replace(/<[^>]*>/g, "").trim();
    let slug = slugify(plainTitle);
    const existing = await Article.findOne({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    // Cover image
    let coverImageUrl = null;
    let coverImagePublicId = null;
    if (req.file) {
      coverImageUrl = req.file.path;
      coverImagePublicId = req.file.filename;
    }

    // Parse JSON fields (sent as strings in FormData)
    const parsedTags     = tags        ? JSON.parse(tags)        : [];
    const parsedKeywords = seoKeywords ? JSON.parse(seoKeywords) : [];

    const article = await Article.create({
      title,          // stored as inline HTML, e.g. "Hello <strong>World</strong>"
      subtitle,
      excerpt,
      slug,
      content,
      category,
      tags:           parsedTags,
      seoTitle,
      seoDescription,
      seoKeywords:    parsedKeywords,
      isFeatured:     isFeatured === "true",
      allowComments:  allowComments !== "false",
      status:         status || "draft",
      readingTime:    calculateReadingTime(content),
      coverImageUrl,
      coverImagePublicId,
      authorId:       req.user.id,
      publishedAt:    status === "published" ? new Date() : null,
    });

    await ActivityLog.create({
      userId: req.user.id,
      action: "ARTICLE_CREATED",
      meta:   { articleId: article.id },
    });

    res.status(201).json({ message: "Article created successfully", article });
  } catch (error) {
    console.error("Create Article Error:", error);
    res.status(500).json({ message: "Failed to create article" });
  }
};

// ──────────────────────────────────────────────────────────────
// UPDATE ARTICLE  — FIXED: was referencing undefined `id` and `transaction`
// ──────────────────────────────────────────────────────────────

export const updateArticle = async (req, res) => {
  try {
    const { id } = req.params; // ← FIX: was `id` from thin air

    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ message: "Article not found" });

    const updateData = { ...req.body };

    // Re-slug from plain title if title changes
    if (updateData.title) {
      const plainTitle = updateData.title.replace(/<[^>]*>/g, "").trim();
      updateData.slug = slugify(plainTitle);
    }

    // Recalculate reading time if content changes
    if (updateData.content) {
      updateData.readingTime = calculateReadingTime(updateData.content);
    }

    // Parse JSON string fields coming from FormData
    if (typeof updateData.tags === "string") {
      try { updateData.tags = JSON.parse(updateData.tags); } catch { delete updateData.tags; }
    }
    if (typeof updateData.seoKeywords === "string") {
      try { updateData.seoKeywords = JSON.parse(updateData.seoKeywords); } catch { delete updateData.seoKeywords; }
    }
    if (typeof updateData.isFeatured === "string") {
      updateData.isFeatured = updateData.isFeatured === "true";
    }
    if (typeof updateData.allowComments === "string") {
      updateData.allowComments = updateData.allowComments !== "false";
    }

    // New cover image
    if (req.file) {
      // Delete old image from Cloudinary
      if (article.coverImagePublicId) {
        await cloudinary.uploader.destroy(article.coverImagePublicId).catch(() => {});
      }
      updateData.coverImageUrl      = req.file.path;
      updateData.coverImagePublicId = req.file.filename;
    }

    // Set publishedAt if going live for the first time
    if (updateData.status === "published" && !article.publishedAt) {
      updateData.publishedAt = new Date();
    }

    await article.update(updateData); // ← FIX: no transaction

    await ActivityLog.create({       // ← FIX: uses `id` from req.params
      userId: req.user.id,
      action: "ARTICLE_UPDATED",
      meta:   { articleId: id },
    });

    res.json({ message: "Article updated", article });
  } catch (error) {
    console.error("Update Article Error:", error);
    res.status(500).json({ message: "Failed to update article" });
  }
};

// ──────────────────────────────────────────────────────────────
// PUBLISH ARTICLE
// ──────────────────────────────────────────────────────────────

export const publishArticle = async (req, res) => {
  try {
    if (!["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Admins only" });
    }

    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });

    await article.update({
      status:      "published",
      publishedAt: article.publishedAt || new Date(),
    });

    await ActivityLog.create({
      userId: req.user.id,
      action: "ARTICLE_PUBLISHED",
      meta:   { articleId: req.params.id },
    });

    res.json({ message: "Article published" });
  } catch (error) {
    console.error("Publish Error:", error);
    res.status(500).json({ message: "Failed to publish article" });
  }
};

// ──────────────────────────────────────────────────────────────
// GET PUBLIC ARTICLES
// ──────────────────────────────────────────────────────────────

export const getArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({
      where: { status: "published" },
      order: [["publishedAt", "DESC"]],
      include: [{ model: User, as: "author", attributes: ["id", "fullName"] }],
    });
    res.json({ articles });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch articles" });
  }
};

// ──────────────────────────────────────────────────────────────
// GET SINGLE ARTICLE (public)
// ──────────────────────────────────────────────────────────────

export const getArticleById = async (req, res) => {
  try {
    const article = await Article.findOne({
      where: { id: req.params.id, status: "published" },
      include: [{ model: User, as: "author", attributes: ["id", "fullName"] }],
    });
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.json({ article });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch article" });
  }
};

// ──────────────────────────────────────────────────────────────
// GET ADMIN ARTICLES  — FIXED: Op is now imported
// ──────────────────────────────────────────────────────────────

export const getAdminArticles = async (req, res) => {
  try {
    let { page = 1, limit = 10, status, search } = req.query;
    page  = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;
    const where  = {};

    if (status) where.status = status;

    if (search) {
      where[Op.or] = [
        { title:    { [Op.like]: `%${search}%` } },
        { subtitle: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await Article.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [{ model: User, as: "author", attributes: ["id", "fullName", "email"] }],
    });

    res.json({
      total:       count,
      currentPage: page,
      totalPages:  Math.ceil(count / limit),
      articles:    rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch admin articles" });
  }
};

// ──────────────────────────────────────────────────────────────
// GET SINGLE ARTICLE (admin — includes all statuses)
// ──────────────────────────────────────────────────────────────

export const getAdminArticleById = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [{ model: User, as: "author", attributes: ["id", "fullName", "email"] }],
    });
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.json({ article });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch article" });
  }
};

// ──────────────────────────────────────────────────────────────
// DELETE ARTICLE
// ──────────────────────────────────────────────────────────────

export const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });

    if (article.coverImagePublicId) {
      await cloudinary.uploader.destroy(article.coverImagePublicId).catch(() => {});
    }

    await article.destroy();

    await ActivityLog.create({
      userId: req.user.id,
      action: "ARTICLE_DELETED",
      meta:   { articleId: article.id },
    });

    res.json({ message: "Article deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete article" });
  }
};

// ──────────────────────────────────────────────────────────────
// ARCHIVE ARTICLE
// ──────────────────────────────────────────────────────────────

export const archiveArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });

    await article.update({ status: "archived" });

    await ActivityLog.create({
      userId: req.user.id,
      action: "ARTICLE_ARCHIVED",
      meta:   { articleId: article.id },
    });

    res.json({ message: "Article archived successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to archive article" });
  }
};

// ──────────────────────────────────────────────────────────────
// SCHEDULE ARTICLE
// ──────────────────────────────────────────────────────────────

export const scheduleArticle = async (req, res) => {
  try {
    const { publishDate } = req.body;
    if (!publishDate) return res.status(400).json({ message: "publishDate is required" });

    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });

    await article.update({ status: "scheduled", scheduledPublishAt: publishDate });

    await ActivityLog.create({
      userId: req.user.id,
      action: "ARTICLE_SCHEDULED",
      meta:   { articleId: article.id, publishDate },
    });

    res.json({ message: "Article scheduled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to schedule article" });
  }
};

// ──────────────────────────────────────────────────────────────
// TOGGLE FEATURED
// ──────────────────────────────────────────────────────────────

export const toggleFeaturedArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });

    await article.update({ isFeatured: !article.isFeatured });

    await ActivityLog.create({
      userId: req.user.id,
      action: article.isFeatured ? "ARTICLE_FEATURED" : "ARTICLE_UNFEATURED",
      meta:   { articleId: article.id },
    });

    res.json({
      message: article.isFeatured ? "Article featured" : "Article removed from featured",
      article,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update featured status" });
  }
};





// import models from "../models/index.js";
// import { cloudinary } from "../config/cloudinary.js";

// import { slugify } from "../utils/slugify.js"; 

// import { calculateReadingTime } from "../utils/readingTime.js";

// const {
//   Article,
//   ActivityLog,
//   User,
// } = models;



// export const createArticle =
//   async (req, res) => {

//     try {

//       if (
//         !["admin", "superadmin"]
//           .includes(req.user.role)
//       ) {

//         return res.status(403).json({
//           message:
//             "Admins only",
//         });
//       }



//       const {
//         title,
//         subtitle,
//         excerpt,
//         content,
//         category,
//         tags,
//         seoTitle,
//         seoDescription,
//         seoKeywords,
//         isFeatured,
//         allowComments,
//         status,
//       } = req.body;



//       if (!title || !content) {

//         return res.status(400).json({
//           message:
//             "Title and content are required",
//         });
//       }



//       // ======================================================
//       // UNIQUE SLUG
//       // ======================================================

//       let slug =
//         slugify(title);

//       const existing =
//         await Article.findOne({
//           where: { slug },
//         });

//       if (existing) {

//         slug =
//           `${slug}-${Date.now()}`;
//       }



//       // ======================================================
//       // IMAGE
//       // ======================================================

//       let coverImageUrl =
//         null;

//       let coverImagePublicId =
//         null;

//       if (req.file) {

//         coverImageUrl =
//           req.file.path;

//         coverImagePublicId =
//           req.file.filename;
//       }



//       // ======================================================
//       // PARSE JSON FIELDS
//       // ======================================================

//       const parsedTags =
//         tags
//           ? JSON.parse(tags)
//           : [];

//       const parsedKeywords =
//         seoKeywords
//           ? JSON.parse(seoKeywords)
//           : [];



//       // ======================================================
//       // CREATE ARTICLE
//       // ======================================================

//       const article =
//         await Article.create({

//           title,
//           subtitle,
//           excerpt,

//           slug,

//           content,

//           category,

//           tags:
//             parsedTags,

//           seoTitle,
//           seoDescription,

//           seoKeywords:
//             parsedKeywords,

//           isFeatured:
//             isFeatured === "true",

//           allowComments:
//             allowComments !== "false",

//           status:
//             status || "draft",

//           readingTime:
//             calculateReadingTime(
//               content
//             ),

//           coverImageUrl,
//           coverImagePublicId,

//           authorId:
//             req.user.id,

//           publishedAt:
//             status === "published"
//               ? new Date()
//               : null,
//         });



//       // ======================================================
//       // LOG
//       // ======================================================

//       await ActivityLog.create({

//         userId:
//           req.user.id,

//         action:
//           "ARTICLE_CREATED",

//         meta: {
//           articleId:
//             article.id,
//         },
//       });



//       res.status(201).json({

//         message:
//           "Article created successfully",

//         article,
//       });

//     } catch (error) {

//       console.error(
//         "Create Article Error:",
//         error
//       );

//       res.status(500).json({
//         message:
//           "Failed to create article",
//       });
//     }
//   };


// export const publishArticle = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ message: "Admins only" });
//     }

//     const { id } = req.params;

//     const article = await Article.findByPk(id);

//     if (!article) {
//       return res.status(404).json({ message: "Article not found" });
//     }

//     await article.update({
//       status: "published",
//       publishedAt: new Date(),
//     });

//     await ActivityLog.create({
//       userId: req.user.id,
//       action: "ARTICLE_PUBLISHED",
//       meta: { articleId: id },
//     });

//     res.status(200).json({
//       message: "Article published",
//     });

//   } catch (error) {
//     console.error("Publish Error:", error);
//     res.status(500).json({
//       message: "Failed to publish article",
//     });
//   }
// };


// export const updateArticle = async (req, res) => {
//   try {
//     const article = await Article.findByPk(req.params.id);

//     if (!article) {
//       return res.status(404).json({ message: "Article not found" });
//     }

//     const updateData = { ...req.body };

//     if (updateData.title) {
//       updateData.slug = slugify(updateData.title);
//     }

//     if (updateData.content) {
//       updateData.readingTime = calculateReadingTime(updateData.content);
//     }

//     if (req.file) {
//       updateData.coverImageUrl = req.file.path;
//       updateData.coverImagePublicId = req.file.filename;
//     }

//      await ActivityLog.create({
//       userId: req.user.id,
//       action: "ARTICLE_UPDATED",
//       meta: { articleId: id },
//     }, { transaction });


//     await article.update(updateData);

//     res.json({ message: "Article updated", article });

//   } catch (error) {
//     res.status(500).json({ message: "Failed to update article" });
//   }
// };


// export const getArticles = async (req, res) => {
//   try {
//     const articles = await Article.findAll({
//       where: { status: "published" },
//       order: [["publishedAt", "DESC"]],
//     });

//     res.json({ articles });

//   } catch (error) {
//     res.status(500).json({
//       message: "Failed to fetch articles",
//     });
//   }
// };


// export const getArticleById = async (req, res) => {
//   try {
//     const article = await Article.findOne({
//       where: {
//         id: req.params.id,
//         status: "published",
//       },
//     });

//     if (!article) {
//       return res.status(404).json({
//         message: "Article not found",
//       });
//     }

//     res.json({ article });

//   } catch (error) {
//     res.status(500).json({
//       message: "Failed to fetch article",
//     });
//   }
// };

// // ======================================================
// // GET ADMIN ARTICLES
// // includes drafts, archived, scheduled, published
// // ======================================================

// export const getAdminArticles =
//   async (req, res) => {

//     try {

//       let {
//         page = 1,
//         limit = 10,
//         status,
//         search,
//       } = req.query;

//       page =
//         parseInt(page);

//       limit =
//         parseInt(limit);

//       const offset =
//         (page - 1) * limit;

//       const where = {};



//       if (status) {

//         where.status =
//           status;
//       }



//       if (search) {

//         where[Op.or] = [

//           {
//             title: {
//               [Op.like]:
//                 `%${search}%`,
//             },
//           },

//           {
//             subtitle: {
//               [Op.like]:
//                 `%${search}%`,
//             },
//           },

//           {
//             category: {
//               [Op.like]:
//                 `%${search}%`,
//             },
//           },
//         ];
//       }



//       const {
//         rows,
//         count,
//       } =
//         await Article.findAndCountAll({

//           where,

//           limit,

//           offset,

//           order: [
//             ["createdAt", "DESC"],
//           ],

//           include: [

//             {
//               model: User,

//               as: "author",

//               attributes: [
//                 "id",
//                 "fullName",
//                 "email",
//               ],
//             },
//           ],
//         });



//       res.json({

//         total:
//           count,

//         currentPage:
//           page,

//         totalPages:
//           Math.ceil(
//             count / limit
//           ),

//         articles:
//           rows,
//       });

//     } catch (err) {

//       console.error(err);

//       res.status(500).json({
//         message:
//           "Failed to fetch admin articles",
//       });
//     }
//   };



// // ======================================================
// // DELETE ARTICLE
// // ======================================================

// export const deleteArticle =
//   async (req, res) => {

//     try {

//       const article =
//         await Article.findByPk(
//           req.params.id
//         );

//       if (!article) {

//         return res.status(404).json({
//           message:
//             "Article not found",
//         });
//       }



//       // DELETE IMAGE
//       if (
//         article.coverImagePublicId
//       ) {

//         await cloudinary.uploader.destroy(
//           article.coverImagePublicId
//         );
//       }



//       await article.destroy();



//       await ActivityLog.create({

//         userId:
//           req.user.id,

//         action:
//           "ARTICLE_DELETED",

//         meta: {
//           articleId:
//             article.id,
//         },
//       });



//       res.json({
//         message:
//           "Article deleted successfully",
//       });

//     } catch (err) {

//       console.error(err);

//       res.status(500).json({
//         message:
//           "Failed to delete article",
//       });
//     }
//   };



// // ======================================================
// // ARCHIVE ARTICLE
// // ======================================================

// export const archiveArticle =
//   async (req, res) => {

//     try {

//       const article =
//         await Article.findByPk(
//           req.params.id
//         );

//       if (!article) {

//         return res.status(404).json({
//           message:
//             "Article not found",
//         });
//       }



//       article.status =
//         "archived";

//       await article.save();



//       await ActivityLog.create({

//         userId:
//           req.user.id,

//         action:
//           "ARTICLE_ARCHIVED",

//         meta: {
//           articleId:
//             article.id,
//         },
//       });



//       res.json({
//         message:
//           "Article archived successfully",
//       });

//     } catch (err) {

//       console.error(err);

//       res.status(500).json({
//         message:
//           "Failed to archive article",
//       });
//     }
//   };



// // ======================================================
// // SCHEDULE ARTICLE
// // ======================================================

// export const scheduleArticle =
//   async (req, res) => {

//     try {

//       const {
//         publishDate,
//       } = req.body;



//       const article =
//         await Article.findByPk(
//           req.params.id
//         );

//       if (!article) {

//         return res.status(404).json({
//           message:
//             "Article not found",
//         });
//       }



//       article.status =
//         "scheduled";

//       article.publishedAt =
//         publishDate;

//       await article.save();



//       await ActivityLog.create({

//         userId:
//           req.user.id,

//         action:
//           "ARTICLE_SCHEDULED",

//         meta: {
//           articleId:
//             article.id,
//           publishDate,
//         },
//       });



//       res.json({
//         message:
//           "Article scheduled successfully",
//       });

//     } catch (err) {

//       console.error(err);

//       res.status(500).json({
//         message:
//           "Failed to schedule article",
//       });
//     }
//   };



// // ======================================================
// // TOGGLE FEATURED ARTICLE
// // ======================================================

// export const toggleFeaturedArticle =
//   async (req, res) => {

//     try {

//       const article =
//         await Article.findByPk(
//           req.params.id
//         );

//       if (!article) {

//         return res.status(404).json({
//           message:
//             "Article not found",
//         });
//       }



//       article.isFeatured =
//         !article.isFeatured;

//       await article.save();



//       await ActivityLog.create({

//         userId:
//           req.user.id,

//         action:
//           article.isFeatured
//             ? "ARTICLE_FEATURED"
//             : "ARTICLE_UNFEATURED",

//         meta: {
//           articleId:
//             article.id,
//         },
//       });



//       res.json({

//         message:
//           article.isFeatured
//             ? "Article featured"
//             : "Article removed from featured",

//         article,
//       });

//     } catch (err) {

//       console.error(err);

//       res.status(500).json({
//         message:
//           "Failed to update featured status",
//       });
//     }
//   };



