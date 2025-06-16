// Controllers/paymentController.js
const stripeService = require("../services/stripeService");
const Shop = require("../Models/Shop");

const paymentController = {
  // Create a checkout session for subscription
  createCheckoutSession: async (req, res) => {
    try {
      const { shopId } = req.body;

      // Validate request
      if (!shopId) {
        return res.status(400).json({ message: "Shop ID is required" });
      }

      // Create checkout session
      const session = await stripeService.createCheckoutSession(shopId);

      res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // Create a one-time payment checkout session
  createOneTimePaymentSession: async (req, res) => {
    try {
      const { shopId } = req.body;

      // Validate request
      if (!shopId) {
        return res.status(400).json({ message: "Shop ID is required" });
      }

      // Create checkout session
      const session = await stripeService.createOneTimePaymentSession(shopId);

      res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Error creating one-time payment session:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // Verify payment status
  verifyPayment: async (req, res) => {
    try {
      const { sessionId } = req.body;

      // Validate request
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      // Verify payment
      const result = await stripeService.verifyPaymentStatus(sessionId);

      res.status(200).json(result);
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // Handle Stripe webhook
  handleWebhook: async (req, res) => {
    try {
      const signature = req.headers["stripe-signature"];

      // Use the Stripe SDK to verify and construct the event
      const event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Process the event
      await stripeService.handleWebhook(event);

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Error handling webhook:", error);
      res.status(400).json({ message: error.message });
    }
  },

  // Get payment status for a shop
  getPaymentStatus: async (req, res) => {
    try {
      const { shopId } = req;
      // Validate request
      if (!shopId) {
        console.log("shopId: ", shopId);
        return res.status(400).json({ message: "Shop ID is required" });
      }

      // Get shop payment status
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      // Get subscription details if available
      let subscriptionDetails = null;
      if (shop.subscription_id) {
        try {
          subscriptionDetails = await stripeService.getSubscriptionDetails(
            shop.subscription_id
          );
        } catch (err) {
          console.error("Error fetching subscription details:", err);
        }
      }

      res.status(200).json({
        paid: shop.paid,
        billStatus: shop.bill_status,
        subscriptionPlan: shop.subscription_plan,
        subscriptionDetails: subscriptionDetails,
        customerPortalUrl: process.env.FRONTEND_URL + "/admin", // Or generate a customer portal URL
      });
    } catch (error) {
      console.error("Error getting payment status:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // Cancel subscription
  cancelSubscription: async (req, res) => {
    try {
      const { shopId } = req.params;

      // Validate request
      if (!shopId) {
        return res.status(400).json({ message: "Shop ID is required" });
      }

      // Cancel subscription
      const result = await stripeService.cancelSubscription(shopId);

      res.status(200).json(result);
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = paymentController;
