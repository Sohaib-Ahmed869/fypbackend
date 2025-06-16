const express = require("express");
const router = express.Router();
const mw = require("../Middlewares/auth");
const customerJourneyController = require("../Controllers/customerJourneyController");

// Individual Customer Journey Routes
router.get(
  "/customer/:customer_name",
  mw.verifyToken,
  customerJourneyController.getCustomerJourney
);

// Customer Analytics Routes
router.get(
  "/analytics",
  mw.verifyToken,
  customerJourneyController.getCustomerAnalytics
);

router.get(
  "/segments",
  mw.verifyToken,
  customerJourneyController.getCustomerSegments
);

router.get(
  "/churn-analysis",
  mw.verifyToken,
  customerJourneyController.getChurnAnalysis
);

router.get(
  "/retention-analysis",
  mw.verifyToken,
  customerJourneyController.getRetentionAnalysis
);

router.get(
  "/customer-paths",
  mw.verifyToken,
  customerJourneyController.getCustomerPaths
);

module.exports = router;
