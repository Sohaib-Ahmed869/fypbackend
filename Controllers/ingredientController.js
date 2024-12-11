const Shop = require("../Models/Shop");
const Category = require("../Models/Category");
const Ingredient = require("../Models/Ingredient");

const IngredientController = {
  addIngredient: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).send({ message: "Please provide branch name" });
      }
      const shop = await Shop.findOne({ _id: shopId });

      if (!shop) {
        return res.status(404).send({ message: "Shop not found" });
      }

      const { ingredient_name, price, quantity, unit } = req.body;

      if (!ingredient_name || !price || !quantity) {
        return res.status(400).send({ message: "Please fill in all fields" });
      }

      const ingredient = new Ingredient({
        ingredient_name,
        shop_id: shopId,
        price,
        quantity,
        unit,
      });

      await ingredient.save();

      return res
        .status(200)
        .send({ message: `Ingredient has been added for shop ${shop.name}` });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
  updateIngredientPrice: async (req, res) => {
    try {
      const { ingredientId } = req.params;
      const { price } = req.body;

      if (price === undefined) {
        return res
          .status(400)
          .send({ message: "Please provide a valid price" });
      }

      const ingredient = await Ingredient.findById(ingredientId);
      if (!ingredient) {
        return res.status(404).send({ message: "Ingredient not found" });
      }

      ingredient.price = price;
      await ingredient.save();

      return res
        .status(200)
        .send({ message: "Ingredient price updated successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
  updateIngredientQuantity: async (req, res) => {
    try {
      const { ingredientId } = req.params;
      const { quantity } = req.body;

      if (quantity === undefined) {
        return res
          .status(400)
          .send({ message: "Please provide a valid quantity" });
      }

      const ingredient = await Ingredient.findById(ingredientId);
      if (!ingredient) {
        return res.status(404).send({ message: "Ingredient not found" });
      }

      ingredient.quantity = quantity;
      await ingredient.save();

      return res
        .status(200)
        .send({ message: "Ingredient quantity updated successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
  addIngredientDemand: async (req, res) => {
    try {
      const { ingredientId } = req.params;

      const ingredient = await Ingredient.findById(ingredientId);
      if (!ingredient) {
        return res.status(404).send({ message: "Ingredient not found" });
      }

      ingredient.demand = true; // Mark ingredient as in demand
      await ingredient.save();

      return res
        .status(200)
        .send({ message: "Ingredient marked as in demand" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
  getAllIngredientsByShop: async (req, res) => {
    try {
      const shopId = req.shopId;
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return res.status(404).send({ message: "Shop not found" });
      }

      const ingredients = await Ingredient.find({ shop_id: shopId });
      console.log(ingredients);

      return res.status(200).send({ ingredients });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
};

module.exports = IngredientController;
