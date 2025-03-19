// Routes/messageRoutes.js
const express = require("express");
const router = express.Router();
const mw = require("../Middlewares/auth");
const { socketUtility } = require("../Middlewares/socketMiddleware");
const messageController = require("../Controllers/message.Controller");

// Apply socket utility middleware to all message routes
router.use(socketUtility);

// Get messages for current user
router.get("/", mw.verifyToken, messageController.getMessages);

// Send a direct message to user
router.post("/send", mw.verifyToken, messageController.sendMessage);

// Get unread message count
router.get("/unread-count", mw.verifyToken, messageController.getUnreadCount);

// Mark message as read
router.put("/:messageId/read", mw.verifyToken, messageController.markAsRead);

// Delete a message
router.delete("/:messageId", mw.verifyToken, messageController.deleteMessage);

// Get conversation with specific user
router.get(
  "/conversation/:otherUserId/:otherUserRole",
  mw.verifyToken,
  messageController.getConversation
);

// Branch broadcasts - requires manager or admin role
router.post(
  "/branch/:branchId/broadcast",
  mw.verifyToken,
  mw.verifyManagement,
  messageController.sendBranchBroadcast
);

// Get branch broadcasts
router.get(
  "/branch/:branchId/broadcasts",
  mw.verifyToken,
  messageController.getBranchBroadcasts
);

module.exports = router;
