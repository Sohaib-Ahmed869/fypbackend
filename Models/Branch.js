const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SalesSchema = {
  date: {
    type: Date,
    default: Date.now,
  },
  amount: {
    type: Number,
    required: true,
  },
};

const BranchSchema = new Schema({
  branch_name: {
    type: String,
    required: true,
    index: true,
  },
  shop_id: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  manager_ids: {
    type: [Schema.Types.ObjectId],
    default: [],
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  total_tables: {
    type: Number,
  },
  contact: {
    type: String,
    required: true,
  },
  day_number: {
    type: Number,
    default: 0,
  },
  opening_time: {
    type: String,
  },
  closing_time: {
    type: String,
  },
  shift_status: {
    type: Boolean,
    default: false,
  },
  sales: [SalesSchema],
  cash_on_hand: {
    type: Number,
    default: 0,
  },
  wait_time: {
    type: Number,
    default: 3,
  },
  card_tax: {
    type: Number,
    default: 0,
  },
  cash_tax: {
    type: Number,
    default: 0,
  },
});

BranchSchema.index({ shop_id: 1, branch_name: 1 }, { unique: true });

const Branch = mongoose.model("Branch", BranchSchema);
module.exports = Branch;
