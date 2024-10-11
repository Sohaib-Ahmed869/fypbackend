const Shop = require("../Models/Shop");
const Branch = require("../Models/Branch");
const Cashier = require("../Models/Cashier");
const Product = require("../Models/Product");
const Category = require("../Models/Category");
const Order = require("../Models/Order");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const admin = require("firebase-admin");
const { getProducts } = require("./cashierController");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const managerController = {
  getBranch: async (req, res) => {
    try {
      var shopId = req.shopId;
      if (!shopId) {
        shopId = req.params.shopId;
      }
      if (!shopId) {
        return res.status(400).send({ message: "Please provide shop name" });
      }

      var branchId = req.branchId;
      if (!branchId) {
        branchId = req.params.branchId;
      }
      if (!branchId) {
        return res.status(400).send({ message: "Please provide branch name" });
      }

      const shop = await Shop.findOne({ _id: shopId });

      if (!shop) {
        return res.status(404).send({ message: "Shop not found" });
      }

      const branch = await Branch.findOne({
        shop_id: shopId,
        _id: branchId,
      });

      if (!branch) {
        return res.status(404).send({ message: "Branch not found" });
      }

      res.status(200).send(branch);
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  getSales: async (req, res) => {
    try {
      const { shopId, branchId } = req;
      if (!shopId || !branchId) {
        return res.status(400).send({ message: "Please provide ids" });
      }

      const { startDate, endDate } = req.query;

      const branch = await Branch.findOne({
        shop_id: shopId,
        _id: branchId,
      });

      if (!branch) {
        return res.status(404).send({ message: "Branch not found" });
      }

      let sales = 0;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        sales = branch.sales.filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate >= start && saleDate <= end;
        });
      } else {
        sales = branch.sales;
      }

      res.status(200).send({ sales });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  },

  addCashier: async (req, res) => {
    try {
      const { shopId, branchId } = req;
      if (!shopId || !branchId) {
        return res.status(400).send({ message: "Please provide ids" });
      }

      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Please fill in all fields" });
      }

      const branch = await Branch.findOne({
        shop_id: shopId,
        _id: branchId,
      });
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      const cashier = new Cashier({
        shop_id: shopId,
        branch_id: branch._id,
        username,
        password,
      });
      await cashier.save();

      res
        .status(201)
        .json({ message: "Cashier created successfully", cashier });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  getCashiers: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "Please provide shop name" });
      }

      const branchId = req.branchId;
      const branchName = req.branchName;
      if (!branchId || !branchName) {
        return res.status(400).json({ message: "Please provide branch name" });
      }

      const cashiers = await Cashier.find({
        shop_id: shopId,
        branch_id: branchId,
      });

      res.status(200).json({ cashiers, branchName });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  addProduct: [
    upload.single("image"),
    async (req, res) => {
      try {
        const shopId = req.shopId;
        if (!shopId) {
          return res.status(400).json({ message: "Please provide shop name" });
        }

        console.log("body", req.body);
        console.log("file", req.file);

        const { name, description, price, category } = req.body;
        const image = req.file;

        if (!name || !description || !price || !category) {
          return res.status(400).json({ message: "Please fill in all fields" });
        }

        if (!image) {
          return res.status(400).json({ message: "Please upload an image" });
        }

        const bucket = admin.storage().bucket();
        const uuid = uuidv4();
        const file = bucket.file(`products/${uuid}`);

        await file.save(image.buffer, {
          metadata: {
            contentType: image.mimetype,
            firebaseStorageDownloadTokens: uuid,
          },
        });

        const prodExists = await Product.findOne({
          shop_id: shopId,
          name,
        });
        if (prodExists) {
          return res.status(400).json({ message: "Product already exists" });
        }

        const cat = await Category.findOne({
          shop_id: shopId,
          category_name: category,
        });
        if (!cat) {
          return res.status(404).json({ message: "Category not found" });
        }

        const product = new Product({
          shop_id: shopId,
          name,
          description,
          image: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/products%2F${uuid}?alt=media&token=${uuid}`,
          price,
          category: cat._id,
        });
        await product.save();

        res.status(201).json({ message: "Product created successfully" });
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
      }
    },
  ],

  getProducts: async (req, res) => {
    try {
      const { shopId } = req;
      if (!shopId) {
        return res.status(400).send({ message: "Please provide ids" });
      }

      const products = await Product.find({
        shop_id: shopId,
        status: true,
      }).populate({
        path: "category",
        select: "category_name",
      });

      res.status(200).json({ products });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  getCategories: async (req, res) => {
    try {
      const shopId = req.shopId;
      if (!shopId) {
        return res.status(400).json({ message: "Please provide shop name" });
      }

      const categories = await Category.find({ shop_id: shopId, status: true });
      res.status(200).json(categories);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  updateBranchTimings: async (req, res) => {
    try {
      const { shopId, branchId } = req;
      if (!shopId || !branchId) {
        return res.status(400).send({ message: "Please provide ids" });
      }

      const { branchGot } = req.body;

      const { opening_time, closing_time } = branchGot;
      if (!opening_time || !closing_time) {
        return res.status(400).send({ message: "Please provide timings" });
      }

      const branch = await Branch.findOne({
        shop_id: shopId,
        _id: branchId,
      });
      if (!branch) {
        return res.status(404).send({ message: "Branch not found" });
      }

      branch.opening_time = opening_time;
      branch.closing_time = closing_time;
      await branch.save();

      res.status(200).send({ message: "Timings updated successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  openBranch: async (req, res) => {
    try {
      const { shopId, branchId } = req;
      if (!shopId || !branchId) {
        return res.status(400).send({ message: "Please provide ids" });
      }

      const branch = await Branch.findOne({
        shop_id: shopId,
        _id: branchId,
      });
      if (!branch) {
        return res.status(404).send({ message: "Branch not found" });
      }

      branch.shift_status = true;
      branch.day_number = branch.day_number + 1;

      await branch.save();

      res.status(200).send({ message: "Branch opened successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  closeBranch: async (req, res) => {
    try {
      const { shopId, branchId } = req;
      if (!shopId || !branchId) {
        return res.status(400).send({ message: "Please provide ids" });
      }

      const branch = await Branch.findOne({
        shop_id: shopId,
        _id: branchId,
      });
      if (!branch) {
        return res.status(404).send({ message: "Branch not found" });
      }

      branch.shift_status = false;

      await branch.save();

      res.status(200).send({ message: "Branch closed successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  updateCashOnHand: async (req, res) => {
    try {
      const { shopId, branchId } = req;
      if (!shopId || !branchId) {
        return res.status(400).send({ message: "Please provide ids" });
      }

      const { cash_on_hand } = req.body;
      if (!cash_on_hand) {
        return res.status(400).send({ message: "Please provide cash on hand" });
      }

      const branch = await Branch.findOne({
        shop_id: shopId,
        _id: branchId,
      });
      if (!branch) {
        return res.status(404).send({ message: "Branch not found" });
      }

      branch.cash_on_hand = cash_on_hand;
      await branch.save();

      res.status(200).send({ message: "Cash on hand updated successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  getBranchOrders: async (req, res) => {
    try {
      const { shopId, branchId } = req;
      if (!shopId || !branchId) {
        return res.status(400).send({ message: "Please provide ids" });
      }

      const branch = await Branch.findOne({
        shop_id: shopId,
        _id: branchId,
      });
      if (!branch) {
        return res.status(404).send({ message: "Branch not found" });
      }

      const orders = await Order.find({
        shop_id: shopId,
        branch_id: branchId,
      }).sort({ _id: -1 });

      res.status(200).send({ orders });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },

  updateTax: async (req, res) => {
    try {
      const { shopId, branchId } = req;
      if (!shopId || !branchId) {
        return res.status(400).send({ message: "Please provide ids" });
      }

      const { cardTax, cashTax } = req.body;
      if (!cardTax && !cashTax) {
        return res.status(400).send({ message: "Please provide tax" });
      }

      const branch = await Branch.findOne({
        shop_id: shopId,
        _id: branchId,
      });
      if (!branch) {
        return res.status(404).send({ message: "Branch not found" });
      }

      if (cardTax !== undefined && cardTax !== null) {
        branch.card_tax = cardTax;
      }
      if (cashTax !== undefined && cashTax !== null) {
        branch.cash_tax = cashTax;
      }

      await branch.save();

      res.status(200).send({ message: "Tax updated successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },
};

module.exports = managerController;
