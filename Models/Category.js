const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  category_name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  shop_id: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

CategorySchema.index({ shop_id: 1, category_name: 1 }, { unique: true });

const Category = mongoose.model("Category", CategorySchema);
module.exports = Category;
