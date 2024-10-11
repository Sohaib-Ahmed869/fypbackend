const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ShiftSchema = new Schema({
  branch_id: {
    type: Schema.Types.ObjectId,
    unique: true,
    required: true,
  },
  day_number: {
    type: Number,
    required: true,
  },
  opening_time: {
    type: String,
    required: true,
  },
  closing_time: {
    type: String,
    required: true,
  },
  cash_starting: {
    type: Number,
    required: true,
  },
  cash_ending: {
    type: Number,
    required: true,
  },
});

const Shift = mongoose.model("Shift", ShiftSchema);
module.exports = Shift;