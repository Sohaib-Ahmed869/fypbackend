const express = require("express");
const router = express.Router();
const mw = require("../Middlewares/auth");
const inventoryController = require("../Controllers/inventoryController");

router.put(
  "/branch/:branchId/inventory",
  mw.verifyToken,
  mw.verifyAdmin,
  inventoryController.updateInventory
);
router.get(
  "/branch/:branchId/inventory",
  mw.verifyToken,
  mw.verifyAdmin,
  inventoryController.getBranchInventory
);
router.get(
  "/branch/:branchId/low-inventory",
  mw.verifyToken,
  mw.verifyAdmin,
  inventoryController.getLowInventory
);
router.post("/inventory/transfer",
  mw.verifyToken,
  mw.verifyAdmin,
  inventoryController.transferInventory);

module.exports = router;