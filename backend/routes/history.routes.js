import { Router } from "express";
import { getHistory } from "../controllers/historyController.js";

const router = Router();

router.get("/our-history", getHistory);

export default router;