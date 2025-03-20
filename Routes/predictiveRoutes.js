const express = require("express");
const router = express.Router();
const predictiveController = require("../Controllers/predictiveController");
const mw = require("../Middlewares/auth");
// Admin routes - require admin auth
router.get("/predictions", mw.verifyToken, mw.verifyAdmin, predictiveController.getSalesPrediction);
router.post(
  "/train-model",
  mw.verifyToken, mw.verifyAdmin,
  predictiveController.trainPredictionModel
);
router.get("/insights", mw.verifyToken, mw.verifyAdmin, predictiveController.getSalesInsights);
router.get("/weather", mw.verifyToken, mw.verifyAdmin, predictiveController.getWeatherForecast);
router.get("/factors", mw.verifyToken, mw.verifyAdmin, predictiveController.getSalesFactors);

// Manager routes - require manager auth
router.get(
  "/branch/predictions",
  mw.verifyToken, mw.verifyManager,
  predictiveController.getSalesPrediction
);
router.get(
  "/branch/insights",
  mw.verifyToken, mw.verifyManager,
  predictiveController.getSalesInsights
);
router.get(
  "/branch/weather",
  mw.verifyToken, mw.verifyManager,
  predictiveController.getWeatherForecast
);

module.exports = router;
