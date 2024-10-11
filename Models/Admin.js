// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");
// const Schema = mongoose.Schema;

// const AdminSchema = new Schema({
//   username: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
// });

// AdminSchema.pre("save", async function (next) {
//   const admin = this;
//   if (admin.isModified("password")) {
//     admin.password = await bcrypt.hash(admin.password, 8);
//   }
//   next();
// });

// AdminSchema.methods.comparePassword = async function (password) {
//   return await bcrypt.compare(password, this.password);
// };

// const Admin = mongoose.model("Admin", AdminSchema);

// module.exports = Admin;
