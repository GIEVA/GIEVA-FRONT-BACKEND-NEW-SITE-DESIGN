import models from "../models/index.js";
import { cloudinary } from "../config/cloudinary.js";

import { slugify } from "../utils/slugify.js"; 

import { calculateReadingTime } from "../utils/readingTime.js";

const {
  Article,
  ActivityLog,
  User,
} = models;



export const createArticle =
  async (req, res) => {

    try {

      if (
        !["admin", "superadmin"]
          .includes(req.user.role)
      ) {

        return res.status(403).json({
          message:
            "Admins only",
        });
      }



      const {
        title,
        subtitle,
        excerpt,
        content,
        category,
        tags,
        seoTitle,
        seoDescription,
        seoKeywords,
        isFeatured,
        allowComments,
        status,
      } = req.body;



      if (!title || !content) {

        return res.status(400).json({
          message:
            "Title and content are required",
        });
      }



      // ======================================================
      // UNIQUE SLUG
      // ======================================================

      let slug =
        slugify(title);

      const existing =
        await Article.findOne({
          where: { slug },
        });

      if (existing) {

        slug =
          `${slug}-${Date.now()}`;
      }



      // ======================================================
      // IMAGE
      // ======================================================

      let coverImageUrl =
        null;

      let coverImagePublicId =
        null;

      if (req.file) {

        coverImageUrl =
          req.file.path;

        coverImagePublicId =
          req.file.filename;
      }



      // ======================================================
      // PARSE JSON FIELDS
      // ======================================================

      const parsedTags =
        tags
          ? JSON.parse(tags)
          : [];

      const parsedKeywords =
        seoKeywords
          ? JSON.parse(seoKeywords)
          : [];



      // ======================================================
      // CREATE ARTICLE
      // ======================================================

      const article =
        await Article.create({

          title,
          subtitle,
          excerpt,

          slug,

          content,

          category,

          tags:
            parsedTags,

          seoTitle,
          seoDescription,

          seoKeywords:
            parsedKeywords,

          isFeatured:
            isFeatured === "true",

          allowComments:
            allowComments !== "false",

          status:
            status || "draft",

          readingTime:
            calculateReadingTime(
              content
            ),

          coverImageUrl,
          coverImagePublicId,

          authorId:
            req.user.id,

          publishedAt:
            status === "published"
              ? new Date()
              : null,
        });



      // ======================================================
      // LOG
      // ======================================================

      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "ARTICLE_CREATED",

        meta: {
          articleId:
            article.id,
        },
      });



      res.status(201).json({

        message:
          "Article created successfully",

        article,
      });

    } catch (error) {

      console.error(
        "Create Article Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to create article",
      });
    }
  };


export const publishArticle = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const { id } = req.params;

    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    await article.update({
      status: "published",
      publishedAt: new Date(),
    });

    await ActivityLog.create({
      userId: req.user.id,
      action: "ARTICLE_PUBLISHED",
      meta: { articleId: id },
    });

    res.status(200).json({
      message: "Article published",
    });

  } catch (error) {
    console.error("Publish Error:", error);
    res.status(500).json({
      message: "Failed to publish article",
    });
  }
};


export const updateArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    const updateData = { ...req.body };

    if (updateData.title) {
      updateData.slug = slugify(updateData.title);
    }

    if (updateData.content) {
      updateData.readingTime = calculateReadingTime(updateData.content);
    }

    if (req.file) {
      updateData.coverImageUrl = req.file.path;
      updateData.coverImagePublicId = req.file.filename;
    }

     await ActivityLog.create({
      userId: req.user.id,
      action: "ARTICLE_UPDATED",
      meta: { articleId: id },
    }, { transaction });


    await article.update(updateData);

    res.json({ message: "Article updated", article });

  } catch (error) {
    res.status(500).json({ message: "Failed to update article" });
  }
};


export const getArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({
      where: { status: "published" },
      order: [["publishedAt", "DESC"]],
    });

    res.json({ articles });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch articles",
    });
  }
};


