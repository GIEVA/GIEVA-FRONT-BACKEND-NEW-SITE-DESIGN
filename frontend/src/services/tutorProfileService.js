import API from "./api";



// ======================================================
// CREATE PROFILE
// ======================================================

export const createTutorProfile =
  async (formData) => {

    const res =
      await API.post(
        "/api/tutor/create",
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
// GET MY PROFILE
// ======================================================

export const getMyTutorProfile =
  async () => {

    const res =
      await API.get(
        "/api/tutor/me"
      );

    return res.data;
  };



// ======================================================
// GET PROFILE BY ID
// ======================================================

export const getTutorProfileById =
  async (id) => {

    const res =
      await API.get(
        `/api/tutor/${id}`
      );

    return res.data;
  };



// ======================================================
// UPDATE PROFILE
// ======================================================

export const updateTutorProfile =
  async (formData) => {

    const res =
      await API.put(
        "/api/tutor/update",
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
// DELETE PROFILE
// ======================================================

export const deleteTutorProfile =
  async () => {

    const res =
      await API.delete(
        "/api/tutor/delete"
      );

    return res.data;
  };