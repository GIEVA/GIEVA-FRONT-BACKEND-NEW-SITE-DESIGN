import API from "./api";



// ======================================================
// CREATE ARTICLE
// ======================================================

export const createArticle =
  async (formData) => {

    const res =
      await API.post(
        "/api/admin/cms/articles",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

    return res.data;
  };



// ======================================================
// GET ADMIN ARTICLES
// ======================================================

export const getAdminArticles =
  async (params = {}) => {

    const res =
      await API.get(
        "/api/admin/cms/articles",
        {
          params,
        }
      );

    return res.data;
  };



// ======================================================
// GET SINGLE ARTICLE
// ======================================================

export const getAdminArticleById =
  async (id) => {

    const res =
      await API.get(
        `/api/admin/cms/articles/${id}`
      );

    return res.data;
  };



// ======================================================
// UPDATE ARTICLE
// ======================================================

export const updateArticle =
  async (id, formData) => {

    const res =
      await API.put(
        `/api/admin/cms/articles/${id}`,
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

    return res.data;
  };



// ======================================================
// PUBLISH ARTICLE
// ======================================================

export const publishArticle =
  async (id) => {

    const res =
      await API.put(
        `/api/admin/cms/articles/${id}/publish`
      );

    return res.data;
  };



// ======================================================
// FEATURE ARTICLE
// ======================================================

export const toggleFeaturedArticle =
  async (id) => {

    const res =
      await API.put(
        `/api/admin/cms/articles/${id}/feature`
      );

    return res.data;
  };



// ======================================================
// ARCHIVE ARTICLE
// ======================================================

export const archiveArticle =
  async (id) => {

    const res =
      await API.put(
        `/api/admin/cms/articles/${id}/archive`
      );

    return res.data;
  };



// ======================================================
// DELETE ARTICLE
// ======================================================

export const deleteArticle =
  async (id) => {

    const res =
      await API.delete(
        `/api/admin/cms/articles/${id}`
      );

    return res.data;
  };

  // ======================================================
// UPLOAD ARTICLE IMAGE
// ======================================================

export const uploadArticleImage =
  async (file) => {

    const formData =
      new FormData();

    formData.append(
      "image",
      file
    );

    const res =
      await API.post(
        "/api/admin/cms/upload-image",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

    return res.data;
  };