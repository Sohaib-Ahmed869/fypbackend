const express = require("express");
require("dotenv").config();
const jwt = require("jsonwebtoken");
// const Admin = require("../Models/Admin");
const Shop = require("../Models/Shop");
const Branch = require("../Models/Branch");
const Manager = require("../Models/Manager");
const Cashier = require("../Models/Cashier");

const authController = {
  /*
  signup: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Please fill in all fields" });
      }
      const admin = new Admin({ username, email, password });
      await admin.save();

      res.status(201).json({ message: "Admin created successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Please fill in all fields" });
      }
      const admin = await Admin.findOne({ username });
      if (!admin) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      role = "superadmin";
      const token = jwt.sign(
        { id: admin._id, role: role },
        process.env.JWT_SECRET
      );
  
      res
        .status(200)
        .cookie("token", token, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
        })
        .json({ role: role });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  */

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
      });

      await shop.save();

      res.status(201).json({ message: "Shop created successfully" });
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

      res
        .status(200)
        .cookie("token", token, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
        })
        .json({ role: role, shopName: shopName });
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
        .json({ role: role, shopName, branchName });

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
        .json({ role: role, shopName, branchName });
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
