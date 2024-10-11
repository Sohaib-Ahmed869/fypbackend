const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const IngredientSchema = new Schema({
  ingredient_name: {
    type: String,
    required: true,
    unique: true,
  },
  ingredient_description: {
    type: String,
    required: true,
  },
  ingredient_status: {
    type: Boolean,
    default: true,
  },
  shop_id: {
    type: Schema.Types.ObjectId,
    unique: true,
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const Ingredient = mongoose.model("Ingredient", IngredientSchema);

module.exports = Ingredient;
