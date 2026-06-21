import API from "./api";

export const createQuiz = async (
  data
) => {
  const res = await API.post(
    "/api/quizzes",
    data
  );

  return res.data;
};

export const addQuestion = async (
  quizId,
  data
) => {
  const res = await API.post(
    `/api/quizzes/${quizId}/question`,
    data
  );

  return res.data;
};

export const getQuizById =
  async (quizId) => {
    const res = await API.get(
      `/api/quizzes/${quizId}`
    );

    return res.data;
  };

export const getCourseQuizzes =
  async (courseId) => {
    const res = await API.get(
      `/api/quizzes/course/${courseId}/quizzes`
    );

    return res.data;
  };