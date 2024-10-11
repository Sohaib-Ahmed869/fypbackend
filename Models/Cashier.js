const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const CashierSchema = new Schema({
  username: {
    type: String,
    required: true,   
  },
  password: {
    type: String,
    required: true,
  },
  branch_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  shop_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  joining_date: {
    type: Date,
    default: new Date(),
  },
  salary: {
    type: Number,
  },
  salary_due_date: {
    type: Date,
  },
  status: {
    type: String,
    default: "Active",
  },
});

CashierSchema.pre("save", async function (next) {
  const cashier = this;
  if (cashier.isModified("password")) {
    cashier.password = await bcrypt.hash(cashier.password, 8);
  }
  next();
});

CashierSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

CashierSchema.index(
  { shop_id: 1, branch_id: 1, username: 1 },
  { unique: true }
);

const Cashier = mongoose.model("Cashier", CashierSchema);
module.exports = Cashier;
