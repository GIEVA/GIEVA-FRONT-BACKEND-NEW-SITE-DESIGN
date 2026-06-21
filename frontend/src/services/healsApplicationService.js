import API from "./api";


// ======================================================
// CREATE APPLICATION
// ======================================================

export const createHealsApplication =
  async (formData) => {

    const res = await API.post(
      "/api/applicant/create",
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
// SAVE PROGRESS
// ======================================================

export const saveHealsProgress =
  async (id, formData) => {

    const res = await API.post(
      `/api/applicant/${id}/save`,
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
// SUBMIT
// ======================================================

export const submitHealsApplication =
  async (id) => {

    const res = await API.post(
      `/api/applicant/${id}/submit`
    );

    return res.data;
  };


// ======================================================
// GET MY APPLICATIONS
// ======================================================

export const getMyHealsApplications =
  async () => {

    const res = await API.get(
      "/api/applicant/my-applications"
    );

    return res.data;
  };


// ======================================================
// GET SINGLE APPLICATION
// ======================================================

export const getHealsApplicationById =
  async (id) => {

    const res = await API.get(
      `/api/applicant/${id}`
    );

    return res.data;
  };


// ======================================================
// UPDATE APPLICATION
// ======================================================

export const updateHealsApplication =
  async (id, formData) => {

    const res = await API.put(
      `/api/applicant/${id}`,
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

  //
// DELETE APPLICATION
//

export const deleteHealsApplication =
  async (id) => {

    const res =
      await API.delete(
        `/api/applicant/del-draft/${id}`
      );

    return res.data;
  };