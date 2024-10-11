const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const express = require("express");
const dotenv = require("dotenv");
const https = require("https");
const cors = require("cors");
const fs = require("fs");
const app = express();
const admin = require("firebase-admin");
const serviceAccount = require("./serviceaccount.json");

app.use(cookieParser());
app.use(express.json());

dotenv.config();

app.use(express.urlencoded({ extended: true }));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://nimbus-system.appspot.com",
  });
  console.log("Firebase Admin Initialized");
} catch (err) {
  console.log("Firebase Admin Already Initialized");
}

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://hexlertech:ht_70707070@nimbuscluster.ud3bqgb.mongodb.net/?retryWrites=true&w=majority&appName=NimbusCluster")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use(express.json({ limit: "50mb" }));
app.use(
  cors({
    origin: ["http://localhost:3000", "https://nimbus360.org"],
    credentials: true,
  })
);

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log("timezone: ", timezone);

app.get("/", (req, res) => {
  res.send("Welcome to the Warehouse Management System API");
});

// Routes
const authRoutes = require("./Routes/authRoutes");
const adminRoutes = require("./Routes/adminRoutes");
const managerRoutes = require("./Routes/managerRoutes");
const cashierRoutes = require("./Routes/cashierRoutes");

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/manager", managerRoutes);
app.use("/cashier", cashierRoutes);

// // SSL options
// const options = {
//   key: fs.readFileSync('/etc/letsencrypt/live/nimbus360.org/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/nimbus360.org/fullchain.pem')
// };

const PORT = process.env.PORT || 3001;

// // Create HTTPS server
// https.createServer(options, app).listen(PORT, () => {
//   console.log(`HTTPS Server is running on port ${PORT}`);
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
