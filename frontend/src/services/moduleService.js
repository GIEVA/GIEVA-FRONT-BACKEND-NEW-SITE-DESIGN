import API from "./api";

export const createModule = async (data) => {
  const res = await API.post(
    "/api/modules/create",
    data
  );

  return res.data;
};

export const getCourseModules = async (
  courseId
) => {
  const res = await API.get(
    `/api/modules/course/${courseId}`
  );

  return res.data;
};

export const updateModule = async (
  id,
  data
) => {
  const res = await API.put(
    `/api/modules/${id}`,
    data
  );

  return res.data;
};

export const deleteModule = async (
  id
) => {
  const res = await API.delete(
    `/api/modules/delete/${id}`
  );

  return res.data;
};

export const toggleModulePublish =
  async (id) => {
    const res = await API.patch(
      `/api/modules/${id}/publish`
    );

    return res.data;
  };