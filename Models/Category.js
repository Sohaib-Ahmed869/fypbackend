const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  category_name: {
    type: String,
    required: true,
    unique: true,
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
});

CategorySchema.index({ shop_id: 1, category_name: 1 }, { unique: true });

const Category = mongoose.model("Category", CategorySchema);
module.exports = Category;
