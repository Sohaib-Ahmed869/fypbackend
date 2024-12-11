const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const IngredientSchema = new Schema({
  ingredient_name: {
    type: String,
    required: true,
    unique: true,
  },
  shop_id: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  price: {
    type: Number,
    required: true,
  },
  unit:{
    type: String,
    required:true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  demand: {
    type: Boolean,
    default: false,
  },
});

const Ingredient = mongoose.model("Ingredient", IngredientSchema);

module.exports = Ingredient;
