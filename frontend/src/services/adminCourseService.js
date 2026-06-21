import API from "./api";

// ================================
// CREATE COURSE
// ================================
export const createCourse = async (data) => {
  const res = await API.post("/api/admin/courses", data);
  return res.data;
};

// ================================
// GET ALL COURSES
// ================================
export const getAllCourses = async () => {
  const res = await API.get("/api/admin/courses");
  return res.data;
};

// ================================
// GET COURSE BY ID
// ================================
export const getCourseById = async (id) => {
  const res = await API.get(`/api/admin/courses/${id}`);
  return res.data;
};

// ================================
// UPDATE COURSE
// ================================
export const updateCourse = async (id, data) => {
  const res = await API.put(`/api/admin/courses/${id}`, data);
  return res.data;
};

// ================================
// DELETE COURSE
// ================================
export const deleteCourse = async (id) => {
  const res = await API.delete(`/api/admin/courses/${id}`);
  return res.data;
};

//
// TOGGLE COURSE PUBLISH STATUS
//
export const toggleCoursePublish =
  async (id) => {
    const { data } = await API.patch(
      `/api/admin/courses/${id}/publish`
    );

    return data;
  };