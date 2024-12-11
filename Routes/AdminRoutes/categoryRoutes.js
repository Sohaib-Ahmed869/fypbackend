const express = require("express");
const router = express.Router();
const mw = require("../../Middlewares/auth");
const CategoryController = require("../../Controllers/categoryController");

router.post(
  "/",
  mw.verifyToken,
  mw.verifyAdmin,
  CategoryController.addCategory
);
router.put(
  "/:id",
  mw.verifyToken,
  mw.verifyAdmin,
  CategoryController.updateCategoryName
);
router.put(
  "/status/:id",
  mw.verifyToken,
  mw.verifyAdmin,
  CategoryController.toggleCategoryStatus
);
router.get("/", CategoryController.getAllCategoriesByShop);

module.exports = router;
