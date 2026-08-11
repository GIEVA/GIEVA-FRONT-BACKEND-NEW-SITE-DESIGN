import API from "./api";

// ✅ Register
export const registerUser = async (data) => {
  const res = await API.post("/api/users/register", data);
  return res.data;
};

// ✅ Login
export const loginUser = async (data) => {
  const res = await API.post("/api/users/login", data);

  const { user, token } = res.data;

  // 🔐 Store separately
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));

  return res.data;
};

// ✅ Forgot password
export const forgotPassword = async (email) => {
  const res = await API.post("/api/users/forgot-password", { email });
  return res.data;
};

// ✅ Reset password
export const resetPassword = async (data) => {
  const res = await API.post("/api/users/reset-password", data);
  return res.data;
};

// ✅ Logout
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};