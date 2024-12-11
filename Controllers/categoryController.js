const Category = require("../Models/Category");
const Shop = require("../Models/Shop");

const CategoryController = {
  addCategory: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).send({ message: "Please provide shop name" });
      }

      const shop = await Shop.findOne({ _id: shopId });

      if (!shop) {
        return res.status(404).send({ message: "Shop not found" });
      }
      const { category_name, status } = req.body;

      if (!category_name || !status) {
        return res.status(400).send({ message: "Please fill in all fields" });
      }

      const category = new Category({
        category_name,
        shop_id: shopId,
        status,
      });

      await category.save();
      return res.status(201).send({ message: "Category added successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
  updateCategoryName: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { category_name } = req.body;

      if (!category_name) {
        return res
          .status(400)
          .send({ message: "Please provide a category name" });
      }

      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).send({ message: "Category not found" });
      }

      category.category_name = category_name;
      await category.save();

      return res
        .status(200)
        .send({ message: "Category name updated successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
  toggleCategoryStatus: async (req, res) => {
    try {
      const { categoryId } = req.params;

      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).send({ message: "Category not found" });
      }

      category.status = !category.status; // Toggle the boolean status
      await category.save();

      return res.status(200).send({
        message: `Category status updated to ${
          category.status ? "active" : "inactive"
        }`,
        status: category.status,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
  getAllCategoriesByShop: async (req, res) => {
    try {
      const { shopId } = req.body; // Assumes the shop ID is provided via middleware or request
      if (!shopId) {
        return res.status(400).send({ message: "Please provide a shop ID" });
      }

      const shop = await Shop.findById(shopId);
      if (!shop) {
        return res.status(404).send({ message: "Shop not found" });
      }

      const categories = await Category.find({ shop_id: shopId });

      if (!categories.length) {
        return res
          .status(404)
          .send({ message: "No categories found for this shop" });
      }

      return res.status(200).send({
        message: "Categories retrieved successfully",
        categories,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message });
    }
  },
};

module.exports = CategoryController;
