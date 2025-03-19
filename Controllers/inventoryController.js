// Controllers/inventoryController.js
const BranchInventory = require("../Models/Inventory");
const Branch = require("../Models/Branch");
const Ingredient = require("../Models/Ingredient");

const inventoryController = {
  // Add or update ingredient quantity in branch inventory
  updateInventory: async (req, res) => {
    try {
      const { branchId } = req.params;
      const { ingredient_id, quantity, min_threshold } = req.body;

      if (!ingredient_id || quantity === undefined) {
        return res.status(400).send({ message: "Please provide ingredient ID and quantity" });
      }

      // Verify branch exists
      const branch = await Branch.findById(branchId);
      if (!branch) {
        return res.status(404).send({ message: "Branch not found" });
      }

      // Verify ingredient exists
      const ingredient = await Ingredient.findById(ingredient_id);
      if (!ingredient) {
        return res.status(404).send({ message: "Ingredient not found" });
      }

      // Update or create inventory entry
      const inventory = await BranchInventory.findOneAndUpdate(
        { branch_id: branchId, ingredient_id },
        { 
          quantity,
          min_threshold: min_threshold || 0,
          last_updated: Date.now()
        },
        { upsert: true, new: true }
      );

      res.status(200).send({ 
        message: "Inventory updated successfully",
        inventory 
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  // Get all ingredients inventory for a branch
  getBranchInventory: async (req, res) => {
    try {
      const { branchId } = req.params;
      
      const inventory = await BranchInventory.find({ branch_id: branchId })
        .populate('ingredient_id', 'ingredient_name price unit')
        .sort('ingredient_id.ingredient_name');

      res.status(200).send({ inventory });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  // Check low inventory items
  getLowInventory: async (req, res) => {
    try {
      const { branchId } = req.params;
      
      const lowInventory = await BranchInventory.find({
        branch_id: branchId,
        $expr: { $lte: ["$quantity", "$min_threshold"] }
      }).populate('ingredient_id', 'ingredient_name price unit');

      res.status(200).send({ lowInventory });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  // Transfer inventory between branches
  transferInventory: async (req, res) => {
    try {
      const { fromBranchId, toBranchId, ingredient_id, quantity } = req.body;

      if (!fromBranchId || !toBranchId || !ingredient_id || !quantity) {
        return res.status(400).send({ message: "Please provide all required fields" });
      }

      // Check if source branch has enough quantity
      const sourceInventory = await BranchInventory.findOne({
        branch_id: fromBranchId,
        ingredient_id
      });

      if (!sourceInventory || sourceInventory.quantity < quantity) {
        return res.status(400).send({ message: "Insufficient quantity in source branch" });
      }

      // Update source branch inventory
      await BranchInventory.findOneAndUpdate(
        { branch_id: fromBranchId, ingredient_id },
        { 
          $inc: { quantity: -quantity },
          last_updated: Date.now()
        }
      );

      // Update destination branch inventory
      await BranchInventory.findOneAndUpdate(
        { branch_id: toBranchId, ingredient_id },
        { 
          $inc: { quantity: quantity },
          last_updated: Date.now()
        },
        { upsert: true }
      );

      res.status(200).send({ message: "Inventory transfer successful" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  }
};

module.exports = inventoryController;