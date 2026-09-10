import {Router} from "express";
import upload from "../middleware/upload.js"

import reportController from "../Controller/reportController.js";

const router=Router();

router.post("/upload",upload.single("file"),reportController.uploadReport)

export default router;