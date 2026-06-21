import API from "./api";

// ================= MODULES =================

export const getCourseModules =
  async (courseId) => {
    const res = await API.get(
      `/api/lessons/courses/${courseId}/modules`
    );

    return res.data;
  };

// ================= PROGRESS =================

export const getCourseProgress =
  async (courseId) => {
    const res = await API.get(
      `/api/lessons/courses/${courseId}/progress`
    );

    return res.data;
  };

// ================= LESSON =================

export const getLessonMeta =
  async (lessonId) => {
    const res = await API.get(
      `/api/lessons/meta/${lessonId}`
    );

    return res.data;
  };

export const getSecureLesson =
  async (lessonId) => {
    const res = await API.get(
      `/api/lessons/${lessonId}`
    );

    return res.data;
  };

// ================= COMPLETE =================

export const completeLesson =
  async (lessonId, watchTime = 0) => {
    const res = await API.post(
      `/api/lessons/complete`,
      {
        lessonId,
        watchTime,
      }
    );

    return res.data;
  };

// ================= ENROLLMENT =================

export const getEnrollmentStatus =
  async (courseId) => {
    const res = await API.get(
      `/api/lessons/courses/${courseId}/enrollment`
    );

    return res.data;
  };

// ================= CONTINUE =================

export const getContinueLearning =
  async (courseId) => {
    const res = await API.get(
      `/api/lessons/courses/${courseId}/continue`
    );

    return res.data;
  };

// ================= COMPLETION =================

export const getCompletionStatus =
  async (courseId) => {
    const res = await API.get(
      `/api/lessons/courses/${courseId}/completion-status`
    );

    return res.data;
  };

  export const updateLessonAccess =
  async (lessonId) => {

    const res =
      await API.post(
        "/api/lessons/access",
        {
          lessonId,
        }
      );

    return res.data;
  };