const express = require("express");
const router = express.Router();
const competitiveAnalysisController = require("../Controllers/competitiveAnalysisController");
const mw = require("../Middlewares/auth");

// All routes require authentication
router.use(mw.verifyToken);

// POST /api/competitive-analysis/analyze/:branchId
// Analyze competition for a specific branch
router.post(
  "/analyze/:branchId",
  competitiveAnalysisController.analyzeCompetition
);

// GET /api/competitive-analysis/history
// Get previous competitive analysis reports
router.get("/history", competitiveAnalysisController.getAnalysisHistory);

// GET /api/competitive-analysis/report/:reportId
// Get specific analysis report
router.get(
  "/report/:reportId",
  competitiveAnalysisController.getAnalysisReport
);

// POST /api/competitive-analysis/refresh/:reportId
// Refresh/update existing analysis
router.post(
  "/refresh/:reportId",
  competitiveAnalysisController.refreshAnalysis
);

// DELETE /api/competitive-analysis/report/:reportId
// Delete analysis report
router.delete(
  "/report/:reportId",
  competitiveAnalysisController.deleteAnalysisReport
);

module.exports = router;
