// middleware/visaAccess.js
import { isAdmin } from "../service/visaCore.js";

export const requireAdmin = (req, res, next) => {
  if (!isAdmin(req.user)) return res.status(403).json({ message: "Admin access required" });
  next();
};
