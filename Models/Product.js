const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  description: {
    type: String,
  },
  variation: {
    type: [String],
    default: [],
  },
  category: {
    type: String,
    ref: "Category",
    default: "Basic",
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  shop_id: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  ingredients: [{
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient'
    },
    quantity: {
      type: Number,
      required: true
    }
  }]
});

ProductSchema.index({ shop_id: 1, name: 1 }, { unique: true });

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
