// routes/service.routes.js

import express from "express";

import {
    getServices,
    getService,
} from "../controllers/services.controller.js";

const router = express.Router();

router.get("/services", getServices);

router.get("/service/:id", getService);

export default router;