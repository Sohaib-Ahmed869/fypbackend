const Order = require("../Models/Order");
const Branch = require("../Models/Branch");
const Shop = require("../Models/Shop");
const axios = require("axios");
const mongoose = require("mongoose");

// Configuration
const PREDICTION_SERVICE_URL =
  process.env.PREDICTION_SERVICE_URL || "http://127.0.0.1:5002";

const predictiveController = {
  /**
   * Get sales predictions for the next days
   */
  getSalesPrediction: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "Please provide shop ID" });
      }

      const { branchId, days = 7, startDate, endDate } = req.query;

      // Get shop info
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      // Get branch info if provided
      let branch = null;
      if (branchId) {
        branch = await Branch.findById(branchId);
        if (!branch) {
          return res.status(404).json({ message: "Branch not found" });
        }
      }

      // Get recent orders for context (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const queryConditions = {
        shop_id: shopId,
        time: { $gte: thirtyDaysAgo },
      };
      if (branchId) {
        queryConditions.branch_id = branchId;
      }

      const recentOrders = await Order.find(queryConditions).sort({ time: -1 });

      // Call prediction service
      try {
        const response = await axios.post(
          `${PREDICTION_SERVICE_URL}/predict-sales`,
          {
            shop_id: shopId.toString(),
            branch_id: branchId ? branchId.toString() : null,
            city: branch ? branch.city : shop.city,
            days: parseInt(days),
            recent_orders: recentOrders.map((order) => ({
              ...order.toObject(),
              _id: order._id.toString(),
              shop_id: order.shop_id.toString(),
              branch_id: order.branch_id.toString(),
            })),
            start_date: startDate, // Add this
            end_date: endDate,
          },
          {
            timeout: 30000, // 30 second timeout
          }
        );

        return res.status(200).json(response.data);
      } catch (predictionError) {
        console.error(
          "Error from prediction service:",
          predictionError.message
        );

        if (
          predictionError.response &&
          predictionError.response.status === 404
        ) {
          // Model not trained yet
          return res.status(404).json({
            message:
              "Prediction model not found. Please train the model first.",
            error: predictionError.message,
          });
        }

        return res.status(503).json({
          message: "Prediction service unavailable",
          error: predictionError.message,
          suggestion:
            "Please ensure the prediction service is running at " +
            PREDICTION_SERVICE_URL,
        });
      }
    } catch (error) {
      console.error("Error in getSalesPrediction:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  /**
   * Train prediction model with historical data
   */
  trainPredictionModel: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "Please provide shop ID" });
      }

      const { branchId } = req.query;

      // Get shop info
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      // Get branch info if provided
      let branch = null;
      if (branchId) {
        branch = await Branch.findById(branchId);
        if (!branch) {
          return res.status(404).json({ message: "Branch not found" });
        }
      }

      // Get all historical orders
      const queryConditions = { shop_id: shopId };
      if (branchId) {
        queryConditions.branch_id = branchId;
      }

      const orders = await Order.find(queryConditions);

      if (orders.length < 30) {
        return res.status(400).json({
          message:
            "Not enough historical data to train a prediction model. At least 30 orders are required.",
          current_count: orders.length,
        });
      }

      // Call prediction service to train the model
      try {
        const response = await axios.post(
          `${PREDICTION_SERVICE_URL}/train-model`,
          {
            shop_id: shopId.toString(),
            branch_id: branchId ? branchId.toString() : null,
            city: branch ? branch.city : shop.city,
            orders: orders.map((order) => ({
              ...order.toObject(),
              _id: order._id.toString(),
              shop_id: order.shop_id.toString(),
              branch_id: order.branch_id.toString(),
            })),
          },
          {
            timeout: 60000, // 60 second timeout for training
          }
        );

        return res.status(200).json(response.data);
      } catch (trainingError) {
        console.error(
          "Error from prediction service during training:",
          trainingError.message
        );

        return res.status(503).json({
          message: "Prediction service unavailable",
          error: trainingError.message,
          suggestion:
            "Please ensure the prediction service is running at " +
            PREDICTION_SERVICE_URL,
        });
      }
    } catch (error) {
      console.error("Error in trainPredictionModel:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  /**
   * Get insights about sales patterns
   */
  getSalesInsights: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "Please provide shop ID" });
      }

      const { branchId, startDate, endDate } = req.query;

      // Prepare date filters
      const dateFilter = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.$lte = new Date(endDate);
      }

      // Prepare query conditions
      const queryConditions = { shop_id: shopId };
      if (Object.keys(dateFilter).length > 0) {
        queryConditions.time = dateFilter;
      }
      if (branchId) {
        queryConditions.branch_id = branchId;
      }

      // Get orders based on filters
      const orders = await Order.find(queryConditions);

      if (orders.length === 0) {
        return res.status(404).json({
          message: "No orders found with the specified criteria.",
        });
      }

      // Call prediction service for insights
      try {
        const response = await axios.post(
          `${PREDICTION_SERVICE_URL}/sales-insights`,
          {
            orders: orders.map((order) => ({
              ...order.toObject(),
              _id: order._id.toString(),
              shop_id: order.shop_id.toString(),
              branch_id: order.branch_id.toString(),
            })),
          },
          {
            timeout: 30000, // 30 second timeout
          }
        );

        return res.status(200).json(response.data);
      } catch (insightError) {
        console.error(
          "Error from prediction service during insights:",
          insightError.message
        );

        return res.status(503).json({
          message: "Prediction service unavailable",
          error: insightError.message,
          suggestion:
            "Please ensure the prediction service is running at " +
            PREDICTION_SERVICE_URL,
        });
      }
    } catch (error) {
      console.error("Error in getSalesInsights:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  /**
   * Get weather forecast for a specific city
   */
  getWeatherForecast: async (req, res) => {
    try {
      const { city } = req.query;
      console.log("City:", city);
      if (!city) {
        return res.status(400).json({ message: "Please provide a city name" });
      }

      // Call prediction service to get weather data
      try {
        const response = await axios.get(`${PREDICTION_SERVICE_URL}/weather`, {
          params: { city },
        });

        console.log("Weather data:", response);

        return res.status(200).json(response.data);
      } catch (weatherError) {
        console.error("Error fetching weather data:", weatherError.message);

        return res.status(503).json({
          message: "Weather service unavailable",
          error: weatherError.message,
        });
      }
    } catch (error) {
      console.error("Error in getWeatherForecast:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  /**
   * Get factors that influence sales
   */
  getSalesFactors: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "Please provide shop ID" });
      }

      const { branchId } = req.query;

      // Call prediction service for insights on sales factors
      try {
        const modelPath = `models/sales_model_${shopId}${
          branchId ? "_" + branchId : ""
        }.pkl`;

        const response = await axios.get(
          `${PREDICTION_SERVICE_URL}/model-insights`,
          {
            params: { model_path: modelPath },
            timeout: 10000, // 10 second timeout
          }
        );

        return res.status(200).json(response.data);
      } catch (factorsError) {
        console.error("Error getting sales factors:", factorsError.message);

        if (factorsError.response && factorsError.response.status === 404) {
          return res.status(404).json({
            message:
              "Prediction model not found. Please train the model first.",
          });
        }

        return res.status(503).json({
          message: "Prediction service unavailable",
          error: factorsError.message,
        });
      }
    } catch (error) {
      console.error("Error in getSalesFactors:", error);
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = predictiveController;
