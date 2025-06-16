// Routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const paymentController = require("../Controllers/paymentController");
const mw = require("../Middlewares/auth");

// Create a checkout session for subscription
router.post(
  "/create-checkout-session",
  mw.verifyToken,
  mw.verifyAdmin,
  paymentController.createCheckoutSession
);

// Verify payment after successful checkout
router.post(
  "/verify",
  mw.verifyToken,
  mw.verifyAdmin,
  paymentController.verifyPayment
);

// Get payment status for a shop
router.get(
  "/status",
  mw.verifyToken,
  mw.verifyAdmin,
  paymentController.getPaymentStatus
);

// Cancel subscription - uncommented
router.post(
  "/cancel/:shopId",
  mw.verifyToken,
  mw.verifyAdmin,
  paymentController.cancelSubscription
);

// Stripe webhook (no authentication)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

module.exports = router;
