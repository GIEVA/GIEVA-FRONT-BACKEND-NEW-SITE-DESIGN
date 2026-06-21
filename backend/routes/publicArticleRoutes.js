import express from "express";

import {

  getPublishedArticles,
  getArticleBySlug,
  getFeaturedArticles,
  getRelatedArticles,
  getTrendingArticles,

} from "../controllers/publicArticle.controller.js";

const router =
  express.Router();



// ======================================================
// GET ALL PUBLISHED ARTICLES
// ======================================================

router.get(
  "/articles",
  getPublishedArticles
);



// ======================================================
// FEATURED ARTICLES
// ======================================================

router.get(
  "/articles/featured",
  getFeaturedArticles
);



// ======================================================
// TRENDING ARTICLES
// ======================================================

router.get(
  "/articles/trending",
  getTrendingArticles
);



// ======================================================
// RELATED ARTICLES
// ======================================================

router.get(
  "/articles/:articleId/related",
  getRelatedArticles
);



// ======================================================
// SINGLE ARTICLE
// ======================================================

router.get(
  "/articles/slug/:slug",
  getArticleBySlug
);



export default router;