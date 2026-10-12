// Where each kind of user lands. Adjust the role names to match your database.
export const dashboardForRole = (role) =>
  ({
    admin: "/admin/dashboard",
    superadmin: "/admin/dashboard",
    operational_admin: "/admin/dashboard",
    tutor: "/tutor/dashboard",
    student: "/student/dashboard",
  }[role] || "/student/dashboard");

// True when a JWT is missing, malformed or past its `exp`
// True only when the token is missing, or is a JWT whose `exp` has passed
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const part = token.split(".")[1];
    if (!part) return false; // not a JWT, can't tell, let the server decide
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp ? payload.exp * 1000 <= Date.now() : false;
  } catch {
    return false;
  }
};

// Milliseconds until the token expires, or null if unknown
export const msUntilExpiry = (token) => {
  try {
    const part = token.split(".")[1];
    const { exp } = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return exp ? exp * 1000 - Date.now() : null;
  } catch {
    return null;
  }
};