import API from "./api";



// ======================================================
// GET ARTICLES
// ======================================================

export const getPublishedArticles =
  async (params = {}) => {

    const res =
      await API.get(
        "/api/public/articles",
        {
          params,
        }
      );

    return res.data;
  };



// ======================================================
// GET FEATURED ARTICLES
// ======================================================

export const getFeaturedArticles =
  async () => {

    const res =
      await API.get(
        "/api/public/articles/featured"
      );

    return res.data;
  };



// ======================================================
// GET TRENDING ARTICLES
// ======================================================

export const getTrendingArticles =
  async () => {

    const res =
      await API.get(
        "/api/public/articles/trending"
      );

    return res.data;
  };



// ======================================================
// GET SINGLE ARTICLE
// ======================================================

export const getArticleBySlug =
  async (slug) => {

    const res =
      await API.get(
        `/api/public/articles/slug/${slug}`
      );

    return res.data;
  };



// ======================================================
// RELATED ARTICLES
// ======================================================

export const getRelatedArticles =
  async (articleId) => {

    const res =
      await API.get(
        `/api/public/articles/${articleId}/related`
      );

    return res.data;
  };