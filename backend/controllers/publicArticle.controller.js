import models from "../models/index.js";

import { Op } from "sequelize";

const {
  Article,
  User,
} = models;



// ======================================================
// GET PUBLISHED ARTICLES
// ======================================================

export const getPublishedArticles =
  async (req, res) => {

    try {

      let {
        page = 1,
        limit = 10,
        category,
        search,
        featured,
        tag,
      } = req.query;

      page =
        parseInt(page);

      limit =
        parseInt(limit);

      const offset =
        (page - 1) * limit;

      const where = {

        status:
          "published",
      };



      // ======================================================
      // CATEGORY FILTER
      // ======================================================

      if (category) {

        where.category =
          category;
      }



      // ======================================================
      // FEATURED
      // ======================================================

      if (featured === "true") {

        where.isFeatured =
          true;
      }



      // ======================================================
      // SEARCH
      // ======================================================

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
            content: {
              [Op.like]:
                `%${search}%`,
            },
          },
        ];
      }



      // ======================================================
      // TAG FILTER
      // ======================================================

      if (tag) {

        where.tags = {
          [Op.like]:
            `%${tag}%`,
        };
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

            ["isPinned", "DESC"],
            ["featuredOrder", "ASC"],
            ["publishedAt", "DESC"],
          ],

          attributes: {
            exclude: [
              "content",
            ],
          },

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
          "Failed to fetch articles",
      });
    }
  };



// ======================================================
// GET ARTICLE BY SLUG
// ======================================================

export const getArticleBySlug =
  async (req, res) => {

    try {

      const {
        slug,
      } = req.params;



      const article =
        await Article.findOne({

          where: {

            slug,

            status:
              "published",
          },

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



      if (!article) {

        return res.status(404).json({

          message:
            "Article not found",
        });
      }



      // ======================================================
      // INCREMENT VIEWS
      // ======================================================

      article.views += 1;

      await article.save();



      res.json({
        article,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({

        message:
          "Failed to fetch article",
      });
    }
  };



// ======================================================
// GET FEATURED ARTICLES
// ======================================================

export const getFeaturedArticles =
  async (req, res) => {

    try {

      const articles =
        await Article.findAll({

          where: {

            status:
              "published",

            isFeatured:
              true,
          },

          limit: 6,

          order: [

            ["featuredOrder", "ASC"],
            ["publishedAt", "DESC"],
          ],

          attributes: {
            exclude: [
              "content",
            ],
          },
        });



      res.json({
        articles,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({

        message:
          "Failed to fetch featured articles",
      });
    }
  };



// ======================================================
// GET RELATED ARTICLES
// ======================================================

export const getRelatedArticles =
  async (req, res) => {

    try {

      const {
        articleId,
      } = req.params;



      const currentArticle =
        await Article.findByPk(
          articleId
        );

      if (!currentArticle) {

        return res.status(404).json({

          message:
            "Article not found",
        });
      }



      const related =
        await Article.findAll({

          where: {

            id: {
              [Op.ne]:
                currentArticle.id,
            },

            status:
              "published",

            [Op.or]: [

              {
                category:
                  currentArticle.category,
              },

              {
                tags: {
                  [Op.like]:
                    `%${currentArticle.tags?.[0]}%`,
                },
              },
            ],
          },

          limit: 4,

          order: [
            ["publishedAt", "DESC"],
          ],

          attributes: {
            exclude: [
              "content",
            ],
          },
        });



      res.json({
        articles:
          related,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({

        message:
          "Failed to fetch related articles",
      });
    }
  };



// ======================================================
// GET TRENDING ARTICLES
// ======================================================

export const getTrendingArticles =
  async (req, res) => {

    try {

      const articles =
        await Article.findAll({

          where: {

            status:
              "published",
          },

          limit: 10,

          order: [

            ["views", "DESC"],
            ["publishedAt", "DESC"],
          ],

          attributes: {
            exclude: [
              "content",
            ],
          },
        });



      res.json({
        articles,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({

        message:
          "Failed to fetch trending articles",
      });
    }
  };