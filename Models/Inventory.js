// Models/BranchInventory.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BranchInventorySchema = new Schema({
  branch_id: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true
  },
  ingredient_id: {
    type: Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  min_threshold: {
    type: Number,
    default: 0
  },
  last_updated: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique branch-ingredient combinations
BranchInventorySchema.index({ branch_id: 1, ingredient_id: 1 }, { unique: true });

const BranchInventory = mongoose.model("BranchInventory", BranchInventorySchema);

module.exports = BranchInventory;