import API from "./api";

// ======================================
// GET ALL NOTIFICATIONS
// ======================================

export const getNotifications =
  async () => {

    const res =
      await API.get(
        "/api/admin/notifications"
      );

    return res.data;
  };


// ======================================
// MARK AS READ
// ======================================

export const markNotificationRead =
  async (id) => {

    const res =
      await API.put(
        `/api/admin/notifications/${id}/read`
      );

    return res.data;
  };