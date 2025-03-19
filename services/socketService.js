// services/socketService.js
const connectedUsers = {
  admins: {},
  managers: {},
  cashiers: {},
};

class SocketService {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);

      // Event handlers
      this.handleRegistration(socket);
      this.handleMessaging(socket);
      this.handleNotifications(socket);
      this.handleDisconnect(socket);
    });
  }

  handleRegistration(socket) {
    socket.on("register", (userData) => {
      const { userId, role, shopId, branchId } = userData;

      this.registerUser(socket.id, role, userId, shopId, branchId);

      // Let the user know they're connected
      socket.emit("registered", { success: true, role });
      console.log(
        `User registered: ${role}, Shop: ${shopId}, Branch: ${
          branchId || "N/A"
        }`
      );
    });
  }

  registerUser(socketId, role, userId, shopId, branchId) {
    // Store connection based on role
    if (role === "admin") {
      connectedUsers.admins[shopId] = socketId;
      this.io.sockets.sockets.get(socketId).join(`shop:${shopId}`);
    } else if (role === "manager") {
      if (!connectedUsers.managers[shopId]) {
        connectedUsers.managers[shopId] = {};
      }
      connectedUsers.managers[shopId][branchId] = socketId;
      this.io.sockets.sockets.get(socketId).join(`shop:${shopId}`);
      this.io.sockets.sockets.get(socketId).join(`branch:${branchId}`);
    } else if (role === "cashier") {
      if (!connectedUsers.cashiers[shopId]) {
        connectedUsers.cashiers[shopId] = {};
      }
      connectedUsers.cashiers[shopId][branchId] = socketId;
      this.io.sockets.sockets.get(socketId).join(`shop:${shopId}`);
      this.io.sockets.sockets.get(socketId).join(`branch:${branchId}`);
    }
  }

  handleMessaging(socket) {
    // Private messaging
    socket.on("private-message", (messageData) => {
      const { to, message, shopId, branchId, senderInfo } = messageData;

      // Find recipient
      const recipientSocketId = this.findRecipientSocketId(
        to.role,
        shopId,
        branchId
      );

      if (recipientSocketId) {
        this.io.to(recipientSocketId).emit("private-message", {
          message,
          sender: senderInfo,
          timestamp: new Date().toISOString(),
        });

        // Acknowledge successful message delivery
        socket.emit("message-status", {
          success: true,
          messageId: messageData.messageId,
        });
      } else {
        // Store message for later delivery or notify sender of failure
        socket.emit("message-status", {
          success: false,
          error: "Recipient is offline",
          messageId: messageData.messageId,
        });
      }
    });

    // Branch broadcast
    socket.on("branch-message", (messageData) => {
      const { branchId, message, senderInfo } = messageData;
      socket.to(`branch:${branchId}`).emit("branch-message", {
        message,
        sender: senderInfo,
        timestamp: new Date().toISOString(),
      });
    });

    // Shop broadcast
    socket.on("shop-message", (messageData) => {
      const { shopId, message, senderInfo } = messageData;
      socket.to(`shop:${shopId}`).emit("shop-message", {
        message,
        sender: senderInfo,
        timestamp: new Date().toISOString(),
      });
    });
  }

  findRecipientSocketId(role, shopId, branchId) {
    if (role === "admin" && connectedUsers.admins[shopId]) {
      return connectedUsers.admins[shopId];
    } else if (
      role === "manager" &&
      connectedUsers.managers[shopId]?.[branchId]
    ) {
      return connectedUsers.managers[shopId][branchId];
    } else if (
      role === "cashier" &&
      connectedUsers.cashiers[shopId]?.[branchId]
    ) {
      return connectedUsers.cashiers[shopId][branchId];
    }
    return null;
  }

  handleNotifications(socket) {
    // Order status notifications
    socket.on("order-status-change", (data) => {
      const { orderId, status, shopId, branchId } = data;

      // Notify branch staff
      this.io.to(`branch:${branchId}`).emit("order-notification", {
        orderId,
        status,
        timestamp: new Date().toISOString(),
      });
    });

    // Inventory alerts
    socket.on("inventory-alert", (data) => {
      const { shopId, branchId, ingredient, quantity } = data;

      // Alert branch
      this.io.to(`branch:${branchId}`).emit("inventory-notification", {
        ingredient,
        quantity,
        threshold: data.threshold,
        timestamp: new Date().toISOString(),
      });

      // Alert shop admin
      if (connectedUsers.admins[shopId]) {
        this.io
          .to(connectedUsers.admins[shopId])
          .emit("inventory-notification", {
            branchId,
            ingredient,
            quantity,
            threshold: data.threshold,
            timestamp: new Date().toISOString(),
          });
      }
    });

    // Emergency alerts (high priority)
    socket.on("emergency-alert", (data) => {
      const { shopId, branchId, message, severity } = data;

      // Broadcast to everyone in the shop
      this.io.to(`shop:${shopId}`).emit("emergency-notification", {
        branchId,
        message,
        severity,
        timestamp: new Date().toISOString(),
      });
    });
  }

  handleDisconnect(socket) {
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      this.removeDisconnectedUser(socket.id);
    });
  }

  removeDisconnectedUser(socketId) {
    // Remove from admins
    Object.keys(connectedUsers.admins).forEach((shopId) => {
      if (connectedUsers.admins[shopId] === socketId) {
        delete connectedUsers.admins[shopId];
      }
    });

    // Remove from managers
    Object.keys(connectedUsers.managers).forEach((shopId) => {
      if (connectedUsers.managers[shopId]) {
        Object.keys(connectedUsers.managers[shopId]).forEach((branchId) => {
          if (connectedUsers.managers[shopId][branchId] === socketId) {
            delete connectedUsers.managers[shopId][branchId];
          }
        });
      }
    });

    // Remove from cashiers
    Object.keys(connectedUsers.cashiers).forEach((shopId) => {
      if (connectedUsers.cashiers[shopId]) {
        Object.keys(connectedUsers.cashiers[shopId]).forEach((branchId) => {
          if (connectedUsers.cashiers[shopId][branchId] === socketId) {
            delete connectedUsers.cashiers[shopId][branchId];
          }
        });
      }
    });
  }

  // Additional utility methods
  getConnectedUsersByShop(shopId) {
    const result = {
      admins: connectedUsers.admins[shopId] ? 1 : 0,
      managers: 0,
      cashiers: 0,
    };

    if (connectedUsers.managers[shopId]) {
      result.managers = Object.keys(connectedUsers.managers[shopId]).length;
    }

    if (connectedUsers.cashiers[shopId]) {
      result.cashiers = Object.keys(connectedUsers.cashiers[shopId]).length;
    }

    return result;
  }

  isUserOnline(role, shopId, branchId = null) {
    if (role === "admin") {
      return !!connectedUsers.admins[shopId];
    } else if (role === "manager" && branchId) {
      return !!connectedUsers.managers[shopId]?.[branchId];
    } else if (role === "cashier" && branchId) {
      return !!connectedUsers.cashiers[shopId]?.[branchId];
    }
    return false;
  }
}

module.exports = SocketService;
