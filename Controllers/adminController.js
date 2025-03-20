const Shop = require("../Models/Shop");
const Branch = require("../Models/Branch");
const Manager = require("../Models/Manager");
const Category = require("../Models/Category");
const Order = require("../Models/Order");
const Product = require("../Models/Product");
const mongoose = require("mongoose");
const axios = require("axios");
// Helper function for basic sentiment analysis when the API is unavailable
function getBasicSentiment(text) {
  if (!text) return { label: "NEUTRAL", score: 0.5 };

  const text_lower = text.toLowerCase();

  // Simple positive and negative word lists
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "love",
    "delicious",
    "tasty",
    "perfect",
    "awesome",
    "recommend",
    "best",
    "friendly",
    "helpful",
    "clean",
    "enjoy",
    "enjoyed",
    "fresh",
    "quality",
    "attentive",
    "wonderful",
    "fantastic",
    "happy",
    "pleased",
  ];

  const negativeWords = [
    "bad",
    "poor",
    "terrible",
    "awful",
    "worst",
    "disappoint",
    "disappointed",
    "slow",
    "rude",
    "cold",
    "wait",
    "wrong",
    "dirty",
    "stale",
    "overpriced",
    "expensive",
    "mediocre",
    "unhappy",
    "unpleasant",
    "horrible",
    "bland",
    "disgusting",
  ];

  // Count positive and negative words
  const positiveCount = positiveWords.reduce((count, word) => {
    return count + (text_lower.includes(word) ? 1 : 0);
  }, 0);

  const negativeCount = negativeWords.reduce((count, word) => {
    return count + (text_lower.includes(word) ? 1 : 0);
  }, 0);

  // Determine sentiment based on word counts
  if (positiveCount > negativeCount) {
    const score = Math.min(0.9, 0.5 + (positiveCount - negativeCount) * 0.1);
    return { label: "POSITIVE", score };
  } else if (negativeCount > positiveCount) {
    const score = Math.min(0.9, 0.5 + (negativeCount - positiveCount) * 0.1);
    return { label: "NEGATIVE", score };
  } else {
    return { label: "NEUTRAL", score: 0.5 };
  }
}
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
      }).select(
        "feedback customer_name time branch_id order_type payment_method grand_total"
      );

      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "No feedback found" });
      }

      // Extract feedback texts
      const feedbacks = orders.map((order) => order.feedback);

      // Create metadata for temporal analysis
      const metadata = orders.map((order) => ({
        time: order.time,
        customer_name: order.customer_name,
        branch_id: order.branch_id?.toString(),
        order_type: order.order_type,
        payment_method: order.payment_method,
        grand_total: order.grand_total,
      }));

      try {
        // Send to Flask server for analysis
        const analysisResponse = await axios.post(
          "http://127.0.0.1:5001/analyze-feedback",
          {
            reviews: feedbacks,
            metadata: metadata,
            format_for_dashboard: true,
          },
          {
            timeout: 30000, // 30 second timeout
          }
        );

        // Check if we received a valid response
        if (!analysisResponse.data || !analysisResponse.data.analysis) {
          throw new Error("Invalid response from feedback analysis service");
        }

        // Combine the analysis with order details
        const enrichedAnalysis = {
          raw_data: orders.map((order) => ({
            feedback: order.feedback,
            customer_name: order.customer_name,
            time: order.time,
            branch_id: order.branch_id,
            order_type: order.order_type,
            payment_method: order.payment_method,
            grand_total: order.grand_total,
          })),
          analysis: analysisResponse.data.analysis,
          dashboard_data: analysisResponse.data.dashboard_data || null,
        };

        // Log important keywords for debugging
        if (
          enrichedAnalysis.analysis.keyword_analysis &&
          enrichedAnalysis.analysis.keyword_analysis.top_keywords
        ) {
          console.log(
            "Top keywords:",
            Object.keys(
              enrichedAnalysis.analysis.keyword_analysis.top_keywords
            ).slice(0, 5)
          );
        }

        res.status(200).json(enrichedAnalysis);
      } catch (flaskError) {
        console.error("Error from Flask server:", flaskError.message);

        // If there's a specific error from the service
        if (flaskError.response && flaskError.response.data) {
          console.error("Service error details:", flaskError.response.data);
        }

        // Provide helpful error information to the client
        res.status(503).json({
          message: "Feedback analysis service unavailable",
          error: flaskError.message,
          suggestion:
            "Please ensure the feedback analysis service is running at http://127.0.0.1:5001",
        });
      }
    } catch (error) {
      console.error("Error in getFeedbackAnalysis:", error);
      res.status(500).json({ message: error.message });
    }
  },
  getSuggestionsByFeedback: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "Please provide shop name" });
      }

      const { feedback } = req.body;
      if (!feedback) {
        return res
          .status(400)
          .json({ message: "Please provide feedback text" });
      }

      try {
        // Send to Flask server for suggestions
        const response = await axios.post(
          "http://127.0.0.1:5001/suggest-improvements",
          {
            reviews: [feedback],
          },
          {
            timeout: 10000, // 10 second timeout
          }
        );

        // Return the suggestions from the analysis service
        res.status(200).json(response.data);
      } catch (flaskError) {
        console.error(
          "Error from Flask suggestion service:",
          flaskError.message
        );

        res.status(503).json({
          message: "Feedback suggestion service unavailable",
          error: flaskError.message,
        });
      }
    } catch (error) {
      console.error("Error in getSuggestionsByFeedback:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getQuickSentimentAnalysis: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "Please provide shop name" });
      }

      const { text } = req.body;
      console.log("Text:", text); 
      if (!text) {
        return res
          .status(400)
          .json({ message: "Please provide text for sentiment analysis" });
      }

      try {
        // Send to Flask server for sentiment analysis
        const response = await axios.post(
          "http://127.0.0.1:5001/sentiment",
          {
            text: text,
          },
          {
            timeout: 5000, // 5 second timeout
          }
        );

        // Return the sentiment analysis
        res.status(200).json(response.data);
      } catch (flaskError) {
        console.error(
          "Error from sentiment analysis service:",
          flaskError.message
        );

        // Fallback to basic sentiment analysis
        const basicSentiment = getBasicSentiment(text);

        res.status(200).json({
          message:
            "Using fallback sentiment analysis due to service unavailability",
          sentiment: basicSentiment,
        });
      }
    } catch (error) {
      console.error("Error in getQuickSentimentAnalysis:", error);
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = adminController;
