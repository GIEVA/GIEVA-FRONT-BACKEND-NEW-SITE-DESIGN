// routes/program.routes.js
import express from "express";
import { getPrograms, getProgram } from "../controllers/program.controller.js";

const router = express.Router();

router.get("/", getPrograms);
router.get("/:slug", getProgram);

export default router;