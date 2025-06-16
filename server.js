// server.js - updated version with socket integration
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const express = require("express");
const dotenv = require("dotenv");
const https = require("https");
const http = require("http");
const cors = require("cors");
const fs = require("fs");
const app = express();
const admin = require("firebase-admin");
const serviceAccount = require("./serviceaccount.json");
const socketIo = require("socket.io");
const SocketService = require("./services/socketService");

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
  .connect("mongodb+srv://sohaibsipra869:f2NZIOoVGlnIkGCz@cluster0nimbus.pepam7x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0nimbus")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use(express.json({ limit: "50mb" }));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://nimbusbucket360.s3-website.eu-north-1.amazonaws.com"],
    credentials: true,
  })
);

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log("timezone: ", timezone);

app.get("/", (req, res) => {
  res.send("Welcome to the Warehouse Management System API");
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://nimbus360.org"],
    credentials: true,
  },
});

// Initialize Socket Service
const socketService = new SocketService(io);

// Make socketService available to routes
app.set("socketService", socketService);

// Routes
const authRoutes = require("./Routes/authRoutes");
const adminRoutes = require("./Routes/AdminRoutes/adminRoutes");
const managerRoutes = require("./Routes/managerRoutes");
const cashierRoutes = require("./Routes/cashierRoutes");
const categoryRoutes = require("./Routes/AdminRoutes/categoryRoutes");
const weatherRoutes = require("./Routes/weatherRoutes");
const inventoryRoutes = require("./Routes/inventoryRoutes");
const messageRoutes = require("./Routes/messageRoutes");
const predictiveRoutes = require("./Routes/predictiveRoutes");
const paymentRoutes = require("./Routes/paymentRoutes");
const customerJourneyRoutes = require("./Routes/customerJourneyRoutes");
const competitiveAnalysisRoutes = require("./Routes/competitiveAnalysisRoutes");

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/manager", managerRoutes);
app.use("/cashier", cashierRoutes);
app.use("/category", categoryRoutes);
app.use("/weather", weatherRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/messages", messageRoutes);
app.use("/analytics", predictiveRoutes);
app.use("/payment", paymentRoutes);
app.use("/customer-journey", customerJourneyRoutes);
app.use("/competitive-analysis", competitiveAnalysisRoutes);

const PORT = process.env.PORT || 3001;

// Use server.listen instead of app.listen
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} with Socket.IO enabled`);
});
  