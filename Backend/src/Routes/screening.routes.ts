

import { Router } from "express";
import upload from "../middleware/upload.js";
import {
  analyzeScreening,
  health,
  getModelPerformance,
  getScreeningById,
  getScreeningHistory,
  generateScreeningReport,
} from "../Controller/screeningController.js";

const router = Router();

router.get("/health", health);
router.get("/models/performance", getModelPerformance);

router.post("/screening/analyze", upload.single("file"), analyzeScreening);
// /history 
router.get("/screening/history", getScreeningHistory);
router.get("/screening/:id", getScreeningById);
router.post("/screening/:id/report", generateScreeningReport);

export default router;