// Controllers/authController.js
const express = require("express");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const Shop = require("../Models/Shop");
const Branch = require("../Models/Branch");
const Manager = require("../Models/Manager");
const Cashier = require("../Models/Cashier");
const stripeService = require("../services/stripeService");

const authController = {
  addShop: async (req, res) => {
    try {
      const { shopName, email, password, website_link, NTN, type } = req.body;
      if (!shopName || !email || !password) {
        return res.status(400).json({ message: "Please fill in all fields" });
      }
      const shop = new Shop({
        shop_name: shopName,
        email,
        password,
        website_link,
        NTN,
        type,
        paid: false, // Initialize as unpaid
        bill_status: false, // Initialize with unpaid bill status
        subscription_plan: null,
        subscription_id: null,
      });

      await shop.save();

      res.status(201).json({
        message: "Shop created successfully",
        shopId: shop._id,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  adminLogin: async (req, res) => {
    try {
      const { shopName, password } = req.body;
      if (!shopName || !password) {
        return res.status(400).json({ message: "Please fill in all fields" });
      }
      const shop = await Shop.findOne({ shop_name: shopName });
      if (!shop) {
        return res.status(400).json({ message: "Invalid name" });
      }
      const isMatch = await shop.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const role = "admin";
      const token = jwt.sign(
        { id: shop._id, role: role, shopId: shop._id, shopName: shopName },
        process.env.JWT_SECRET,
        { expiresIn: "12h" }
      );

      // Check subscription status in Stripe (this updates the DB if needed)
      await stripeService.checkSubscriptionStatus(shop._id);

      // Refresh shop data after potential update
      const updatedShop = await Shop.findById(shop._id);

      res
        .status(200)
        .cookie("token", token, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
        })
        .json({
          role: role,
          shopName: shopName,
          userId: updatedShop._id,
          shopId: updatedShop._id,
          paymentRequired: !updatedShop.paid || !updatedShop.bill_status,
        });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  managerLogin: async (req, res) => {
    try {
      const { shopName, branchName, username, password } = req.body;
      if (!username || !password || !shopName || !branchName) {
        return res.status(400).json({ message: "Please fill in all fields" });
      }

      const shop = await Shop.findOne({ shop_name: shopName });
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      // Check if subscription is active before allowing login
      if (!shop.paid || !shop.bill_status) {
        return res.status(403).json({
          message:
            "Shop subscription is inactive. Please contact the admin to renew the subscription.",
        });
      }

      const branch = await Branch.findOne({
        shop_id: shop._id,
        branch_name: branchName,
      });
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      const manager = await Manager.findOne({
        shop_id: shop._id,
        branch_id: branch._id,
        username,
      });
      if (!manager) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const isMatch = await manager.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const role = "manager";
      const token = jwt.sign(
        {
          id: manager._id,
          role: role,
          shopId: shop._id,
          shopName,
          branchId: branch._id,
          branchName,
        },
        process.env.JWT_SECRET,
        { expiresIn: "12h" }
      );

      res
        .status(200)
        .cookie("token", token, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
        })
        .json({
          role: role,
          shopName,
          branchName,
          userId: manager._id,
          shopId: shop._id,
          branchId: branch._id,
        });

      console.log("Manager login successful");
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  cashierLogin: async (req, res) => {
    try {
      const { shopName, branchName, username, password } = req.body;
      // console.log(shopName, branchName, username, password);

      if (!username || !password || !shopName || !branchName) {
        return res.status(400).json({ message: "Please fill in all fields" });
      }

      const shop = await Shop.findOne({ shop_name: shopName });
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      // Check if subscription is active before allowing login
      if (!shop.paid || !shop.bill_status) {
        return res.status(403).json({
          message:
            "Shop subscription is inactive. Please contact the admin to renew the subscription.",
        });
      }

      const branch = await Branch.findOne({
        shop_id: shop._id,
        branch_name: branchName,
      });
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      const cashier = await Cashier.findOne({
        shop_id: shop._id,
        branch_id: branch._id,
        username,
      });
      if (!cashier) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const isMatch = await cashier.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const role = "cashier";
      const token = jwt.sign(
        {
          id: cashier._id,
          role: role,
          shopId: shop._id,
          shopName,
          branchId: branch._id,
          branchName,
        },
        process.env.JWT_SECRET,
        { expiresIn: "12h" }
      );

      res
        .status(200)
        .cookie("token", token, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
        })
        .json({
          role: role,
          shopName,
          branchName,
          userId: cashier._id,
          shopId: shop._id,
          branchId: branch._id,
        });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  logout: async (req, res) => {
    res
      .status(200)
      .clearCookie("token")
      .json({ message: "Logged out successfully" });
  },

  getShops: async (req, res) => {
    try {
      const shops = await Shop.find();
      res.status(200).send(shops);
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  getBranchesForShop: async (req, res) => {
    try {
      const { shopName } = req.params;

      if (!shopName) {
        return res.status(400).send({ message: "Please provide shop name" });
      }

      const shop = await Shop.findOne({ shop_name: shopName });
      if (!shop) {
        return res.status(404).send({ message: "Shop not found" });
      }

      const branches = await Branch.find({ shop_id: shop._id });
      res.status(200).send(branches);
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },
};

module.exports = authController;
