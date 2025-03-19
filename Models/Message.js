// Models/Message.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  // Shop and branch identifiers
  shop_id: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  branch_id: {
    type: Schema.Types.ObjectId,
    index: true,
  },

  // Sender information
  sender_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  sender_role: {
    type: String,
    required: true,
    enum: ["admin", "manager", "cashier"],
  },

  // Recipient information (not required for broadcasts)
  recipient_id: {
    type: Schema.Types.ObjectId,
  },
  recipient_role: {
    type: String,
    enum: ["admin", "manager", "cashier"],
  },

  // Broadcast flags
  broadcast: {
    type: Boolean,
    default: false,
  },
  broadcast_scope: {
    type: String,
    enum: ["shop", "branch"],
    // 'shop' means all users in the shop, 'branch' means all users in a specific branch
  },

  // Message content
  content: {
    type: String,
    required: true,
  },

  // Status tracking
  status: {
    type: String,
    required: true,
    enum: ["sent", "delivered", "read"],
    default: "sent",
  },

  // Priority level
  priority: {
    type: String,
    enum: ["low", "normal", "high", "urgent"],
    default: "normal",
  },

  // Timestamps
  sent_at: {
    type: Date,
    default: Date.now,
  },
  delivered_at: {
    type: Date,
  },
  read_at: {
    type: Date,
  },

  // Attachment (e.g., image url, file link)
  attachment: {
    type: String,
  },

  // Soft deletion flags
  deleted_by_sender: {
    type: Boolean,
    default: false,
  },
  deleted_by_recipient: {
    type: Boolean,
    default: false,
  },
});

// Indexes for faster querying
MessageSchema.index({ sender_id: 1, recipient_id: 1 });
MessageSchema.index({ broadcast: 1, broadcast_scope: 1 });
MessageSchema.index({ status: 1 });
MessageSchema.index({ sent_at: -1 });

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
