// Middlewares/socketMiddleware.js
const jwt = require("jsonwebtoken");

/**
 * Middleware to authenticate socket connections using JWT token
 * @param {Object} socket - Socket.IO socket object
 * @param {Function} next - Next function
 */
const socketAuth = (socket, next) => {
  // Get token from handshake query or headers
  const token =
    socket.handshake.auth.token || socket.handshake.headers.authorization;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    // Clean token if it comes with "Bearer "
    const cleanToken = token.replace("Bearer ", "");

    // Verify token
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);

    // Attach user data to socket
    socket.user = {
      id: decoded.id,
      role: decoded.role,
      shopId: decoded.shopId,
      shopName: decoded.shopName,
      branchId: decoded.branchId,
      branchName: decoded.branchName,
    };

    return next();
  } catch (error) {
    return next(new Error("Authentication error: Invalid token"));
  }
};

/**
 * Express middleware to add socket utilities to controllers
 */
const socketUtility = (req, res, next) => {
  const socketService = req.app.get("socketService");

  if (!socketService) {
    console.warn("Socket service not available");
    return next();
  }

  // Add socket utilities to the request object
  req.socket = {
    /**
     * Send a real-time notification to a specific user
     * @param {String} userId - ID of the user to notify
     * @param {String} userRole - Role of the user (admin, manager, cashier)
     * @param {Object} data - Notification data
     */
    notifyUser: (userId, userRole, data) => {
      const socketId = socketService.findRecipientSocketId(
        userRole,
        req.shopId,
        req.branchId
      );

      if (socketId) {
        socketService.io.to(socketId).emit("notification", {
          ...data,
          timestamp: new Date().toISOString(),
        });
        return true;
      }
      return false;
    },

    /**
     * Broadcast to all users in a branch
     * @param {String} branchId - Branch ID
     * @param {String} event - Event name
     * @param {Object} data - Event data
     */
    branchBroadcast: (branchId, event, data) => {
      socketService.io.to(`branch:${branchId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    },

    /**
     * Broadcast to all users in a shop
     * @param {String} shopId - Shop ID
     * @param {String} event - Event name
     * @param {Object} data - Event data
     */
    shopBroadcast: (shopId, event, data) => {
      socketService.io.to(`shop:${shopId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    },

    /**
     * Check if a user is online
     * @param {String} role - User role
     * @param {String} shopId - Shop ID
     * @param {String} branchId - Branch ID
     * @returns {Boolean} - Whether user is online
     */
    isUserOnline: (role, shopId, branchId) => {
      return socketService.isUserOnline(role, shopId, branchId);
    },

    /**
     * Get count of online users by shop
     * @param {String} shopId - Shop ID
     * @returns {Object} - Count of online users by role
     */
    getOnlineUsers: (shopId) => {
      return socketService.getConnectedUsersByShop(shopId);
    },
  };

  next();
};

module.exports = {
  socketAuth,
  socketUtility,
};
