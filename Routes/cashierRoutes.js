const express = require("express");
const router = express.Router();
const mw = require("../Middlewares/auth");
const cashierController = require("../Controllers/cashierController");

router.get("/products", mw.verifyToken, cashierController.getProducts);
router.get("/orders", mw.verifyToken, cashierController.getOrders);
router.get("/orders/active", mw.verifyToken, cashierController.getActiveOrders);
router.get(
  "/orders/pending",
  mw.verifyToken,
  cashierController.getPendingOrders
);
router.get("/taxes", mw.verifyToken, cashierController.getTaxes);
router.get("/branch/status", mw.verifyToken, cashierController.getBranchStatus);

router.post("/order/add", mw.verifyToken, cashierController.addOrder);

router.put(
  "/order/:id/complete",
  mw.verifyToken,
  cashierController.completeOrder
);
router.put("/order/:id/ready", mw.verifyToken, cashierController.readyOrder);
router.put("/order/:id/cancel", mw.verifyToken, cashierController.cancelOrder);

module.exports = router;
