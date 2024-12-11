const Shop = require("../Models/Shop");
const Branch = require("../Models/Branch");
const Manager = require("../Models/Manager");
const Category = require("../Models/Category");
const Order = require("../Models/Order");
const Product = require("../Models/Product");
const mongoose = require("mongoose");
const axios = require("axios");

const adminController = {
  getShop: async (req, res) => {
    try {
      var shopId = req.shopId;
      if (!shopId) {
        shopId = req.params.shopId;
      }
      const shop = await Shop.find({ _id: shopId });

      if (!shop) {
        return res.status(404).send({ message: "Shop not found" });
      }
      res.status(200).send(shop);
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  getBranches: async (req, res) => {
    try {
      var shopId = req.shopId;
      if (!shopId) {
        shopId = req.params.shopId;
      }
      if (!shopId) {
        return res.status(400).send({ message: "Please provide shop name" });
      }
      const shop = await Shop.findOne({ _id: shopId });

      if (!shop) {
        return res.status(404).send({ message: "Shop not found" });
      }

      const branches = await Branch.find({ shop_id: shopId });
      res.status(200).send(branches);
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  getAllOrders: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).send({ message: "Please provide shop name" });
      }

      const orders = await Order.find({ shop_id: shopId }).sort({ _id: -1 });
      res.status(200).send(orders);
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  getTotalSales: async (req, res) => {
    try {
      var shopId = req.shopId;
      if (!shopId) {
        shopId = req.params.shopId;
      }
      if (!shopId) {
        return res.status(400).send({ message: "Please provide shop name" });
      }

      const shop = await Shop.findOne({ _id: shopId });

      if (!shop) {
        return res.status(404).send({ message: "Shop not found" });
      }

      const branches = await Branch.find({ shop_id: shopId });

      const { startDate, endDate } = req.query;
      let totalSales = 0;

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).send({ message: "Invalid date format" });
        }

        for (let i = 0; i < branches.length; i++) {
          let branch = branches[i];
          let sales = branch.sales.filter(
            (sale) => new Date(sale.date) >= start && new Date(sale.date) <= end
          );
          totalSales += sales.reduce((acc, sale) => acc + sale.amount, 0);
        }
      } else {
        for (let i = 0; i < branches.length; i++) {
          let branch = branches[i];
          totalSales += branch.sales.reduce(
            (acc, sale) => acc + sale.amount,
            0
          );
        }
      }

      res.status(200).send({ totalSales });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  addBranch: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).send({ message: "Please provide shop name" });
      }

      const {
        branchName,
        address,
        city,
        contact,
        total_tables,
        opening_time,
        closing_time,
        card_tax,
        cash_tax,
        coordinate_x,
        coordinate_y,
      } = req.body;

      if (!branchName || !address || !city || !contact) {
        return res.status(400).send({ message: "Please fill in all fields" });
      }

      const shop = await Shop.findOne({ _id: shopId });

      if (!shop) {
        return res.status(404).send({ message: "Shop not found" });
      }

      const branch = new Branch({
        branch_name: branchName,
        shop_id: shopId,
        address,
        city,
        contact,
        total_tables,
        opening_time,
        closing_time,
        card_tax,
        cash_tax,
        coordinate_x,
        coordinate_y,
      });

      await branch.save();
      res.status(201).send({ message: "Branch created successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  updateBranch: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).send({ message: "Please provide shop name" });
      }

      const {
        branchName,
        newName,
        address,
        city,
        contact,
        totalTables,
        openingTime,
        closingTime,
        shiftStatus,
      } = req.body;

      if (!branchName) {
        return res
          .status(400)
          .send({ message: "Please fill in all required fields" });
      }

      const branch = await Branch.findOne({
        shop_id: shopId,
        branch_name: branchName,
      });

      if (!branch) {
        return res.status(404).send({ message: "Branch not found" });
      }

      branch.branch_name = newName || branchName;
      branch.address = address || branch.address;
      branch.city = city || branch.city;
      branch.contact = contact || branch.contact;
      branch.total_tables = totalTables || branch.total_tables;
      branch.opening_time = openingTime || branch.opening_time;
      branch.closing_time = closingTime || branch.closing_time;
      branch.shift_status = shiftStatus || branch.shift_status;

      await branch.save();

      res.status(200).send({ message: "Branch updated successfully" });
    } catch (error) {
      console;
      res.status(500).send({ message: error.message });
    }
  },

  deleteBranch: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).send({ message: "Please provide shop name" });
      }

      const { branchName } = req.body;

      const branch = await Branch.findOne({
        shop_id: shopId,
        branch_name: branchName,
      });

      if (!branch) {
        return res.status(404).send({ message: "Branch not found" });
      }

      await branch.delete();

      res.status(200).send({ message: "Branch deleted successfully" });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },

  getManagers: async (req, res) => {
    try {
      var shopId = req.shopId;
      if (!shopId) {
        shopId = req.params.shopId;
      }
      if (!shopId) {
        return res.status(400).send({ message: "Please provide shop name" });
      }

      const managers = await Manager.find({ shop_id: shopId }).populate({
        path: "branch_id",
        select: "branch_name",
      });

      res.status(200).send(managers);
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  addManager: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "Please provide shop name" });
      }

      const {
        branchName,
        username,
        email,
        password,
        firstName,
        lastName,
        contact,
      } = req.body;
      if (
        !username ||
        !password ||
        !branchName ||
        !email ||
        !firstName ||
        !lastName ||
        !contact
      ) {
        return res.status(400).json({ message: "Please fill in all fields" });
      }

      const branch = await Branch.findOne({
        shop_id: shopId,
        branch_name: branchName,
      });
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      const manager = new Manager({
        shop_id: shopId,
        branch_id: branch._id,
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        contact,
      });
      await manager.save();

      branch.manager_ids.push(manager._id);
      await branch.save();

      res.status(201).json({ message: "Manager created successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  addCategory: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "Please provide shop name" });
      }

      const { categoryName } = req.body;
      if (!categoryName) {
        return res.status(400).json({ message: "Please fill in all fields" });
      }

      const category = new Category({
        category_name: categoryName,
        shop_id: shopId,
      });
      await category.save();

      res.status(201).json({ message: "Category added successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  getCategories: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "Please provide shop name" });
      }

      const categories = await Category.find({ shop_id: shopId, status: true });
      res.status(200).json(categories);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  getAllProducts: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "Please provide shop name" });
      }

      const products = await Product.find({ shop_id: shopId });
      res.status(200).json(products);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  getNumberOfBranches: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "Please provide shop name" });
      }

      const branches = await Branch.find({ shop_id: shopId });
      res.status(200).json({ numberOfBranches: branches.length });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  getBranchesSales: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "Please provide shop name" });
      }

      const branches = await Branch.find({ shop_id: shopId });
      let branchSales = [];
      for (let i = 0; i < branches.length; i++) {
        let branch = branches[i];
        let sales = 0;
        //get all orders for the branch
        const orders = await Order.find({ branch_id: branch._id });
        //sum the total amount of all orders
        for (let j = 0; j < orders.length; j++) {
          sales += orders[j].grand_total;
        }
        branchSales.push({ branch: branch.branch_name, sales });
      }

      res.status(200).json(branchSales);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  getFeedbackAnalysis: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "Please provide shop name" });
      }

      // Get all orders with feedback
      const orders = await Order.find({
        shop_id: shopId,
        feedback: { $exists: true, $ne: null }, // Only get orders with feedback
      }).select("feedback customer_name time branch_id");

      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "No feedback found" });
      }

      // Extract just the feedback texts
      const feedbacks = orders.map((order) => order.feedback);

      try {
        // Send to Flask server for analysis
        const analysisResponse = await axios.post(
          "http://127.0.0.1:5001/analyze-feedback",
          {
            reviews: feedbacks,
          }
        );

        // Combine the analysis with order details
        const enrichedAnalysis = {
          raw_data: orders.map((order) => ({
            feedback: order.feedback,
            customer_name: order.customer_name,
            time: order.time,
            branch_id: order.branch_id,
          })),
          analysis: analysisResponse.data.analysis,
        };

        console.log("Enriched analysis:", enrichedAnalysis.analysis.keyword_analysis.top_keywords);
        res.status(200).json(enrichedAnalysis);
      } catch (flaskError) {
        console.error("Error from Flask server:", flaskError);
        res.status(503).json({
          message: "Feedback analysis service unavailable",
          error: flaskError.message,
        });
      }
    } catch (error) {
      console.error("Error in getFeedbackAnalysis:", error);
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = adminController;
