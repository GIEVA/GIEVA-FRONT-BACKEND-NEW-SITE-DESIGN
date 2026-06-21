import API
from "./api";



// ======================================================
// GET USERS
// ======================================================

export const getUsers =
  async (params = {}) => {

    const res =
      await API.get(

        "/api/admin/users",

        { params }
      );



    return res.data;
  };



// ======================================================
// CREATE USER
// ======================================================

export const createUser =
  async (data) => {

    const res =
      await API.post(

        "/api/admin/users",

        data
      );



    return res.data;
  };



// ======================================================
// TOGGLE STATUS
// ======================================================

export const toggleUserStatus =
  async (id) => {

    const res =
      await API.put(

        `/api/admin/users/${id}/status`
      );



    return res.data;
  };



// ======================================================
// UPDATE ROLE
// ======================================================

export const updateUserRole =
  async (id, role) => {

    const res =
      await API.put(

        `/api/admin/users/${id}/role`,

        { role }
      );



    return res.data;
  };