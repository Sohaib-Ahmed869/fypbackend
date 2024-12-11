const express = require("express");
const router = express.Router();
const mw = require("../Middlewares/auth");
const managerController = require("../Controllers/managerController");
const ingredientController = require("../Controllers/ingredientController");

router.get("/", mw.verifyToken, mw.verifyManager, managerController.getBranch);
router.get(
  "/sales",
  mw.verifyToken,
  mw.verifyManager,
  managerController.getSales
);
router.get(
  "/cashiers",
  mw.verifyToken,
  mw.verifyManager,
  managerController.getCashiers
);
router.get(
  "/products",
  mw.verifyToken,
  mw.verifyManager,
  managerController.getProducts
);
router.get(
  "/categories",
  mw.verifyToken,
  mw.verifyManager,
  managerController.getCategories
);

router.get(
  "/branch/orders",
  mw.verifyToken,
  mw.verifyManager,
  managerController.getBranchOrders
);
router.post(
  "/cashier/add",
  mw.verifyToken,
  mw.verifyManager,
  managerController.addCashier
);
router.post(
  "/product/add",
  mw.verifyToken,
  mw.verifyManager,
  managerController.addProduct
);

router.put(
  "/branch/timings",
  mw.verifyToken,
  mw.verifyManager,
  managerController.updateBranchTimings
);

router.put(
  "/branch/openBranch",
  mw.verifyToken,
  mw.verifyManager,
  managerController.openBranch
);

router.put(
  "/branch/closeBranch",
  mw.verifyToken,
  mw.verifyManager,
  managerController.closeBranch
);

router.put(
  "/branch/updateCashOnHand",
  mw.verifyToken,
  mw.verifyManager,
  managerController.updateCashOnHand
);

// Ingredient routes
router.post(
  "/ingredient/add",
  mw.verifyToken,
  mw.verifyManager,
  ingredientController.addIngredient
);

router.get(
  "/ingredients",
  mw.verifyToken,
  mw.verifyManager,
  ingredientController.getAllIngredientsByShop
);

router.put(
  "/product/inactiveProduct/:productId",
  mw.verifyToken,
  mw.verifyManager,
  managerController.inactivateProduct
);

module.exports = router;
