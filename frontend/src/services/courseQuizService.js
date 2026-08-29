import API from "./api";

export const createQuiz = (payload) =>
  API.post("/api/course-quizzes", payload).then((r) => r.data);

export const addQuestion = (quizId, payload) =>
  API.post(`/api/course-quizzes/${quizId}/questions`, payload).then((r) => r.data);

export const getQuizzesByCourse = (courseId) =>
  API.get(`/api/course-quizzes/course/${courseId}`).then((r) => r.data);

export const getQuizById = (quizId) =>
  API.get(`/api/course-quizzes/${quizId}`).then((r) => r.data);

export const startQuiz = (quizId) =>
  API.post(`/api/course-quizzes/${quizId}/start`).then((r) => r.data);

export const resumeQuiz = (quizId) =>
  API.post(`/api/course-quizzes/${quizId}/resume`).then((r) => r.data);

export const submitQuiz = (attemptId, answers) =>
  API.post(`/api/course-quizzes/attempts/${attemptId}/submit`, { answers }).then((r) => r.data);

export const getQuizResult = (attemptId) =>
  API.get(`/api/course-quizzes/attempts/${attemptId}/result`).then((r) => r.data);

export const getRemainingTime = (attemptId) =>
  API.get(`/api/course-quizzes/attempts/${attemptId}/remaining-time`).then((r) => r.data);

export const getNextQuestionAdaptive = (payload) =>
  API.post("/api/course-quizzes/next-question", payload).then((r) => r.data);