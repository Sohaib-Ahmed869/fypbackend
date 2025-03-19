// Controllers/messageController.js
const mongoose = require("mongoose");
const Message = require("../Models/Message");
const Shop = require("../Models/Shop");
const Branch = require("../Models/Branch");
const Manager = require("../Models/Manager");
const Cashier = require("../Models/Cashier");

const messageController = {
  // Send a message
  sendMessage: async (req, res) => {
    try {
      const { recipient, recipientId, content, priority } = req.body;
      const { shopId, branchId, id: senderId, role: senderRole } = req;

      if (!recipient || !recipientId || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate recipient exists
      let recipientExists = false;

      if (recipient === "admin") {
        const shop = await Shop.findById(recipientId);
        recipientExists = !!shop;
      } else if (recipient === "manager") {
        const manager = await Manager.findById(recipientId);
        recipientExists = !!manager;
      } else if (recipient === "cashier") {
        const cashier = await Cashier.findById(recipientId);
        recipientExists = !!cashier;
      } else {
        return res.status(400).json({ message: "Invalid recipient type" });
      }

      if (!recipientExists) {
        return res.status(404).json({ message: "Recipient not found" });
      }

      // Create new message
      const message = new Message({
        shop_id: shopId,
        branch_id: branchId,
        sender_id: senderId,
        sender_role: senderRole,
        recipient_id: recipientId,
        recipient_role: recipient,
        content,
        priority: priority || "normal",
        status: "sent",
        sent_at: new Date(),
      });

      await message.save();

      // Send real-time notification using Socket.IO
      const delivered = req.socket.notifyUser(recipientId, recipient, {
        type: "private-message",
        messageId: message._id,
        message: content,
        sender: {
          id: senderId,
          role: senderRole,
          name: senderRole.charAt(0).toUpperCase() + senderRole.slice(1), // Capitalize role as temp name
        },
        priority: priority || "normal",
      });

      // If user is online, mark as delivered
      if (delivered) {
        message.status = "delivered";
        message.delivered_at = new Date();
        await message.save();
      }

      res.status(201).json({
        message: "Message sent successfully",
        messageId: message._id,
        delivered,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get messages for current user
  getMessages: async (req, res) => {
    try {
      const { id, role, shopId, branchId } = req;
      const { status, limit = 50, skip = 0 } = req.query;

      // Build query based on user role and optional status filter
      const query = {
        $or: [
          { sender_id: id, sender_role: role },
          { recipient_id: id, recipient_role: role },
        ],
        shop_id: shopId,
      };

      if (branchId) {
        query.branch_id = branchId;
      }

      if (status) {
        query.status = status;
      }

      // Get messages with pagination
      const messages = await Message.find(query)
        .sort({ sent_at: -1 }) // Most recent first
        .skip(parseInt(skip))
        .limit(parseInt(limit));

      // Count total messages for pagination
      const totalMessages = await Message.countDocuments(query);

      res.status(200).json({
        messages,
        pagination: {
          total: totalMessages,
          limit: parseInt(limit),
          skip: parseInt(skip),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },

  // Mark message as read
  markAsRead: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { id, role } = req;

      const message = await Message.findById(messageId);

      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Check if user is the recipient
      if (
        message.recipient_id.toString() !== id ||
        message.recipient_role !== role
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to mark this message" });
      }

      message.status = "read";
      message.read_at = new Date();

      await message.save();

      res.status(200).json({ message: "Message marked as read" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get unread message count
  getUnreadCount: async (req, res) => {
    try {
      const { id, role, shopId } = req;

      const count = await Message.countDocuments({
        recipient_id: id,
        recipient_role: role,
        shop_id: shopId,
        status: "sent",
      });

      res.status(200).json({ unreadCount: count });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },

  // Delete a message
  deleteMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { id, role } = req;

      const message = await Message.findById(messageId);

      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Check if user is the sender or recipient
      if (
        (message.sender_id.toString() !== id || message.sender_role !== role) &&
        (message.recipient_id.toString() !== id ||
          message.recipient_role !== role)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this message" });
      }

      // Instead of deleting, mark as deleted for the user
      if (message.sender_id.toString() === id && message.sender_role === role) {
        message.deleted_by_sender = true;
      }

      if (
        message.recipient_id.toString() === id &&
        message.recipient_role === role
      ) {
        message.deleted_by_recipient = true;
      }

      // If both deleted, actually remove the message
      if (message.deleted_by_sender && message.deleted_by_recipient) {
        await Message.findByIdAndDelete(messageId);
      } else {
        await message.save();
      }

      res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get conversation between two users
  getConversation: async (req, res) => {
    try {
      const { otherUserId, otherUserRole } = req.params;
      const { id, role, shopId } = req;
      const { limit = 50, skip = 0 } = req.query;

      const query = {
        shop_id: shopId,
        $or: [
          {
            sender_id: id,
            sender_role: role,
            recipient_id: otherUserId,
            recipient_role: otherUserRole,
          },
          {
            sender_id: otherUserId,
            sender_role: otherUserRole,
            recipient_id: id,
            recipient_role: role,
          },
        ],
      };

      // Get conversation messages
      const messages = await Message.find(query)
        .sort({ sent_at: -1 }) // Most recent first
        .skip(parseInt(skip))
        .limit(parseInt(limit));

      // Get total count
      const totalMessages = await Message.countDocuments(query);

      res.status(200).json({
        messages,
        pagination: {
          total: totalMessages,
          limit: parseInt(limit),
          skip: parseInt(skip),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },

  // Send a broadcast message to all staff in a branch
  sendBranchBroadcast: async (req, res) => {
    try {
      const { branchId } = req.params;
      const { content, priority } = req.body;
      const { id: senderId, role: senderRole, shopId } = req;

      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Verify branch exists
      const branch = await Branch.findOne({
        _id: branchId,
        shop_id: shopId,
      });

      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      // Create broadcast message (special type that doesn't target specific recipient)
      const message = new Message({
        shop_id: shopId,
        branch_id: branchId,
        sender_id: senderId,
        sender_role: senderRole,
        broadcast: true,
        broadcast_scope: "branch",
        content,
        priority: priority || "normal",
        status: "sent",
        sent_at: new Date(),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get all broadcast messages for a branch
  getBranchBroadcasts: async (req, res) => {
    try {
      const { branchId } = req.params;
      const { shopId } = req;
      const { limit = 20, skip = 0 } = req.query;

      const query = {
        shop_id: shopId,
        branch_id: branchId,
        broadcast: true,
        broadcast_scope: "branch",
      };

      const broadcasts = await Message.find(query)
        .sort({ sent_at: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit));

      const totalBroadcasts = await Message.countDocuments(query);

      res.status(200).json({
        broadcasts,
        pagination: {
          total: totalBroadcasts,
          limit: parseInt(limit),
          skip: parseInt(skip),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = messageController;
