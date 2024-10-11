const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SupplierSchema = new Schema({
  // save supplier branches and offer feature to supplier to gheir him aswell.
  branch_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
});

const Supplier = mongoose.model("Supplier", SupplierSchema);
module.exports = Supplier;
