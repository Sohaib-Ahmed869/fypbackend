const mongoose = require("mongoose");
const { schema } = require("./Branch");
const Schema = mongoose.Schema;

const ComplaintSchema = new Schema({
  order_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  initiated_by: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  initiated_at: {
    type: Date,
    default: new Date(),
  },
  customer_name: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  complaint: {
    type: String,
    required: true,
  },
  complaint_status: {
    type: Boolean,
    default: true,
  },
  resolved_by: {
    type: Schema.Types.ObjectId,
    default: null,
  },
  resolved_at: {
    type: Date,
    default: null,
  },
});
