// services/stripeService.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Shop = require("../Models/Shop");

const stripeService = {
  // Create checkout session for subscription
  createCheckoutSession: async (shopId) => {
    try {
      // Get shop info
      const shop = await Shop.findById(shopId);
      if (!shop) {
        throw new Error("Shop not found");
      }

      // Create a customer or get existing one
      let customerId = shop.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: shop.email,
          name: shop.name,
          metadata: {
            shopId: shop._id.toString(),
          },
        });
        customerId = customer.id;

        // Save customer ID to shop
        shop.stripe_customer_id = customerId;
        await shop.save();
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer: customerId,
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID, // Make sure this is the PRICE ID, not the PRODUCT ID
            quantity: 1,
          },
        ],
        metadata: {
          shopId: shopId,
        },
        // Updated success URL to go to the dedicated success page
        success_url: `${process.env.FRONTEND_URL}/admin/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/admin/dashboard`,
      });
      return session;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  },

  // Verify payment status
  verifyPaymentStatus: async (sessionId) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === "paid") {
        // Update shop payment status
        const shopId = session.metadata.shopId;
        const shop = await Shop.findById(shopId);

        if (shop) {
          shop.paid = true;
          shop.bill_status = true;
          shop.subscription_plan = "Monthly";
          shop.subscription_id = session.subscription;
          await shop.save();
        }

        return {
          success: true,
          message: "Payment verified successfully!",
        };
      } else {
        return {
          success: false,
          message: "Payment not completed",
        };
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  },

  // Handle Stripe webhook
  handleWebhook: async (event) => {
    try {
      const eventType = event.type;

      switch (eventType) {
        case "checkout.session.completed":
          const session = event.data.object;
          await handleCheckoutSessionCompleted(session);
          break;

        case "invoice.paid":
          const invoice = event.data.object;
          await handleInvoicePaid(invoice);
          break;

        case "invoice.payment_failed":
          const failedInvoice = event.data.object;
          await handlePaymentFailed(failedInvoice);
          break;

        case "customer.subscription.deleted":
          const subscription = event.data.object;
          await handleSubscriptionCanceled(subscription);
          break;
      }
    } catch (error) {
      console.error("Error handling webhook:", error);
      throw error;
    }
  },

  // Cancel subscription
  cancelSubscription: async (shopId) => {
    try {
      const shop = await Shop.findById(shopId);
      if (!shop || !shop.subscription_id) {
        throw new Error("Shop or subscription not found");
      }

      // Cancel subscription in Stripe
      await stripe.subscriptions.cancel(shop.subscription_id);

      // Update shop record
      shop.bill_status = false;
      shop.paid = false;
      shop.subscription_plan = null;
      await shop.save();

      return {
        success: true,
        message: "Subscription canceled successfully",
      };
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw error;
    }
  },
  checkSubscriptionStatus: async (shopId) => {
    try {
      const shop = await Shop.findById(shopId).select(
        "subscription_id paid bill_status"
      );

      if (!shop) {
        throw new Error("Shop not found");
      }

      if (shop.subscription_id) {
        const subscription = await stripe.subscriptions.retrieve(
          shop.subscription_id
        );

        if (subscription.status === "active") {
          if (!shop.paid) {
            shop.paid = true;
            shop.bill_status = true;
            await shop.save();
          }
        } else if (subscription.status === "canceled") {
          shop.paid = false;
          shop.bill_status = false;
          shop.subscription_plan = null;
          shop.subscription_id = null;
          await shop.save();
        }
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
      throw error;
    }
  },
};

// Helper functions for webhook handling
async function handleCheckoutSessionCompleted(session) {
  if (session.payment_status === "paid") {
    const shopId = session.metadata.shopId;
    const shop = await Shop.findById(shopId);

    if (shop) {
      shop.paid = true;
      shop.bill_status = true;
      shop.subscription_plan = "Monthly";
      shop.subscription_id = session.subscription;
      await shop.save();
    }
  }
}

async function handleInvoicePaid(invoice) {
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription
  );
  const shopId = subscription.metadata.shopId;

  const shop = await Shop.findById(shopId);
  if (shop) {
    shop.paid = true;
    shop.bill_status = true;
    await shop.save();
  }
}

async function handlePaymentFailed(invoice) {
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription
  );
  const shopId = subscription.metadata.shopId;

  const shop = await Shop.findById(shopId);
  if (shop) {
    shop.bill_status = false;
    await shop.save();
  }
}

async function handleSubscriptionCanceled(subscription) {
  const shopId = subscription.metadata.shopId;

  const shop = await Shop.findById(shopId);
  if (shop) {
    shop.paid = false;
    shop.bill_status = false;
    shop.subscription_plan = null;
    await shop.save();
  }
}

module.exports = stripeService;
