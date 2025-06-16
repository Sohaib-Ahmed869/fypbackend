const Order = require("../Models/Order");
const Branch = require("../Models/Branch");
const Product = require("../Models/Product");
const mongoose = require("mongoose");

const customerJourneyController = {
  // Get complete customer journey by customer name
  getCustomerJourney: async (req, res) => {
    try {
      const { shopId, branchId } = req;
      const { customer_name } = req.params;

      if (!shopId || !customer_name) {
        return res
          .status(400)
          .send({ message: "Please provide shop ID and customer name" });
      }

      // Build query
      const query = { shop_id: shopId, customer_name: customer_name };
      if (branchId && req.query.branch_specific === "true") {
        query.branch_id = branchId;
      }

      const orders = await Order.find(query)
        .sort({ time: 1 })
        .populate("branch_id", "branch_name address city");

      if (orders.length === 0) {
        return res
          .status(404)
          .send({ message: "No orders found for this customer" });
      }

      // Calculate journey metrics
      const journeyMetrics = {
        customer_name,
        total_orders: orders.length,
        first_order_date: orders[0].time,
        last_order_date: orders[orders.length - 1].time,
        total_spent: orders.reduce((sum, order) => sum + order.grand_total, 0),
        average_order_value:
          orders.reduce((sum, order) => sum + order.grand_total, 0) /
          orders.length,
        preferred_payment_methods: {},
        preferred_order_types: {},
        order_frequency: {},
        branch_preferences: {},
        product_preferences: {},
        completion_rate:
          (orders.filter((order) => order.status === "completed").length /
            orders.length) *
          100,
        cancellation_rate:
          (orders.filter((order) => order.status === "cancelled").length /
            orders.length) *
          100,
        customer_lifetime_days: Math.ceil(
          (orders[orders.length - 1].time - orders[0].time) /
            (1000 * 60 * 60 * 24)
        ),
        orders: orders,
      };

      // Analyze payment methods
      orders.forEach((order) => {
        journeyMetrics.preferred_payment_methods[order.payment_method] =
          (journeyMetrics.preferred_payment_methods[order.payment_method] ||
            0) + 1;
      });

      // Analyze order types
      orders.forEach((order) => {
        journeyMetrics.preferred_order_types[order.order_type] =
          (journeyMetrics.preferred_order_types[order.order_type] || 0) + 1;
      });

      // Analyze branch preferences
      orders.forEach((order) => {
        const branchName = order.branch_id?.branch_name || "Unknown";
        journeyMetrics.branch_preferences[branchName] =
          (journeyMetrics.branch_preferences[branchName] || 0) + 1;
      });

      // Analyze product preferences
      orders.forEach((order) => {
        order.cart.forEach((item) => {
          journeyMetrics.product_preferences[item.product_name] =
            (journeyMetrics.product_preferences[item.product_name] || 0) +
            item.quantity;
        });
      });

      // Calculate order frequency by month
      orders.forEach((order) => {
        const monthYear = new Date(order.time).toISOString().substring(0, 7);
        journeyMetrics.order_frequency[monthYear] =
          (journeyMetrics.order_frequency[monthYear] || 0) + 1;
      });

      res.status(200).send(journeyMetrics);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get customer journey analytics for all customers
  getCustomerAnalytics: async (req, res) => {
    try {
      const { shopId, branchId } = req;
      const {
        start_date,
        end_date,
        limit = 50,
        sort_by = "total_spent",
        order = "desc",
      } = req.query;

      if (!shopId) {
        return res.status(400).send({ message: "Please provide shop ID" });
      }

      // Build date filter
      const dateFilter = {};
      if (start_date || end_date) {
        dateFilter.time = {};
        if (start_date) dateFilter.time.$gte = new Date(start_date);
        if (end_date) dateFilter.time.$lte = new Date(end_date);
      }

      // Build aggregation pipeline
      const matchStage = {
        shop_id: new mongoose.Types.ObjectId(shopId),
        ...dateFilter,
      };

      if (branchId && req.query.branch_specific === "true") {
        matchStage.branch_id = new mongoose.Types.ObjectId(branchId);
      }

      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: "$customer_name",
            total_orders: { $sum: 1 },
            total_spent: { $sum: "$grand_total" },
            average_order_value: { $avg: "$grand_total" },
            first_order_date: { $min: "$time" },
            last_order_date: { $max: "$time" },
            completed_orders: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            cancelled_orders: {
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
            },
            payment_methods: { $push: "$payment_method" },
            order_types: { $push: "$order_type" },
            branches: { $push: "$branch_id" },
          },
        },
        {
          $addFields: {
            completion_rate: {
              $multiply: [
                { $divide: ["$completed_orders", "$total_orders"] },
                100,
              ],
            },
            cancellation_rate: {
              $multiply: [
                { $divide: ["$cancelled_orders", "$total_orders"] },
                100,
              ],
            },
            customer_lifetime_days: {
              $ceil: {
                $divide: [
                  { $subtract: ["$last_order_date", "$first_order_date"] },
                  86400000,
                ],
              },
            },
            customer_name: "$_id",
          },
        },
        { $sort: { [sort_by]: order === "desc" ? -1 : 1 } },
        { $limit: parseInt(limit) },
      ];

      const customers = await Order.aggregate(pipeline);

      // Calculate overall metrics
      const overallMetrics = {
        total_unique_customers: customers.length,
        total_revenue: customers.reduce(
          (sum, customer) => sum + customer.total_spent,
          0
        ),
        average_customer_value:
          customers.reduce((sum, customer) => sum + customer.total_spent, 0) /
          customers.length,
        average_orders_per_customer:
          customers.reduce((sum, customer) => sum + customer.total_orders, 0) /
          customers.length,
        average_completion_rate:
          customers.reduce(
            (sum, customer) => sum + customer.completion_rate,
            0
          ) / customers.length,
        customers: customers,
      };

      res.status(200).send(overallMetrics);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get customer segments based on behavior
  getCustomerSegments: async (req, res) => {
    try {
      const { shopId, branchId } = req;

      if (!shopId) {
        return res.status(400).send({ message: "Please provide shop ID" });
      }

      const matchStage = { shop_id: new mongoose.Types.ObjectId(shopId) };
      if (branchId && req.query.branch_specific === "true") {
        matchStage.branch_id = new mongoose.Types.ObjectId(branchId);
      }

      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: "$customer_name",
            total_orders: { $sum: 1 },
            total_spent: { $sum: "$grand_total" },
            first_order_date: { $min: "$time" },
            last_order_date: { $max: "$time" },
          },
        },
        {
          $addFields: {
            recency_days: {
              $ceil: {
                $divide: [
                  { $subtract: [new Date(), "$last_order_date"] },
                  86400000,
                ],
              },
            },
            customer_age_days: {
              $ceil: {
                $divide: [
                  { $subtract: [new Date(), "$first_order_date"] },
                  86400000,
                ],
              },
            },
          },
        },
      ];

      const customers = await Order.aggregate(pipeline);

      // Segment customers using RFM-like analysis
      const segments = {
        champions: [], // High value, recent, frequent
        loyal_customers: [], // High frequency, moderate value
        potential_loyalists: [], // Recent customers, good frequency
        new_customers: [], // Very recent first order
        at_risk: [], // Good customers who haven't ordered recently
        cannot_lose_them: [], // High value but haven't ordered recently
        hibernating: [], // Low frequency, haven't ordered recently
        lost: [], // Haven't ordered in a long time
      };

      // Calculate percentiles for segmentation
      const sortedBySpent = [...customers].sort(
        (a, b) => b.total_spent - a.total_spent
      );
      const sortedByOrders = [...customers].sort(
        (a, b) => b.total_orders - a.total_orders
      );
      const sortedByRecency = [...customers].sort(
        (a, b) => a.recency_days - b.recency_days
      );

      const spentP80 =
        sortedBySpent[Math.floor(sortedBySpent.length * 0.2)]?.total_spent || 0;
      const ordersP80 =
        sortedByOrders[Math.floor(sortedByOrders.length * 0.2)]?.total_orders ||
        0;
      const recencyP20 =
        sortedByRecency[Math.floor(sortedByRecency.length * 0.2)]
          ?.recency_days || 0;

      customers.forEach((customer) => {
        const isHighValue = customer.total_spent >= spentP80;
        const isFrequent = customer.total_orders >= ordersP80;
        const isRecent = customer.recency_days <= recencyP20;
        const isNew = customer.customer_age_days <= 30;
        const isLost = customer.recency_days > 90;

        if (isHighValue && isFrequent && isRecent) {
          segments.champions.push(customer);
        } else if (isFrequent && !isLost) {
          segments.loyal_customers.push(customer);
        } else if (isRecent && customer.total_orders >= 2) {
          segments.potential_loyalists.push(customer);
        } else if (isNew) {
          segments.new_customers.push(customer);
        } else if (isHighValue && isLost) {
          segments.cannot_lose_them.push(customer);
        } else if (!isRecent && !isLost && (isHighValue || isFrequent)) {
          segments.at_risk.push(customer);
        } else if (isLost && customer.total_orders <= 2) {
          segments.hibernating.push(customer);
        } else if (isLost) {
          segments.lost.push(customer);
        }
      });

      // Add segment summaries
      const segmentSummary = {};
      Object.keys(segments).forEach((segment) => {
        segmentSummary[segment] = {
          count: segments[segment].length,
          total_value: segments[segment].reduce(
            (sum, customer) => sum + customer.total_spent,
            0
          ),
          percentage: (
            (segments[segment].length / customers.length) *
            100
          ).toFixed(2),
        };
      });

      res.status(200).send({
        segment_summary: segmentSummary,
        segments: segments,
        total_customers: customers.length,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get customer churn analysis
  getChurnAnalysis: async (req, res) => {
    try {
      const { shopId, branchId } = req;
      const { churn_threshold_days = 30 } = req.query;

      if (!shopId) {
        return res.status(400).send({ message: "Please provide shop ID" });
      }

      const matchStage = { shop_id: new mongoose.Types.ObjectId(shopId) };
      if (branchId && req.query.branch_specific === "true") {
        matchStage.branch_id = new mongoose.Types.ObjectId(branchId);
      }

      const churnDate = new Date();
      churnDate.setDate(churnDate.getDate() - parseInt(churn_threshold_days));

      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: "$customer_name",
            last_order_date: { $max: "$time" },
            total_orders: { $sum: 1 },
            total_spent: { $sum: "$grand_total" },
            first_order_date: { $min: "$time" },
          },
        },
        {
          $addFields: {
            is_churned: { $lt: ["$last_order_date", churnDate] },
            days_since_last_order: {
              $ceil: {
                $divide: [
                  { $subtract: [new Date(), "$last_order_date"] },
                  86400000,
                ],
              },
            },
          },
        },
      ];

      const customers = await Order.aggregate(pipeline);

      const churned = customers.filter((c) => c.is_churned);
      const active = customers.filter((c) => !c.is_churned);

      const churnAnalysis = {
        total_customers: customers.length,
        churned_customers: churned.length,
        active_customers: active.length,
        churn_rate: ((churned.length / customers.length) * 100).toFixed(2),
        churned_customer_value: churned.reduce(
          (sum, c) => sum + c.total_spent,
          0
        ),
        active_customer_value: active.reduce(
          (sum, c) => sum + c.total_spent,
          0
        ),
        average_churned_customer_value:
          churned.length > 0
            ? churned.reduce((sum, c) => sum + c.total_spent, 0) /
              churned.length
            : 0,
        customers_at_risk: customers.filter(
          (c) =>
            !c.is_churned &&
            c.days_since_last_order > parseInt(churn_threshold_days) * 0.7
        ).length,
        churn_threshold_days: parseInt(churn_threshold_days),
      };

      res.status(200).send(churnAnalysis);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get customer retention analysis
  getRetentionAnalysis: async (req, res) => {
    try {
      const { shopId, branchId } = req;

      if (!shopId) {
        return res.status(400).send({ message: "Please provide shop ID" });
      }

      const matchStage = { shop_id: new mongoose.Types.ObjectId(shopId) };
      if (branchId && req.query.branch_specific === "true") {
        matchStage.branch_id = new mongoose.Types.ObjectId(branchId);
      }

      // Get customer cohorts by first order month
      const pipeline = [
        { $match: matchStage },
        { $sort: { customer_name: 1, time: 1 } },
        {
          $group: {
            _id: "$customer_name",
            orders: {
              $push: {
                date: "$time",
                amount: "$grand_total",
              },
            },
          },
        },
        {
          $addFields: {
            first_order_month: {
              $dateToString: {
                format: "%Y-%m",
                date: { $arrayElemAt: ["$orders.date", 0] },
              },
            },
            order_months: {
              $map: {
                input: "$orders",
                as: "order",
                in: {
                  $dateToString: {
                    format: "%Y-%m",
                    date: "$$order.date",
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: "$first_order_month",
            customers: { $push: "$order_months" },
            total_customers: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ];

      const cohortData = await Order.aggregate(pipeline);

      // Calculate retention rates for each cohort
      const retentionAnalysis = cohortData.map((cohort) => {
        const cohortMonth = cohort._id;
        const retentionByMonth = {};

        // Get all unique months that exist in the data
        const allMonths = new Set();
        cohort.customers.forEach((customerMonths) => {
          customerMonths.forEach((month) => allMonths.add(month));
        });

        const sortedMonths = Array.from(allMonths).sort();
        const cohortIndex = sortedMonths.indexOf(cohortMonth);

        // Calculate retention for each subsequent month
        sortedMonths.slice(cohortIndex).forEach((month, index) => {
          const customersInMonth = cohort.customers.filter((customerMonths) =>
            customerMonths.includes(month)
          ).length;

          retentionByMonth[`month_${index}`] = {
            month: month,
            customers: customersInMonth,
            retention_rate: (
              (customersInMonth / cohort.total_customers) *
              100
            ).toFixed(2),
          };
        });

        return {
          cohort_month: cohortMonth,
          total_customers: cohort.total_customers,
          retention_by_month: retentionByMonth,
        };
      });

      res.status(200).send({
        cohort_analysis: retentionAnalysis,
        total_cohorts: retentionAnalysis.length,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get popular customer journeys/paths
  getCustomerPaths: async (req, res) => {
    try {
      const { shopId, branchId } = req;
      const { min_orders = 3 } = req.query;

      if (!shopId) {
        return res.status(400).send({ message: "Please provide shop ID" });
      }

      const matchStage = { shop_id: new mongoose.Types.ObjectId(shopId) };
      if (branchId && req.query.branch_specific === "true") {
        matchStage.branch_id = new mongoose.Types.ObjectId(branchId);
      }

      // Get customer order sequences
      const pipeline = [
        { $match: matchStage },
        { $sort: { customer_name: 1, time: 1 } },
        {
          $group: {
            _id: "$customer_name",
            order_sequence: {
              $push: {
                order_type: "$order_type",
                payment_method: "$payment_method",
                status: "$status",
                products: "$cart.product_name",
              },
            },
            total_orders: { $sum: 1 },
          },
        },
        { $match: { total_orders: { $gte: parseInt(min_orders) } } },
      ];

      const customerSequences = await Order.aggregate(pipeline);

      // Analyze common patterns
      const patterns = {
        order_type_sequences: {},
        payment_method_sequences: {},
        product_sequences: {},
        journey_completion_patterns: {},
      };

      customerSequences.forEach((customer) => {
        // Order type sequences
        const orderTypes = customer.order_sequence
          .map((o) => o.order_type)
          .join(" -> ");
        patterns.order_type_sequences[orderTypes] =
          (patterns.order_type_sequences[orderTypes] || 0) + 1;

        // Payment method sequences
        const paymentMethods = customer.order_sequence
          .map((o) => o.payment_method)
          .join(" -> ");
        patterns.payment_method_sequences[paymentMethods] =
          (patterns.payment_method_sequences[paymentMethods] || 0) + 1;

        // Journey completion pattern
        const statuses = customer.order_sequence.map((o) => o.status);
        const completionRate = (
          (statuses.filter((s) => s === "completed").length / statuses.length) *
          100
        ).toFixed(0);
        const pattern = `${completionRate}% completion`;
        patterns.journey_completion_patterns[pattern] =
          (patterns.journey_completion_patterns[pattern] || 0) + 1;
      });

      // Sort patterns by frequency
      Object.keys(patterns).forEach((patternType) => {
        patterns[patternType] = Object.entries(patterns[patternType])
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10) // Top 10 patterns
          .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {});
      });

      res.status(200).send({
        total_analyzed_customers: customerSequences.length,
        min_orders_threshold: parseInt(min_orders),
        common_patterns: patterns,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = customerJourneyController;
