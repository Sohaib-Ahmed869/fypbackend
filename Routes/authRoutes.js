const express = require("express");
const router = express.Router();
const mw = require("../Middlewares/auth");
const authController = require("../Controllers/authController");

router.get("/shops", authController.getShops);
router.get("/branches/:shopName", authController.getBranchesForShop);


router.post("/admin/signup", authController.addShop); // hidden
router.post("/admin/login", authController.adminLogin);
router.post("/manager/login", authController.managerLogin);
router.post("/cashier/login", authController.cashierLogin);
router.post("/logout", authController.logout);

module.exports = router;
