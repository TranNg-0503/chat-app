import express from "express";
import { streamWebhook } from "../controllers/webhook.controller.js";

const router = express.Router();

router.post("/stream", streamWebhook);

export default router;
