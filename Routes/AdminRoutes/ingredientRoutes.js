const express = require("express");
const IngredientController = require("../../Controllers/ingredientController");
const mw = require("../../Middlewares/auth");
const router = express.Router();

router.post(
  "/",
  mw.verifyToken,
  mw.verifyManagement,
  IngredientController.addIngredient
);
router.put(
  "/ingredients/price/:ingredientId",
  mw.verifyToken,
  mw.verifyManagement,
  IngredientController.updateIngredientPrice
);
router.put(
  "/ingredients/quantity/:ingredientId",
  mw.verifyToken,
  mw.verifyManagement,
  IngredientController.updateIngredientQuantity
);
router.put(
  "/ingredients/demand/:ingredientId",
  mw.verifyToken,
  mw.verifyManagement,
  IngredientController.addIngredientDemand
);
router.get("/ingredients", IngredientController.getAllIngredientsByBranch);

module.exports = router;
