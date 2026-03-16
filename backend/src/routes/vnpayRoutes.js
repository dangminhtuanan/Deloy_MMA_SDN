import express from "express";
import {
  createVnpayPaymentUrl,
  handleVnpayMobileReturn,
  handleVnpayReturn,
  handleVnpayIpn,
} from "../controllers/vnpayControllers.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authenticateToken, createVnpayPaymentUrl);
router.get("/mobile-return", handleVnpayMobileReturn);
router.get("/return", handleVnpayReturn);
router.get("/ipn", handleVnpayIpn);

export default router;