export const getArticleById = async (req, res) => {
  try {
    const article = await Article.findOne({
      where: {
        id: req.params.id,
        status: "published",
      },
    });

    if (!article) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    res.json({ article });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch article",
    });
  }
};

// ======================================================
// GET ADMIN ARTICLES
// includes drafts, archived, scheduled, published
// ======================================================

export const getAdminArticles =
  async (req, res) => {

    try {

      let {
        page = 1,
        limit = 10,
        status,
        search,
      } = req.query;

      page =
        parseInt(page);

      limit =
        parseInt(limit);

      const offset =
        (page - 1) * limit;

      const where = {};



      if (status) {

        where.status =
          status;
      }



      if (search) {

        where[Op.or] = [

          {
            title: {
              [Op.like]:
                `%${search}%`,
            },
          },

          {
            subtitle: {
              [Op.like]:
                `%${search}%`,
            },
          },

          {
            category: {
              [Op.like]:
                `%${search}%`,
            },
          },
        ];
      }



      const {
        rows,
        count,
      } =
        await Article.findAndCountAll({

          where,

          limit,

          offset,

          order: [
            ["createdAt", "DESC"],
          ],

          include: [

            {
              model: User,

              as: "author",

              attributes: [
                "id",
                "fullName",
                "email",
              ],
            },
          ],
        });



      res.json({

        total:
          count,

        currentPage:
          page,

        totalPages:
          Math.ceil(
            count / limit
          ),

        articles:
          rows,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch admin articles",
      });
    }
  };



// ======================================================
// DELETE ARTICLE
// ======================================================

export const deleteArticle =
  async (req, res) => {

    try {

      const article =
        await Article.findByPk(
          req.params.id
        );

      if (!article) {

        return res.status(404).json({
          message:
            "Article not found",
        });
      }



      // DELETE IMAGE
      if (
        article.coverImagePublicId
      ) {

        await cloudinary.uploader.destroy(
          article.coverImagePublicId
        );
      }



      await article.destroy();



      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "ARTICLE_DELETED",

        meta: {
          articleId:
            article.id,
        },
      });



      res.json({
        message:
          "Article deleted successfully",
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to delete article",
      });
    }
  };



// ======================================================
// ARCHIVE ARTICLE
// ======================================================

export const archiveArticle =
  async (req, res) => {

    try {

      const article =
        await Article.findByPk(
          req.params.id
        );

      if (!article) {

        return res.status(404).json({
          message:
            "Article not found",
        });
      }



      article.status =
        "archived";

      await article.save();



      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "ARTICLE_ARCHIVED",

        meta: {
          articleId:
            article.id,
        },
      });



      res.json({
        message:
          "Article archived successfully",
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to archive article",
      });
    }
  };



// ======================================================
// SCHEDULE ARTICLE
// ======================================================

export const scheduleArticle =
  async (req, res) => {

    try {

      const {
        publishDate,
      } = req.body;



      const article =
        await Article.findByPk(
          req.params.id
        );

      if (!article) {

        return res.status(404).json({
          message:
            "Article not found",
        });
      }



      article.status =
        "scheduled";

      article.publishedAt =
        publishDate;

      await article.save();



      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          "ARTICLE_SCHEDULED",

        meta: {
          articleId:
            article.id,
          publishDate,
        },
      });



      res.json({
        message:
          "Article scheduled successfully",
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to schedule article",
      });
    }
  };



// ======================================================
// TOGGLE FEATURED ARTICLE
// ======================================================

export const toggleFeaturedArticle =
  async (req, res) => {

    try {

      const article =
        await Article.findByPk(
          req.params.id
        );

      if (!article) {

        return res.status(404).json({
          message:
            "Article not found",
        });
      }



      article.isFeatured =
        !article.isFeatured;

      await article.save();



      await ActivityLog.create({

        userId:
          req.user.id,

        action:
          article.isFeatured
            ? "ARTICLE_FEATURED"
            : "ARTICLE_UNFEATURED",

        meta: {
          articleId:
            article.id,
        },
      });



      res.json({

        message:
          article.isFeatured
            ? "Article featured"
            : "Article removed from featured",

        article,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to update featured status",
      });
    }
  };