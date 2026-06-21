import API from "./api";

export const createLesson = async (
  formData
) => {
  const res = await API.post(
    "/api/lessons/create",
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

export const getModuleLessons =
  async (moduleId) => {
    const res = await API.get(
      `/api/lessons/module/${moduleId}`
    );

    return res.data;
  };

export const updateLesson =
  async (id, formData) => {
    const res = await API.put(
      `/api/lessons/${id}`,
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

export const deleteLesson =
  async (id) => {
    const res = await API.delete(
      `/api/lessons/${id}`
    );

    return res.data;
  };

  export const toggleLessonPublish =
  async (id) => {
    const res = await API.patch(
      `/api/lessons/${id}/publish`
    );

    return res.data;
  };