import API from "./api";



// ======================================================
// GET AVAILABLE TUTORS
// ======================================================

export const getAvailableTutors =
  async () => {

    const res =
      await API.get(
        "/api/admin/tutor-assignments/available"
      );

    return res.data;
  };



// ======================================================
// GET ASSIGNABLE STUDENTS
// ======================================================

export const getAssignableStudents =
  async () => {

    const res =
      await API.get(
        "/api/admin/tutor-assignments/students"
      );

    return res.data;
  };



// ======================================================
// GET ASSIGNABLE COURSES
// ======================================================

export const getAssignableCourses =
  async () => {

    const res =
      await API.get(
        "/api/admin/tutor-assignments/courses"
      );

    return res.data;
  };



// ======================================================
// ASSIGN STUDENT TO TUTOR
// ======================================================

export const assignStudentToTutor =
  async (data) => {

    const res =
      await API.post(
        "/api/admin/tutor-assignments/assign-student",
        data
      );

    return res.data;
  };



// ======================================================
// GET TUTOR STUDENTS
// ======================================================

export const getTutorStudents =
  async (tutorProfileId) => {

    const res =
      await API.get(
        `/api/admin/tutor-assignments/${tutorProfileId}/students`
      );

    return res.data;
  };