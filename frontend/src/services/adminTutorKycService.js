import API from "./api";



// ======================================================
// GET ALL TUTORS
// ======================================================

export const getAllTutorProfiles =
  async (params) => {

    const res =
      await API.get(
        "/api/admin/tutor-kyc/tutors",
        {
          params,
        }
      );

    return res.data;
  };



// ======================================================
// GET SINGLE TUTOR
// ======================================================

export const getTutorProfileByIdAdmin =
  async (id) => {

    const res =
      await API.get(
        `/api/admin/tutor-kyc/tutors/${id}`
      );

    return res.data;
  };



// ======================================================
// UPDATE TUTOR PROFILE
// ======================================================

export const updateTutorProfileAdmin =
  async (
    id,
    formData
  ) => {

    const res =
      await API.put(
        `/api/admin/tutor-kyc/tutors/${id}`,
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
// DELETE TUTOR
// ======================================================

export const deleteTutorProfileAdmin =
  async (id) => {

    const res =
      await API.delete(
        `/api/admin/tutor-kyc/tutors/${id}`
      );

    return res.data;
  };



// ======================================================
// APPROVE TUTOR
// ======================================================

export const approveTutorProfile =
  async (
    id,
    data = {}
  ) => {

    const res =
      await API.put(
        `/api/admin/tutor-kyc/tutors/${id}/approve`,
        data
      );

    return res.data;
  };



// ======================================================
// REJECT TUTOR
// ======================================================

export const rejectTutorProfile =
  async (
    id,
    data
  ) => {

    const res =
      await API.put(
        `/api/admin/tutor-kyc/tutors/${id}/reject`,
        data
      );

    return res.data;
  };