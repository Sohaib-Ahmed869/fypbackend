const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const ShopSchema = new Schema({
  shop_name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  branch_ids: {
    type: [Schema.Types.ObjectId],
    default: [],
  },
  product_ids: {
    type: Array,
    default: [],
  },
  website_link: {
    type: String,
  },
  logo: {
    type: String,
  },
  token: {
    type: String,
  },
  NTN: {
    type: String,
  },
  tax_integration: {
    type: Boolean,
    default: false,
  },
  social_media_links: {
    type: [String],
    default: [],
  },
  currency: {
    type: String,
    default: "PKR",
  },
  timezone: {
    type: String,
  },
  subscription_plan: {
    type: String,
  },
  bill_status: {
    type: Boolean,
    default: true,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "Not selected",
  },
});

ShopSchema.pre("save", async function (next) {
  const shop = this;
  if (shop.isModified("password")) {
    shop.password = await bcrypt.hash(shop.password, 8);
  }
  next();
});

ShopSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const Shop = mongoose.model("Shop", ShopSchema);
module.exports = Shop;
