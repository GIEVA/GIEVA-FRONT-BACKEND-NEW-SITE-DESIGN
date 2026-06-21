import API from "./api";

//
// CREATE PROFILE
//
export const createStudentProfile = async (
  formData
) => {
  const { data } = await API.post(
    "/api/student-profile/create",
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return data;
};

//
// GET MY PROFILE
//
export const getMyStudentProfile =
  async () => {
    const { data } = await API.get(
      "/api/student-profile/me"
    );

    return data;
  };

//
// GET PROFILE BY ID
//
export const getStudentProfileById =
  async (id) => {
    const { data } = await API.get(
      `/api/student-profile/${id}`
    );

    return data;
  };

//
// UPDATE PROFILE
//
export const updateStudentProfile =
  async (formData) => {
    const { data } = await API.put(
      "/api/student-profile/update",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );

    return data;
  };

//
// DELETE PROFILE
//
export const deleteStudentProfile =
  async () => {
    const { data } = await API.delete(
      "/api/student-profile/delete"
    );

    return data;
  };