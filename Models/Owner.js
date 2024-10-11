const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OwnerSchema = new Schema({
  shop_ids: {
    type: [Schema.Types.ObjectId],
    default: [],
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  subscription_plan: {
    type: String,
    required: true,
  },
  bill_status: {
    type: Boolean,
    default: true,
  },
});

const Owner = mongoose.model("Owner", OwnerSchema);
module.exports = Owner; 