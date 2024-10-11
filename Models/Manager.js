const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const ManagerSchema = new Schema({
  shop_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  branch_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Branch",
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
  },
  contact: {
    type: String,
  },
});

ManagerSchema.pre("save", async function (next) {
  const manager = this;
  if (manager.isModified("password")) {
    manager.password = await bcrypt.hash(manager.password, 8);
  }
  next();
});

ManagerSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

ManagerSchema.index({ shop_id: 1, branch_id: 1, username: 1 }, { unique: true });

const Manager = mongoose.model("Manager", ManagerSchema);
module.exports = Manager;