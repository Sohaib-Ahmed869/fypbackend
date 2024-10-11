require("dotenv").config();
const jwt = require("jsonwebtoken");

const authMiddlewares = {
  verifyToken: (req, res, next) => {
    try {
      const token = req.cookies.token;
      if (!token) return res.status(403).send({ message: "No token provided" });

      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).send({ message: "Unauthorized" });
        req.id = decoded.id;
        req.role = decoded.role;

        if (decoded.shopId) req.shopId = decoded.shopId;
        if (decoded.shopName) req.shopName = decoded.shopName;
        if (decoded.branchId) req.branchId = decoded.branchId;
        if (decoded.branchName) req.branchName = decoded.branchName;

        next();
      });
    } catch (err) {
      console.log(err);
      return res.status(401).send({ message: err.message });
    }
  },

  // verifySuperAdmin: (req, res, next) => {
  //   if (req.role !== "superadmin")
  //     return res.status(403).send({ message: "Require Super Admin Role!" });
  //   next();
  // },

  verifyAdmin: (req, res, next) => {
    if (req.role !== "admin" && req.role !== "superadmin")
      return res.status(403).send({ message: "Require Admin Role!" });
    next();
  },

  verifyManager: (req, res, next) => {
    if (
      req.role !== "manager" &&
      req.role !== "admin" &&
      req.role !== "superadmin"
    )
      return res.status(403).send({ message: "Require Manager Role!" });
    next();
  },
};

module.exports = authMiddlewares;
