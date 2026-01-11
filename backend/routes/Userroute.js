const express = require("express");
const { User } = require("../models/User");
const Userrouter = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Deposit = require("../models/Deposit");
const Withdrawal = require("../models/Withdrawal");
const mongoose = require("mongoose");
const axios = require("axios");

const qs = require("qs");
// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || "fsdfsdfsd43534";
// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user and attach to request
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        success: false,
        message: "Token expired",
      });
    }

    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// -------- USER INFORMATION ROUTES --------
Userrouter.get("/all-information/:id", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById({ _id: req.params.id });
    if (!user) {
      return res.send({ success: false, message: "User did not find!" });
    }
    res.send({ success: true, data: user });
  } catch (error) {
    console.error("User information error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
// Get user information
Userrouter.get("/my-information", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    res.send({
      success: true,
      message: "User found successfully",
      data: {
        id: user._id,
        player_id: user.player_id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        currency: user.currency,
        balance: user.balance,
        bonusBalance: user.bonusBalance,
        first_login: user.first_login,
        login_count: user.login_count,
        last_login: user.last_login,
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        kycStatus: user.kycStatus,
      },
    });
  } catch (error) {
    console.error("User information error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update personal information
Userrouter.put("/update-personal-info", authenticateToken, async (req, res) => {
  try {
    const { fullName, dateOfBirth, phone } = req.body;
    const user = req.user;

    // Update fields if provided
    if (fullName !== undefined) user.fullName = fullName;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.send({
      success: true,
      message: "Personal information updated successfully",
      data: {
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Update personal info error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// -------- PASSWORD & SECURITY ROUTES --------

// Change password
Userrouter.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Check if new password is the same as current
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.send({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Set/update transaction password
Userrouter.post(
  "/set-transaction-password",
  authenticateToken,
  async (req, res) => {
    try {
      const { transactionPassword } = req.body;
      const user = await User.findById(req.user._id);

      user.transactionPassword = transactionPassword;
      await user.save();

      res.send({
        success: true,
        message: "Transaction password set successfully",
      });
    } catch (error) {
      console.error("Set transaction password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// -------- VERIFICATION ROUTES --------

// Request email verification
Userrouter.post(
  "/request-email-verification",
  authenticateToken,
  async (req, res) => {
    try {
      const user = req.user;

      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
        });
      }

      // Generate OTP (in a real app, you would send this via email)
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      user.otp = {
        code: otpCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        purpose: "email_verification",
        verified: false,
      };

      await user.save();

      // In a real app, you would send the OTP via email here
      console.log(`Email verification OTP for ${user.email}: ${otpCode}`);

      res.send({
        success: true,
        message: "Verification email sent",
      });
    } catch (error) {
      console.error("Request email verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Verify email with OTP
Userrouter.post("/verify-email", authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    if (!user.otp || user.otp.purpose !== "email_verification") {
      return res.status(400).json({
        success: false,
        message: "No verification request found",
      });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.isEmailVerified = true;
    user.otp.verified = true;
    await user.save();

    res.send({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Request phone verification
Userrouter.post(
  "/request-phone-verification",
  authenticateToken,
  async (req, res) => {
    try {
      const user = req.user;

      if (!user.phone) {
        return res.status(400).json({
          success: false,
          message: "Phone number not set",
        });
      }

      if (user.isPhoneVerified) {
        return res.status(400).json({
          success: false,
          message: "Phone is already verified",
        });
      }

      // Generate OTP (in a real app, you would send this via SMS)
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      user.otp = {
        code: otpCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        purpose: "phone_verification",
        verified: false,
      };

      await user.save();

      // In a real app, you would send the OTP via SMS here
      console.log(`Phone verification OTP for ${user.phone}: ${otpCode}`);

      res.send({
        success: true,
        message: "Verification SMS sent",
      });
    } catch (error) {
      console.error("Request phone verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Verify phone with OTP
Userrouter.post("/verify-phone", authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    if (user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: "Phone is already verified",
      });
    }

    if (!user.otp || user.otp.purpose !== "phone_verification") {
      return res.status(400).json({
        success: false,
        message: "No verification request found",
      });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.isPhoneVerified = true;
    user.otp.verified = true;
    await user.save();

    res.send({
      success: true,
      message: "Phone verified successfully",
    });
  } catch (error) {
    console.error("Verify phone error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get verification status
Userrouter.get("/verification-status", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    res.send({
      success: true,
      data: {
        email: user.isEmailVerified ? "verified" : "pending",
        phone: user.isPhoneVerified ? "verified" : "pending",
        identity: user.kycStatus,
        address: "not_started", // You might want to add address verification to your model
      },
    });
  } catch (error) {
    console.error("Get verification status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// -------- SECURITY SETTINGS ROUTES --------

// Enable/disable two-factor authentication
Userrouter.post("/toggle-2fa", authenticateToken, async (req, res) => {
  try {
    const { enable } = req.body;
    const user = req.user;

    user.twoFactorEnabled = enable;
    await user.save();

    res.send({
      success: true,
      message: `Two-factor authentication ${enable ? "enabled" : "disabled"}`,
    });
  } catch (error) {
    console.error("Toggle 2FA error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get active sessions
Userrouter.get("/active-sessions", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Return limited session information
    const sessions = user.loginHistory.slice(-5).map((session) => ({
      device: session.device,
      location: session.location,
      timestamp: session.timestamp,
    }));

    res.send({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Get active sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// -------- PREFERENCES ROUTES --------
// Update notification preferences
Userrouter.put(
  "/notification-preferences",
  authenticateToken,
  async (req, res) => {
    try {
      const { email, sms, push } = req.body;
      const user = req.user;

      if (email !== undefined) user.notificationPreferences.email = email;
      if (sms !== undefined) user.notificationPreferences.sms = sms;
      if (push !== undefined) user.notificationPreferences.push = push;

      await user.save();

      res.send({
        success: true,
        message: "Notification preferences updated",
        data: user.notificationPreferences,
      });
    } catch (error) {
      console.error("Update notification preferences error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Update theme preference
Userrouter.put("/theme-preference", authenticateToken, async (req, res) => {
  try {
    const { theme } = req.body;
    const user = req.user;

    if (theme && ["light", "dark", "system"].includes(theme)) {
      user.themePreference = theme;
      await user.save();

      res.send({
        success: true,
        message: "Theme preference updated",
        data: { themePreference: user.themePreference },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid theme preference",
      });
    }
  } catch (error) {
    console.error("Update theme preference error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
Userrouter.post("/play-game", async (req, res) => {
  try {
    const { slug, username, money, userid } = req.body;
    console.log(req.body);
    const postData = {
      home_url: "https://bajibet24.live",
      token: "f9d21d76de9f32f16d7e189bf0b729a7",
      username: username + "45",
      money: money,
      gameid: req.body.gameID,
    };
    console.log("Sending POST request to joyhobe.com with data:", postData);

    // POST রিকোয়েস্ট
    const response = await axios.post(
      "https://dstplay.net/getgameurl",
      qs.stringify(postData),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-dst-game": "f9d21d76de9f32f16d7e189bf0b729a7",
        },
      }
    );

    console.log(
      "Response from bajibet24.com:",
      response.data,
      "Status:",
      response.status
    );
    res.status(200).json({
      message: "POST request successful",
      joyhobeResponse: response.data,
    });
  } catch (error) {
    console.error("Error in POST /api/test/game:", error);
    res.status(500).json({
      error: "Failed to forward POST request",
      details: error.message,
    });
  }
});

// Deposit route
Userrouter.post("/deposit", authenticateToken, async (req, res) => {
  try {
    const { 
      method, 
      phoneNumber, 
      amount, 
      transactionId,
      bonusType = 'none',
      bonusAmount = 0,
      wageringRequirement = 0,
      bonusCode = '',
      paymentId,
      externalPaymentId,
      userIdentifyAddress,
      paymentUrl,
      playerbalance,
      expiresAt,
      externalMethods,
      currency = 'BDT',
      rate = 1,
      charge = { fixed: 0, percent: 0 }
    } = req.body;
    
    const userId = req.user._id;
    console.log("Deposit request:", req.body);

    // Validate input
    if (!method || !amount) {
      return res.status(400).json({
        success: false,
        message: "Method and amount are required",
      });
    }

    // Validate amount
    if (amount < 100 || amount > 30000) {
      return res.status(400).json({
        success: false,
        message: "Amount must be between 100 and 30,000 BDT",
      });
    }

    // Create transaction record with all fields
    const transaction = new Deposit({
      userId,
      type: "deposit",
      method,
      amount: parseFloat(amount),
      phoneNumber,
      transactionId,
      bonusType,
      bonusAmount: parseFloat(bonusAmount) || 0,
      wageringRequirement: parseFloat(wageringRequirement) || 0,
      bonusCode,
      paymentId,
      externalPaymentId,
      userIdentifyAddress,
      paymentUrl,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      externalMethods,
      currency,
      rate: parseFloat(rate) || 1,
      charge,
      playerbalance,
      status: "pending",
      description: `Deposit via ${method}${bonusAmount > 0 ? ` with ${bonusType} bonus` : ''}`,
    });

    await transaction.save();

    // Update user's deposit history with all bonus info
    const depositRecord = {
      method,
      amount: parseFloat(amount),
      status: "pending",
      transactionId,
      bonusApplied: bonusAmount > 0,
      bonusType,
      bonusAmount: parseFloat(bonusAmount) || 0,
      wageringRequirement: parseFloat(wageringRequirement) || 0,
      bonusCode,
      paymentId,
      playerbalance,
      externalPaymentId,
      userIdentifyAddress,
      paymentUrl,
      currency,
      rate: parseFloat(rate) || 1,
      charge,
      createdAt: new Date()
    };

    await User.findByIdAndUpdate(userId, {
      $push: {
        depositHistory: depositRecord,
      },
    });

    // If bonus is applied, add to bonusActivityLogs with pending status
    if (bonusAmount > 0 && bonusCode) {
      await User.findByIdAndUpdate(userId, {
        $push: {
          bonusActivityLogs: {
            bonusType: bonusType,
            bonusCode: bonusCode,
            bonusAmount: parseFloat(bonusAmount) || 0,
            depositAmount: parseFloat(amount),
            wageringRequirement: parseFloat(wageringRequirement) || 0,
            status: "pending",
            createdAt: new Date()
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Deposit request received and is being processed",
      data: {
        transactionId: transaction._id,
        paymentId: transaction.paymentId,
        amount: parseFloat(amount),
        bonusAmount: parseFloat(bonusAmount) || 0,
        wageringRequirement: parseFloat(wageringRequirement) || 0,
        totalAmount: parseFloat(amount) + (parseFloat(bonusAmount) || 0),
        method,
        bonusType,
        bonusCode,
        status: "pending",
        depositRecord: depositRecord
      },
    });
  } catch (error) {
    console.error("Deposit error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Get transaction history
Userrouter.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, type } = req.query;

    const query = { userId };
    if (type) {
      query.type = type;
    }

    const transactions = await Deposit.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Deposit.countDocuments(query);
    console.log(transactions);
    res.json({
      success: true,
      data: transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Transaction history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
// Withdrawal route
Userrouter.post("/withdraw", authenticateToken, async (req, res) => {
  try {
    const { method, accountNumber, amount } = req.body;
    const userId = req.user._id;
   console.log(req.body)
    // Check user balance
    if (amount > req.user.balance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    // Create withdrawal record
    const withdrawal = new Withdrawal({
      userId,
      method,
      phoneNumber:accountNumber,
      amount,
      status: "pending",
    });

    await withdrawal.save();

    // Update user balance
    await User.findByIdAndUpdate(userId, {
      $inc: { balance: -amount },
      $push: {
        withdrawalHistory: {
          method,
          amount,
          date: new Date(),
          status: "pending",
          phoneNumber:accountNumber,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      data: {
        withdrawalId: withdrawal._id,
        amount,
        method,
      },
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get withdrawal history
Userrouter.get(
  "/withdraw/history/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Verify the user is requesting their own history
      if (req.user._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const withdrawals = await Withdrawal.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Withdrawal.countDocuments({ userId });

      res.json({
        success: true,
        data: withdrawals,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error("Withdrawal history error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);
const Notification = require("../models/Notification"); // Add this at the top with other imports
const BettingHistory = require("../models/BettingHistory");
const Affiliate = require("../models/Affiliate");
const MasterAffiliate = require("../models/MasterAffiliate");
const Game = require("../models/Game");

// -------- NOTIFICATION ROUTES --------

// Get user notifications
Userrouter.get(
  "/notifications/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const { limit = 20, page = 1, unreadOnly = false } = req.query;
      const userId = req.params.userId;
      const userRole = req.user.role || "user";
      console.log(userId);
      // Convert query params to proper types
      const options = {
        limit: parseInt(limit),
        page: parseInt(page),
        unreadOnly: unreadOnly === "true",
      };

      // Convert userId to ObjectId safely
      let userObjectId;
      try {
        userObjectId = new mongoose.Types.ObjectId(userId);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
        });
      }

      // Build the query for notifications accessible to this user
      const query = {
        $or: [
          { targetType: "all" },
          { targetType: "specific", targetUsers: { $in: [userObjectId] } },
          { targetType: "role_based", userRoles: userRole },
        ],
        status: "sent",
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } },
        ],
        scheduledFor: { $lte: new Date() },
      };

      // Add unread filter if requested
      if (options.unreadOnly) {
        query["isRead.userId"] = { $ne: userObjectId };
      }

      // Execute the query with pagination
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean();

      // Get total count for pagination
      const totalCount = await Notification.countDocuments(query);

      // Format the response with read status for each notification
      const formattedNotifications = notifications.map((notification) => ({
        ...notification,
        isRead: notification.isRead.some(
          (read) => read.userId && read.userId.toString() === userId
        ),
      }));
      console.log(formattedNotifications);
      res.send({
        success: true,
        message: "Notifications retrieved successfully",
        data: {
          notifications: formattedNotifications,
          pagination: {
            page: options.page,
            limit: options.limit,
            total: totalCount,
            pages: Math.ceil(totalCount / options.limit),
          },
        },
      });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);
// Mark notification as read
Userrouter.post(
  "/notifications/:id/read",
  authenticateToken,
  async (req, res) => {
    try {
      const notificationId = req.params.id;
      const userId = req.user.userId;

      const notification = await Notification.findById(notificationId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      // Check if user has access to this notification
      const hasAccess =
        notification.targetType === "all" ||
        (notification.targetType === "specific" &&
          notification.targetUsers.includes(userId)) ||
        (notification.targetType === "role_based" &&
          notification.userRoles.includes(req.user.role));

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access to this notification denied",
        });
      }

      await notification.markAsRead(userId);

      res.send({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Mark all notifications as read
Userrouter.post(
  "/notifications/read-all",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role || "user";

      // Get all unread notifications for the user
      const query = {
        $or: [
          { targetType: "all" },
          { targetType: "specific", targetUsers: userId },
          { targetType: "role_based", userRoles: userRole },
        ],
        status: "sent",
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } },
        ],
        scheduledFor: { $lte: new Date() },
        "isRead.userId": { $ne: userId },
      };

      const unreadNotifications = await Notification.find(query);

      // Mark each notification as read
      for (const notification of unreadNotifications) {
        await notification.markAsRead(userId);
      }

      res.send({
        success: true,
        message: "All notifications marked as read",
        count: unreadNotifications.length,
      });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Get unread notifications count
// Get unread notifications count
Userrouter.get(
  "/notifications/unread-count",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId; // Changed from req.user.id to req.user._id
      const userRole = req.user.role || "user";
      console.log("fdf", userId);
      // Convert userId to ObjectId safely

      const query = {
        $or: [
          { targetType: "all" },
          { targetType: "specific", targetUsers: { $in: [userId] } }, // Use ObjectId
        ],
        status: "sent",
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } },
        ],
        scheduledFor: { $lte: new Date() },
        "isRead.userId": { $ne: userId }, // Use ObjectId
      };

      const count = await Notification.countDocuments(query);

      res.send({
        success: true,
        data: { count },
      });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Add this route to your existing Userrouter

// Get all transactions (deposits + withdrawals) for a user
Userrouter.get("/all-transactions", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 10,
      type,
      status,
      startDate,
      endDate,
    } = req.query;

    // Build base query
    const baseQuery = { userId };

    // Add type filter if provided
    if (type && ["deposit", "withdrawal"].includes(type)) {
      baseQuery.type = type;
    }

    // Add status filter if provided
    if (status) {
      baseQuery.status = status;
    }

    // Add date range filter if provided
    let dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    if (startDate || endDate) {
      baseQuery.createdAt = dateFilter;
    }

    // Get deposits with filters
    const deposits = await Deposit.find(baseQuery)
      .sort({ createdAt: -1 })
      .lean();

    // For withdrawals, we need to adjust the query since they have different schema
    const withdrawalQuery = { userId };

    // Copy filters that apply to both
    if (status) withdrawalQuery.status = status;
    if (startDate || endDate) withdrawalQuery.createdAt = dateFilter;

    const withdrawals = await Withdrawal.find(withdrawalQuery)
      .sort({ createdAt: -1 })
      .lean();

    // Transform withdrawals to match deposit format for consistency
    const transformedWithdrawals = withdrawals.map((withdrawal) => ({
      _id: withdrawal._id,
      userId: withdrawal.userId,
      type: "withdrawal",
      method: withdrawal.method,
      amount: withdrawal.amount,
      status: withdrawal.status,
      phoneNumber: withdrawal.phoneNumber,
      transactionId: withdrawal.transactionId,
      description: `Withdrawal via ${withdrawal.method}`,
      createdAt: withdrawal.createdAt,
      updatedAt: withdrawal.updatedAt,
      processedAt: withdrawal.processedAt,
    }));

    // Combine and sort all transactions
    const allTransactions = [...deposits, ...transformedWithdrawals].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedTransactions,
      total: allTransactions.length,
      totalPages: Math.ceil(allTransactions.length / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("All transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}); 

// ?  get the game  old code
  Userrouter.post("/getGameLink", async (req, res) => {
    try {
      const { username, money, gameID } = req.body;

      console.log("this is body ", req.body);

      
    // this is for 1xwin
      const postData = {
        home_url: "https://bajiman.com",
        token: "20a1822b54f68e9e3a92fc5a8516fe0a",
        username: username + "45",
        money: money,
        gameid: req.body.gameID,
      };

      // ? for game bajibos.com
      // const postData = {
      //   home_url: "https://bajibos.com",
      //   token: "62dd4c99767302be8969ffcf7bc8e4c2",
      //   username: username + "45",
      //   money: money,
      //   gameid: req.body.gameID,
      // };

      // ? for game baji
      // const postData = {
      //   home_url: "https://gamebaji71.com",
      //   token: "99a6ebbc83c0e30c9a0c5237f3d907bd",
      //   username: username + "45",
      //   money: money,
      //   gameid: req.body.gameID,
      // };

      // ? for trickboy.xyz
      // const postData = {
      //   home_url: "https://trickboy.xyz",
      //   token: "bf5891d45c356824ba6df15c9c15575d",
      //   username: username + "45",
      //   money: money,
      //   gameid: req.body.gameID,
      // };

      // ? for game baji444
      // const postData = {
      //   home_url: "https://baji444.online",
      //   token: "a19a058e5c9ee29a23c1300866271928",
      //   username: username + "45",
      //   money: money,
      //   gameid: req.body.gameID,
      // };

      // ? for trickboy.xyz
      // const postData = {
      //   home_url: "https://trickboy.xyz",
      //   token: "bf5891d45c356824ba6df15c9c15575d",
      //   username: username+"45",
      //   money: money,
      //   gameid: req.body.gameID
      // };

      // ? for melbet99
      // const postData = {
      //   home_url: "https://melbet99.com",
      //   token: "ab315e58c891ce8f875652af5d4e45c1",
      //   username: username+"45",
      //   money: money,
      //   gameid: req.body.gameID
      // };

      // ? for  lclb.net
      // const postData = {
      //   home_url: "https://lclb.net",
      //   token: "b18e2542823e4df498ce17e8eb2d1c49",
      //   username: username+"45",
      //   money: money,
      //   gameid: req.body.gameID
      // };

      // // ? for  lclb.net
      // const postData = {
      //   home_url: "https://jstlive.net",
      //   token: "c7fae069ce61bcd3bda9a8dfe330a83a",
      //   username: username+"45",
      //   money: money,
      //   gameid: req.body.gameID
      // };

      console.log("this is log ");

      // ? for  babu666.live
      // const postData = {
      //   home_url: "https://babu666.live",
      //   token: "25034d2094f6312bd0e49f713efb5e45",
      //   username: username + "45",
      //   money: money,
      //   gameid: req.body.gameID,
      // };


     
      // ? for  malta99.com
      // https://api.malta99.com/games/callback-data-game
      // const postData = {
      //   home_url: "https://malta99.com",
      //   token: "846fd1fb8e07fa445eae69ddaa633db4",
      //   username: username + "45",
      //   money: money,
      //   gameid: req.body.gameID,
      // };

      // x-dstgame-key
      // 'x-dstgame-key: yourlicensekey'

      console.log("Sending POST request to joyhobe.com with data:", postData);

      // POST রিকোয়েস্ট
      const response = await axios.post(
        // "https://dstplay.net/getgameurl",
        "https://crazybet99.com/getgameurl",
        qs.stringify(postData),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "x-dstgame-key": postData.token,
          },
        }
      );

      console.log(
        "Response from dstplay.com:",
        response.data,
        "Status:",
        response.status
      );
      res.status(200).json({
        message: "POST request successful",
        joyhobeResponse: response.data,
      });
    } catch (error) {
      console.error("Error in POST /api/test/game:", error);
      res.status(500).json({
        error: "Failed to forward POST request",
        details: error.message,
      });
    }
  });
// Route to handle game callback data
// Route to handle game callback data
Userrouter.post("/callback-data-game", async (req, res) => {
  try {
    // Extract fields from request body (support both old and new formats)
    let {
      // Old format fields
      member_account,
      bet_amount,
      win_amount,
      game_uid,
      serial_number,
      currency_code,
      platform,
      game_type,
      device_info,
      
      // New format fields
      account_id,
      username,
      provider_code,
      amount,
      game_code,
      verification_key,
      bet_type,
      transaction_id,
      times
    } = req.body;

    console.log("Callback data received -> ", req.body);

    // Determine the format and process accordingly
    let processingFormat = 'old';
    let processedData = {};

    // Check for new format indicators
    if ((username || account_id) && provider_code && game_code && bet_type) {
      processingFormat = 'new';
      
      // Validate required fields for new format
      if (!username || !provider_code || !amount || !game_code || !bet_type) {
        return res.status(400).json({
          success: false,
          message: "Required fields missing for new format.",
        });
      }

      // Find the game
      const findgame = await Game.findOne({ gameApiID: game_code });
      
      // Check if game exists
      if (!findgame) {
        return res.status(404).json({
          success: false,
          message: "Game not found",
        });
      }

      // Process username
      if (username) {
        // Ensure username length doesn't exceed database constraints
        username = username.substring(0, 45);
        // Remove last 2 characters as per your logic
        username = username.substring(0, username.length - 2);
      }

      // Parse amount safely
      const parsedAmount = !isNaN(parseFloat(amount)) && isFinite(amount) ? parseFloat(amount) : 0;

      // Map new format to unified structure
      processedData = {
        member_account: username,
        original_username: username,
        bet_amount: bet_type === 'BET' ? parsedAmount : 0,
        win_amount: bet_type === 'SETTLE' ? parsedAmount : 0,
        game_uid: game_code,
        serial_number: transaction_id || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        currency_code: 'BDT',
        platform: platform || 'casino',
        game_type: provider_code,
        device_info: device_info || 'web',
        bet_type: bet_type,
        provider_code: provider_code,
        verification_key: verification_key,
        times: times,
        game_name: findgame.name
      };

    } else {
      // Process old format
      processingFormat = 'old';
      
      // Validate required fields for old format
      if (!member_account || !game_uid || !serial_number || !currency_code) {
        return res.status(400).json({
          success: false,
          message: "All required data are not provided for old format.",
        });
      }

      // Ensure currency_code is BDT
      if (currency_code !== "BDT") {
        return res.status(400).json({
          success: false,
          message: "Currency code must be BDT.",
        });
      }

      // Process member_account
      if (member_account) {
        member_account = member_account.substring(0, 45);
      }

      const originalusername = member_account.substring(
        0,
        member_account.length - 2
      );

      // Calculate amounts safely
      const betAmount = !isNaN(parseFloat(bet_amount)) && isFinite(bet_amount) ? parseFloat(bet_amount) : 0;
      const winAmount = !isNaN(parseFloat(win_amount)) && isFinite(win_amount) ? parseFloat(win_amount) : 0;

      processedData = {
        member_account: member_account,
        original_username: originalusername,
        bet_amount: betAmount,
        win_amount: winAmount,
        net_amount: winAmount - betAmount,
        game_uid: game_uid,
        serial_number: serial_number,
        currency_code: currency_code,
        platform: platform || 'web',
        game_type: game_type,
        device_info: device_info || 'web',
        bet_type: 'AUTO', // Old format auto-determines bet/settle
        provider_code: game_type,
        status: winAmount > 0 ? 'won' : 'lost',
        game_name: 'Unknown Game' // Old format doesn't have game name
      };
    }

    console.log(`Processing ${processingFormat} format data:`, processedData);

    // Check if serial number already exists in BettingHistory
    const existingBet = await BettingHistory.findOne({ 
      serial_number: processedData.serial_number 
    });
    
    if (existingBet) {
      return res.status(409).json({
        success: false,
        message: "Duplicate transaction - serial number already exists.",
      });
    }

    // Find the user by username
    const matchedUser = await User.findOne({ 
      username: processedData.original_username 
    });
    
    if (!matchedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // Calculate amounts and status based on format
    let betAmount, winAmount, netAmount, isWin, status;

    if (processingFormat === 'new') {
      betAmount = processedData.bet_type === 'BET' ? processedData.bet_amount : 0;
      winAmount = processedData.bet_type === 'SETTLE' ? processedData.win_amount : 0;
      netAmount = winAmount - betAmount;
      isWin = processedData.bet_type === 'SETTLE';
      status = isWin ? 'won' : 'lost';
    } else {
      betAmount = processedData.bet_amount;
      winAmount = processedData.win_amount;
      netAmount = processedData.net_amount;
      isWin = winAmount > 0;
      status = processedData.status;
    }

    // Validate amounts
    if (betAmount < 0 || winAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount values. Amounts cannot be negative.",
      });
    }

    // Calculate new balance
    const balanceBefore = matchedUser.balance || 0;
    const newBalance = balanceBefore - betAmount + winAmount;

    // Ensure balance doesn't go negative (for safety)
    if (newBalance < 0) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance for this transaction.",
      });
    }

    // Prepare the bet history record for User model
    const betRecord = {
      betAmount: betAmount,
      betResult: isWin ? "win" : "loss",
      transaction_id: processedData.serial_number,
      game_id: processedData.game_uid,
      game_name: processedData.game_name,
      bet_time: new Date(),
      status: "completed",
      provider_code: processedData.provider_code,
      bet_type: processedData.bet_type,
      win_amount: winAmount
    };

    // Update user data
    const updateResult = await User.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(matchedUser._id) },
      {
        $set: {
          balance: newBalance,
          total_bet: (matchedUser.total_bet || 0) + betAmount,
          total_wins: isWin
            ? (matchedUser.total_wins || 0) + winAmount
            : matchedUser.total_wins || 0,
          total_loss: !isWin
            ? (matchedUser.total_loss || 0) + betAmount
            : matchedUser.total_loss || 0,
          lifetime_bet: (matchedUser.lifetime_bet || 0) + betAmount,
        },
        $push: {
          betHistory: betRecord,
          transactionHistory: {
            type: isWin ? "win" : "bet",
            amount: isWin ? winAmount : betAmount,
            balanceBefore: balanceBefore,
            balanceAfter: newBalance,
            description: isWin
              ? `Won ${winAmount} in game ${processedData.game_uid} (${processedData.game_name})`
              : `Bet ${betAmount} in game ${processedData.game_uid} (${processedData.game_name})`,
            referenceId: processedData.serial_number,
            createdAt: new Date(),
            provider: processedData.provider_code
          },
        },
      },
      { new: true, returnDocument: "after" }
    );

    // Manually update total_bet for consistency
    matchedUser.total_bet += betAmount;
    await matchedUser.save();

    // Check if update was successful
    if (!updateResult) {
      return res.status(500).json({
        success: false,
        message: "Failed to update user data.",
      });
    }

    // Create BettingHistory record
    const bettingHistoryRecord = new BettingHistory({
      member_account: processedData.member_account,
      original_username: processedData.original_username,
      user_id: matchedUser._id,
      bet_amount: betAmount,
      win_amount: winAmount,
      net_amount: netAmount,
      game_uid: processedData.game_uid,
      game_name: processedData.game_name,
      serial_number: processedData.serial_number,
      currency_code: processedData.currency_code,
      status: status,
      balance_before: balanceBefore,
      balance_after: newBalance,
      transaction_time: new Date(),
      processed_at: new Date(),
      platform: processedData.platform,
      game_type: processedData.game_type,
      device_info: processedData.device_info,
      provider_code: processedData.provider_code,
      bet_type: processedData.bet_type,
      processing_format: processingFormat,
      verification_key: processedData.verification_key,
      times: processedData.times
    });

    // Save BettingHistory record
    await bettingHistoryRecord.save();

    // Apply bet to wagering (for bonus requirements)
    if (updateResult.applyBetToWagering) {
      await updateResult.applyBetToWagering(betAmount);
    }

    // ========== AFFILIATE COMMISSION LOGIC ==========
    let affiliateCommissionProcessed = false;
    let commissionDetails = null;

    // Check if user has an affiliate code and process commission (only when user loses)
    if (matchedUser.registrationSource?.affiliateCode && !isWin && betAmount > 0) {
        try {
            // Find master affiliate
            const masterAffiliate = await MasterAffiliate.findOne({ 
                masterCode: matchedUser.registrationSource.affiliateCode.toUpperCase(),
                status: 'active'
            });
            
            if (masterAffiliate) {
                // Find super affiliate
                const superAffiliate = await Affiliate.findOne({ 
                    _id: masterAffiliate.createdBy,
                    status: 'active'
                });
                
                if (superAffiliate) {
                    // Calculate commissions
                    const superAffiliateCommission = (betAmount / 100) * superAffiliate.commissionRate;
                    const masterAffiliateCommission = (superAffiliateCommission / 100 ) * masterAffiliate.commissionRate;

                    console.log(`Commission Calculation - Bet: ${betAmount}, Super Rate: ${superAffiliate.commissionRate}%, Super Commission: ${superAffiliateCommission}, Master Rate: ${masterAffiliate.commissionRate}%, Master Commission: ${masterAffiliateCommission}`);

                    // Update super affiliate earnings
                    const superAffiliateEarning = await superAffiliate.addBetCommission(
                        matchedUser._id,
                        bettingHistoryRecord._id,
                        betAmount,
                        superAffiliate.commissionRate,
                        superAffiliateCommission,
                        `Bet commission from user ${processedData.original_username} - Game: ${processedData.game_name} (${processedData.game_uid})`,
                        {
                            betType: 'loss',
                            gameType: processedData.game_type,
                            deviceInfo: processedData.device_info,
                            masterAffiliateCode: masterAffiliate.masterCode,
                            transactionId: processedData.serial_number
                        }
                    );
                    
                    // Update master affiliate earnings
                    masterAffiliate.total_earning += masterAffiliateCommission;
                    
                    // Update master affiliate earnings with override commission
                    await masterAffiliate.addOverrideCommission(
                        masterAffiliateCommission,
                        superAffiliate._id,
                        'bet_commission',
                        superAffiliateCommission,
                        masterAffiliate.commissionRate,
                        `Override commission from super affiliate ${superAffiliate.affiliateCode} - User ${processedData.original_username} bet loss in ${processedData.game_name}`,
                        {
                            subAffiliateEarningId: superAffiliateEarning._id,
                            notes: `Commission from user ${processedData.original_username} bet loss - Bet ID: ${bettingHistoryRecord._id}, Bet Amount: ${betAmount}`,
                            gameName: processedData.game_name,
                            gameId: processedData.game_uid
                        }
                    );

                    // Save master affiliate
                    await masterAffiliate.save();

                    affiliateCommissionProcessed = true;
                    commissionDetails = {
                        superAffiliate: {
                            id: superAffiliate._id,
                            code: superAffiliate.affiliateCode,
                            commissionRate: superAffiliate.commissionRate,
                            commissionAmount: superAffiliateCommission,
                            newBalance: superAffiliate.totalEarnings + superAffiliateCommission
                        },
                        masterAffiliate: {
                            id: masterAffiliate._id,
                            code: masterAffiliate.masterCode,
                            commissionRate: masterAffiliate.commissionRate,
                            commissionAmount: masterAffiliateCommission,
                            totalEarnings: masterAffiliate.total_earning
                        }
                    };
                    
                    console.log(`✅ Affiliate commissions processed successfully`);
                    console.log(`   - Super Affiliate: ${superAffiliateCommission} BDT`);
                    console.log(`   - Master Affiliate: ${masterAffiliateCommission} BDT`);

                } else {
                    console.log(`❌ No active super affiliate found for master affiliate ${masterAffiliate.masterCode}`);
                }
            } else {
                console.log(`❌ No active master affiliate found with code: ${matchedUser.registrationSource.affiliateCode}`);
            }
        } catch (error) {
            console.error("❌ Error processing affiliate commission:", error);
            // Don't fail the entire transaction if commission processing fails
            affiliateCommissionProcessed = false;
            commissionDetails = { error: error.message };
        }
    } else {
        console.log(`ℹ️  No affiliate commission - User: ${isWin ? 'won' : 'lost'}, Bet: ${betAmount}, Affiliate Code: ${matchedUser.registrationSource?.affiliateCode || 'none'}`);
    }
    // ========== END AFFILIATE COMMISSION LOGIC ==========

    // Send success response
    const responseData = {
      success: true,
      data: {
        username: processedData.original_username,
        balance: updateResult.balance,
        win_amount: winAmount,
        bet_amount: betAmount,
        game_uid: processedData.game_uid,
        game_name: processedData.game_name,
        serial_number: processedData.serial_number,
        gameRecordId: updateResult.betHistory[updateResult.betHistory.length - 1]?._id,
        bettingHistoryId: bettingHistoryRecord._id,
        processing_format: processingFormat,
        affiliateCommissionProcessed: affiliateCommissionProcessed,
        commissionDetails: commissionDetails
      },
    };

    // For new format, include additional fields in response
    if (processingFormat === 'new') {
      responseData.data.bet_type = processedData.bet_type;
      responseData.data.provider_code = processedData.provider_code;
      responseData.data.verification_key = processedData.verification_key;
    }

    console.log(`✅ Callback processed successfully for user: ${processedData.original_username}, Bet: ${betAmount}, Win: ${winAmount}`);
    res.json(responseData);

  } catch (error) {
    console.error("❌ Error in callback-data-game:", error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.serial_number) {
        return res.status(409).json({
          success: false,
          message: "Duplicate transaction - serial number already exists.",
        });
      }
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message
      });
    }

    // Handle MongoDB connection errors
    if (error.name === 'MongoError' || error.name === 'MongoNetworkError') {
      console.error("MongoDB Error:", error);
      return res.status(503).json({
        success: false,
        message: "Database connection error",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error processing callback",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
// ----------------betting-records------------------------
Userrouter.get("/betting-records/:userId", authenticateToken,async(req,res)=>{
      const bettingrecords=await BettingHistory.find({user_id:req.params.userId}).sort({createdAt:-1});
      res.status(200).json({success:true,data:bettingrecords});
      
})


// Add this near the top with other model imports
const Bonus = require("../models/Bonus");

// ==================== USER BONUS ROUTES ====================

// GET all active bonuses for user
Userrouter.get("/bonuses/available", authenticateToken, async (req, res) => {
  try {
    const { bonusType } = req.query;
    
    const query = {
      status: 'active',
      endDate: { $gte: new Date() },
      startDate: { $lte: new Date() }
    };

    // Filter by bonus type if provided
    if (bonusType && bonusType !== 'all') {
      query.bonusType = bonusType;
    }

    // Check applicableTo criteria
    const user = req.user;
    const userCreatedDate = new Date(user.createdAt);
    const daysSinceRegistration = Math.floor((new Date() - userCreatedDate) / (1000 * 60 * 60 * 24));
    
    // Filter based on applicableTo
    const applicableBonuses = await Bonus.find(query);
    
    // Filter manually based on user eligibility
    const eligibleBonuses = applicableBonuses.filter(bonus => {
      if (bonus.applicableTo === 'all') return true;
      if (bonus.applicableTo === 'new' && daysSinceRegistration <= 7) return true;
      if (bonus.applicableTo === 'existing' && daysSinceRegistration > 7) return true;
      return false;
    });

    // Format bonuses for user display
    const formattedBonuses = eligibleBonuses.map(bonus => ({
      id: bonus._id,
      name: bonus.name,
      bonusCode: bonus.bonusCode,
      bonusType: bonus.bonusType,
      amount: bonus.amount,
      percentage: bonus.percentage,
      minDeposit: bonus.minDeposit,
      maxBonus: bonus.maxBonus,
      wageringRequirement: bonus.wageringRequirement,
      validityDays: bonus.validityDays,
      applicableTo: bonus.applicableTo,
      description: getBonusDescription(bonus)
    }));

    res.json({
      success: true,
      data: formattedBonuses
    });
  } catch (error) {
    console.error("Error fetching available bonuses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available bonuses"
    });
  }
});

// Helper function to generate bonus description
function getBonusDescription(bonus) {
  let description = '';
  
  if (bonus.amount > 0) {
    description += `Get ${bonus.amount.toFixed(2)} BDT bonus. `;
  }
  
  if (bonus.percentage > 0) {
    description += `Get ${bonus.percentage}% bonus on your deposit. `;
  }
  
  if (bonus.minDeposit > 0) {
    description += `Minimum deposit: ${bonus.minDeposit.toFixed(2)} BDT. `;
  }
  
  if (bonus.maxBonus) {
    description += `Maximum bonus: ${bonus.maxBonus.toFixed(2)} BDT. `;
  }
  
  if (bonus.wageringRequirement > 0) {
    description += `Wagering requirement: ${bonus.wageringRequirement}x. `;
  }
  
  description += `Valid for ${bonus.validityDays} days.`;
  
  return description;
}

// GET user's active bonuses (bonuses they have claimed)
Userrouter.get("/bonuses/my-bonuses", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Get all active bonuses from user's bonusInfo
    const activeBonuses = user.bonusInfo?.activeBonuses || [];
    const bonusActivityLogs = user.bonusActivityLogs || [];
    
    // Format active bonuses with additional info
    const formattedActiveBonuses = activeBonuses.map(bonus => {
      const remainingDays = Math.ceil((new Date(bonus.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        bonusId: bonus.bonusId,
        bonusCode: bonus.bonusCode,
        bonusType: bonus.bonusType,
        amount: bonus.amount,
        originalAmount: bonus.originalAmount,
        wageringRequirement: bonus.wageringRequirement,
        wageringCompleted: bonus.wageringCompleted || 0,
        remainingWagering: Math.max(0, (bonus.originalAmount * bonus.wageringRequirement) - (bonus.wageringCompleted || 0)),
        createdAt: bonus.createdAt,
        expiresAt: bonus.expiresAt,
        remainingDays: Math.max(0, remainingDays),
        status: 'active'
      };
    });

    // Get recently claimed/used bonuses from activity logs
    const recentActivity = bonusActivityLogs
      .sort((a, b) => new Date(b.activatedAt) - new Date(a.activatedAt))
      .slice(0, 10)
      .map(log => ({
        bonusType: log.bonusType,
        bonusAmount: log.bonusAmount,
        depositAmount: log.depositAmount || 0,
        activatedAt: log.activatedAt,
        status: log.status,
        source: log.source
      }));

    res.json({
      success: true,
      data: {
        bonusBalance: user.bonusBalance || 0,
        activeBonuses: formattedActiveBonuses,
        recentActivity: recentActivity,
        stats: {
          totalActive: formattedActiveBonuses.length,
          totalWageringRequired: formattedActiveBonuses.reduce((sum, bonus) => 
            sum + (bonus.originalAmount * bonus.wageringRequirement), 0),
          totalWageringCompleted: formattedActiveBonuses.reduce((sum, bonus) => 
            sum + (bonus.wageringCompleted || 0), 0)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching user bonuses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user bonuses"
    });
  }
});

// GET specific bonus details by code
Userrouter.get("/bonuses/code/:code", authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const user = req.user;

    // Find bonus by code
    const bonus = await Bonus.findOne({ 
      bonusCode: code.toUpperCase(),
      status: 'active',
      endDate: { $gte: new Date() },
      startDate: { $lte: new Date() }
    });

    if (!bonus) {
      return res.status(404).json({
        success: false,
        message: "Bonus code not found or expired"
      });
    }

    // Check if user is eligible
    const userCreatedDate = new Date(user.createdAt);
    const daysSinceRegistration = Math.floor((new Date() - userCreatedDate) / (1000 * 60 * 60 * 24));
    
    let isEligible = true;
    let eligibilityMessage = 'You are eligible for this bonus';

    if (bonus.applicableTo === 'new' && daysSinceRegistration > 7) {
      isEligible = false;
      eligibilityMessage = 'This bonus is only for new users (registered within 7 days)';
    } else if (bonus.applicableTo === 'existing' && daysSinceRegistration <= 7) {
      isEligible = false;
      eligibilityMessage = 'This bonus is only for existing users (registered more than 7 days ago)';
    }

    // Check if user has already claimed this bonus
    const alreadyClaimed = user.bonusActivityLogs?.some(log => 
      log.bonusCode === bonus.bonusCode && log.status === 'active'
    );

    if (alreadyClaimed) {
      isEligible = false;
      eligibilityMessage = 'You have already claimed this bonus';
    }

    // Calculate example bonus amount
    let exampleAmount = 0;
    if (bonus.percentage > 0 && bonus.minDeposit > 0) {
      exampleAmount = (bonus.minDeposit * bonus.percentage) / 100;
      if (bonus.maxBonus && exampleAmount > bonus.maxBonus) {
        exampleAmount = bonus.maxBonus;
      }
    } else if (bonus.amount > 0) {
      exampleAmount = bonus.amount;
    }

    const response = {
      success: true,
      data: {
        id: bonus._id,
        name: bonus.name,
        bonusCode: bonus.bonusCode,
        bonusType: bonus.bonusType,
        amount: bonus.amount,
        percentage: bonus.percentage,
        minDeposit: bonus.minDeposit,
        maxBonus: bonus.maxBonus,
        wageringRequirement: bonus.wageringRequirement,
        validityDays: bonus.validityDays,
        applicableTo: bonus.applicableTo,
        endDate: bonus.endDate,
        description: getBonusDescription(bonus),
        exampleAmount: exampleAmount,
        isEligible: isEligible,
        eligibilityMessage: eligibilityMessage,
        alreadyClaimed: alreadyClaimed
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching bonus by code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus details"
    });
  }
});

// POST claim bonus (user enters bonus code)
Userrouter.post("/bonuses/claim", authenticateToken, async (req, res) => {
  try {
    const { bonusCode, depositAmount = 0 } = req.body;
    const user = req.user;

    if (!bonusCode) {
      return res.status(400).json({
        success: false,
        message: "Bonus code is required"
      });
    }

    // Find bonus by code
    const bonus = await Bonus.findOne({ 
      bonusCode: bonusCode.toUpperCase(),
      status: 'active',
      endDate: { $gte: new Date() },
      startDate: { $lte: new Date() }
    });

    if (!bonus) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired bonus code"
      });
    }

    // Check eligibility
    const userCreatedDate = new Date(user.createdAt);
    const daysSinceRegistration = Math.floor((new Date() - userCreatedDate) / (1000 * 60 * 60 * 24));

    if (bonus.applicableTo === 'new' && daysSinceRegistration > 7) {
      return res.status(400).json({
        success: false,
        message: "This bonus is only for new users (registered within 7 days)"
      });
    }

    if (bonus.applicableTo === 'existing' && daysSinceRegistration <= 7) {
      return res.status(400).json({
        success: false,
        message: "This bonus is only for existing users (registered more than 7 days ago)"
      });
    }

    // Check if minimum deposit requirement is met
    if (depositAmount > 0 && depositAmount < bonus.minDeposit) {
      return res.status(400).json({
        success: false,
        message: `Minimum deposit required: ${bonus.minDeposit} BDT`
      });
    }

    // Check if user has already claimed this bonus
    const alreadyClaimed = user.bonusActivityLogs?.some(log => 
      log.bonusCode === bonus.bonusCode && log.status === 'active'
    );

    if (alreadyClaimed) {
      return res.status(400).json({
        success: false,
        message: "You have already claimed this bonus"
      });
    }

    // Calculate bonus amount
    let bonusAmount = bonus.amount;
    if (bonus.percentage > 0 && depositAmount > 0) {
      bonusAmount = (depositAmount * bonus.percentage) / 100;
      if (bonus.maxBonus && bonusAmount > bonus.maxBonus) {
        bonusAmount = bonus.maxBonus;
      }
    }

    // Add bonus to user's balance
    user.bonusBalance = (user.bonusBalance || 0) + bonusAmount;

    // Add to active bonuses
    user.bonusInfo = user.bonusInfo || {};
    user.bonusInfo.activeBonuses = user.bonusInfo.activeBonuses || [];
    
    user.bonusInfo.activeBonuses.push({
      bonusType: bonus.bonusType,
      bonusId: bonus._id,
      bonusCode: bonus.bonusCode,
      amount: bonusAmount,
      originalAmount: bonusAmount,
      wageringRequirement: bonus.wageringRequirement,
      wageringCompleted: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + bonus.validityDays * 24 * 60 * 60 * 1000)
    });

    // Log the bonus activity
    user.bonusActivityLogs = user.bonusActivityLogs || [];
    user.bonusActivityLogs.push({
      bonusType: bonus.bonusType,
      bonusId: bonus._id,
      bonusCode: bonus.bonusCode,
      bonusAmount: bonusAmount,
      depositAmount: depositAmount,
      activatedAt: new Date(),
      status: "active",
      source: "manual_claim"
    });

    // Add transaction history
    user.transactionHistory = user.transactionHistory || [];
    user.transactionHistory.push({
      type: "bonus",
      amount: bonusAmount,
      balanceBefore: user.bonusBalance - bonusAmount,
      balanceAfter: user.bonusBalance,
      description: `Bonus claimed: ${bonus.name} (${bonus.bonusCode})`,
      referenceId: `BONUS-${Date.now()}`,
      createdAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: "Bonus claimed successfully!",
      data: {
        bonusAmount: bonusAmount,
        newBonusBalance: user.bonusBalance,
        wageringRequirement: bonus.wageringRequirement,
        validityDays: bonus.validityDays,
        expiresAt: new Date(Date.now() + bonus.validityDays * 24 * 60 * 60 * 1000)
      }
    });

  } catch (error) {
    console.error("Error claiming bonus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to claim bonus"
    });
  }
});

// GET user's bonus wagering status
Userrouter.get("/bonuses/wagering-status", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    const activeBonuses = user.bonusInfo?.activeBonuses || [];
    
    // Calculate total wagering stats
    const totalWageringRequired = activeBonuses.reduce((sum, bonus) => 
      sum + (bonus.originalAmount * bonus.wageringRequirement), 0);
    
    const totalWageringCompleted = activeBonuses.reduce((sum, bonus) => 
      sum + (bonus.wageringCompleted || 0), 0);
    
    const totalWageringRemaining = totalWageringRequired - totalWageringCompleted;
    
    // Calculate percentage completed
    const percentageCompleted = totalWageringRequired > 0 
      ? Math.min(100, (totalWageringCompleted / totalWageringRequired) * 100)
      : 0;

    // Get active bonuses with detailed wagering info
    const bonusWageringDetails = activeBonuses.map(bonus => {
      const remainingWagering = Math.max(0, 
        (bonus.originalAmount * bonus.wageringRequirement) - (bonus.wageringCompleted || 0)
      );
      
      const bonusPercentageCompleted = bonus.wageringRequirement > 0
        ? Math.min(100, ((bonus.wageringCompleted || 0) / (bonus.originalAmount * bonus.wageringRequirement)) * 100)
        : 0;

      return {
        bonusId: bonus.bonusId,
        bonusCode: bonus.bonusCode,
        bonusType: bonus.bonusType,
        bonusAmount: bonus.amount,
        originalAmount: bonus.originalAmount,
        wageringRequirement: bonus.wageringRequirement,
        wageringCompleted: bonus.wageringCompleted || 0,
        remainingWagering: remainingWagering,
        percentageCompleted: bonusPercentageCompleted,
        expiresAt: bonus.expiresAt
      };
    });

    res.json({
      success: true,
      data: {
        bonusBalance: user.bonusBalance || 0,
        totalWageringRequired: totalWageringRequired,
        totalWageringCompleted: totalWageringCompleted,
        totalWageringRemaining: totalWageringRemaining,
        percentageCompleted: percentageCompleted,
        activeBonusesCount: activeBonuses.length,
        bonusWageringDetails: bonusWageringDetails,
        canWithdrawBonusFunds: totalWageringRemaining === 0 && user.bonusBalance > 0
      }
    });
  } catch (error) {
    console.error("Error fetching wagering status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wagering status"
    });
  }
});

// POST convert bonus to real money (after wagering completed)
Userrouter.post("/bonuses/convert", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user has any bonus balance
    if (!user.bonusBalance || user.bonusBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: "No bonus balance available"
      });
    }

    // Check wagering requirements for all active bonuses
    const activeBonuses = user.bonusInfo?.activeBonuses || [];
    const incompleteWagering = activeBonuses.filter(bonus => {
      const requiredWagering = bonus.originalAmount * bonus.wageringRequirement;
      return (bonus.wageringCompleted || 0) < requiredWagering;
    });

    if (incompleteWagering.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Wagering requirements not met for all bonuses",
        incompleteBonuses: incompleteWagering.map(b => ({
          bonusCode: b.bonusCode,
          wageringCompleted: b.wageringCompleted || 0,
          wageringRequired: b.originalAmount * b.wageringRequirement,
          remaining: (b.originalAmount * b.wageringRequirement) - (b.wageringCompleted || 0)
        }))
      });
    }

    // Convert bonus to real money
    const bonusAmount = user.bonusBalance;
    const newRealBalance = (user.balance || 0) + bonusAmount;

    // Update balances
    user.balance = newRealBalance;
    user.bonusBalance = 0;

    // Mark active bonuses as converted
    activeBonuses.forEach(bonus => {
      bonus.status = 'converted';
      bonus.convertedAt = new Date();
    });

    // Log transaction
    user.transactionHistory.push({
      type: "bonus_conversion",
      amount: bonusAmount,
      balanceBefore: user.balance - bonusAmount,
      balanceAfter: user.balance,
      description: "Bonus converted to real money",
      referenceId: `CONV-${Date.now()}`,
      createdAt: new Date()
    });

    // Log bonus activity
    user.bonusActivityLogs.push({
      action: "converted_to_real_money",
      amount: bonusAmount,
      timestamp: new Date(),
      details: {
        previousBonusBalance: bonusAmount,
        newRealBalance: newRealBalance
      }
    });

    await user.save();

    res.json({
      success: true,
      message: "Bonus successfully converted to real money",
      data: {
        convertedAmount: bonusAmount,
        newBalance: user.balance,
        newBonusBalance: user.bonusBalance
      }
    });

  } catch (error) {
    console.error("Error converting bonus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to convert bonus"
    });
  }
});

// GET bonus types available
Userrouter.get("/bonuses/types", authenticateToken, async (req, res) => {
  try {
    // Get distinct bonus types from active bonuses
    const bonusTypes = await Bonus.distinct('bonusType', {
      status: 'active',
      endDate: { $gte: new Date() },
      startDate: { $lte: new Date() }
    });

    const typeDescriptions = {
      welcome: "Welcome bonuses for new players",
      deposit: "Bonus on your deposits",
      reload: "Bonus on subsequent deposits",
      cashback: "Get back a percentage of your losses",
      free_spin: "Free spins on slot games",
      special: "Special promotional bonuses",
      manual: "Manually assigned bonuses"
    };

    const formattedTypes = bonusTypes.map(type => ({
      type: type,
      name: type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      description: typeDescriptions[type] || "Bonus offer",
      icon: getBonusTypeIcon(type)
    }));

    res.json({
      success: true,
      data: formattedTypes
    });
  } catch (error) {
    console.error("Error fetching bonus types:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus types"
    });
  }
});

// Helper function for bonus type icons
function getBonusTypeIcon(type) {
  switch(type) {
    case 'welcome': return '🎉';
    case 'deposit': return '💰';
    case 'reload': return '🔄';
    case 'cashback': return '💸';
    case 'free_spin': return '🎰';
    case 'special': return '⭐';
    case 'manual': return '✏️';
    default: return '🎁';
  }
}



// ==================== USER TURNOVER ROUTES ====================

// GET user's turnover and wagering status
Userrouter.get("/turnover/status", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Calculate deposit turnover
    const totalDeposit = user.total_deposit || 0;
    const totalBet = user.total_bet || 0;
    const requiredDepositTurnover = totalDeposit * 3;
    const depositTurnoverCompleted = totalBet >= requiredDepositTurnover;
    const depositTurnoverRemaining = Math.max(0, requiredDepositTurnover - totalBet);
    const depositTurnoverProgress = requiredDepositTurnover > 0 
      ? Math.min(100, (totalBet / requiredDepositTurnover) * 100)
      : 0;

    // Calculate bonus turnover for each active bonus
    const activeBonuses = user.bonusInfo?.activeBonuses || [];
    const bonusTurnoverDetails = activeBonuses.map(bonus => {
      const bonusAmount = bonus.amount || bonus.originalAmount || 0;
      const wageringRequirement = bonus.wageringRequirement || 30;
      const amountWagered = bonus.amountWagered || 0;
      const requiredWagering = bonusAmount * wageringRequirement;
      const remainingWagering = Math.max(0, requiredWagering - amountWagered);
      const progress = requiredWagering > 0 
        ? Math.min(100, (amountWagered / requiredWagering) * 100)
        : 0;
      
      const remainingDays = bonus.expiresAt 
        ? Math.ceil((new Date(bonus.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        bonusId: bonus._id || bonus.id,
        bonusType: bonus.bonusType,
        bonusCode: bonus.bonusCode || '',
        bonusAmount: bonusAmount,
        wageringRequirement: wageringRequirement,
        amountWagered: amountWagered,
        requiredWagering: requiredWagering,
        remainingWagering: remainingWagering,
        progress: progress,
        expiresAt: bonus.expiresAt,
        remainingDays: remainingDays,
        status: progress >= 100 ? 'completed' : 'active',
        createdAt: bonus.createdAt
      };
    });

    // Calculate totals for all bonuses
    const totalBonusAmount = bonusTurnoverDetails.reduce((sum, bonus) => sum + bonus.bonusAmount, 0);
    const totalRequiredWagering = bonusTurnoverDetails.reduce((sum, bonus) => sum + bonus.requiredWagering, 0);
    const totalAmountWagered = bonusTurnoverDetails.reduce((sum, bonus) => sum + bonus.amountWagered, 0);
    const totalRemainingWagering = bonusTurnoverDetails.reduce((sum, bonus) => sum + bonus.remainingWagering, 0);
    const overallBonusProgress = totalRequiredWagering > 0 
      ? Math.min(100, (totalAmountWagered / totalRequiredWagering) * 100)
      : 0;

    // Get completed bonuses from activity logs
    const completedBonuses = user.bonusActivityLogs?.filter(log => 
      log.status === 'completed' || log.status === 'expired'
    ) || [];

    // Calculate overall withdrawal eligibility
    const canWithdraw = depositTurnoverCompleted && 
                       user.bonusBalance === 0 &&
                       bonusTurnoverDetails.every(bonus => bonus.progress >= 100);

    const response = {
      success: true,
      data: {
        // User info
        userId: user._id,
        username: user.username,
        currency: user.currency,
        
        // Deposit turnover
        depositTurnover: {
          totalDeposit: totalDeposit,
          totalBet: totalBet,
          requiredTurnover: requiredDepositTurnover,
          remainingTurnover: depositTurnoverRemaining,
          progress: depositTurnoverProgress,
          isCompleted: depositTurnoverCompleted,
          canWithdraw: depositTurnoverCompleted,
          commissionRate: depositTurnoverCompleted ? 0 : 0.2 // 20% commission if not completed
        },
        
        // Bonus turnover
        bonusTurnover: {
          activeBonuses: bonusTurnoverDetails.filter(b => b.status === 'active'),
          completedBonuses: bonusTurnoverDetails.filter(b => b.status === 'completed'),
          totalBonusAmount: totalBonusAmount,
          totalRequiredWagering: totalRequiredWagering,
          totalAmountWagered: totalAmountWagered,
          totalRemainingWagering: totalRemainingWagering,
          overallProgress: overallBonusProgress,
          bonusBalance: user.bonusBalance || 0,
          canWithdrawBonus: overallBonusProgress >= 100 && user.bonusBalance > 0
        },
        
        // Overall status
        overallStatus: {
          canWithdraw: canWithdraw,
          withdrawalCommission: canWithdraw ? 0 : 0.2,
          pendingRequirements: [
            ...(!depositTurnoverCompleted ? [`Deposit turnover (${depositTurnoverRemaining} BDT remaining)`] : []),
            ...bonusTurnoverDetails
              .filter(b => b.status === 'active')
              .map(b => `${b.bonusType} bonus (${b.remainingWagering} BDT remaining)`),
            ...(user.bonusBalance > 0 ? ['Active bonus balance must be cleared'] : [])
          ],
          nextSteps: canWithdraw 
            ? ['You can now withdraw your funds without commission']
            : ['Continue betting to complete turnover requirements']
        },
        
        // Stats summary
        stats: {
          totalActiveBonuses: bonusTurnoverDetails.filter(b => b.status === 'active').length,
          totalCompletedBonuses: bonusTurnoverDetails.filter(b => b.status === 'completed').length,
          totalExpiringSoon: bonusTurnoverDetails.filter(b => 
            b.remainingDays !== null && b.remainingDays < 3 && b.status === 'active'
          ).length,
          totalProgress: Math.min(100, 
            ((totalBet + totalAmountWagered) / (requiredDepositTurnover + totalRequiredWagering)) * 100
          )
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching turnover status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch turnover status"
    });
  }
});

// GET detailed bonus wagering progress
Userrouter.get("/turnover/bonus/:bonusId", authenticateToken, async (req, res) => {
  try {
    const { bonusId } = req.params;
    const user = req.user;

    // Find the specific bonus
    const bonus = user.bonusInfo?.activeBonuses?.find(b => 
      b._id.toString() === bonusId || b.id === bonusId
    );

    if (!bonus) {
      return res.status(404).json({
        success: false,
        message: "Bonus not found"
      });
    }

    const bonusAmount = bonus.amount || bonus.originalAmount || 0;
    const wageringRequirement = bonus.wageringRequirement || 30;
    const amountWagered = bonus.amountWagered || 0;
    const requiredWagering = bonusAmount * wageringRequirement;
    const remainingWagering = Math.max(0, requiredWagering - amountWagered);
    const progress = requiredWagering > 0 
      ? Math.min(100, (amountWagered / requiredWagering) * 100)
      : 0;
    
    const remainingDays = bonus.expiresAt 
      ? Math.ceil((new Date(bonus.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    // Find related betting history for this bonus
    const bettingHistory = await BettingHistory.find({
      user_id: user._id,
      status: { $in: ['won', 'lost'] }
    })
    .sort({ createdAt: -1 })
    .limit(20);

    // Calculate which bets contributed to wagering
    const contributingBets = bettingHistory.filter(bet => {
      // Check if bet was placed during bonus active period
      const betTime = new Date(bet.transaction_time || bet.createdAt);
      const bonusCreated = new Date(bonus.createdAt);
      const bonusExpires = new Date(bonus.expiresAt);
      return betTime >= bonusCreated && betTime <= bonusExpires;
    });

    const response = {
      success: true,
      data: {
        bonusDetails: {
          bonusId: bonus._id || bonus.id,
          bonusType: bonus.bonusType,
          bonusCode: bonus.bonusCode || '',
          bonusAmount: bonusAmount,
          originalAmount: bonus.originalAmount,
          wageringRequirement: wageringRequirement,
          amountWagered: amountWagered,
          requiredWagering: requiredWagering,
          remainingWagering: remainingWagering,
          progress: progress,
          status: progress >= 100 ? 'completed' : 'active',
          createdAt: bonus.createdAt,
          expiresAt: bonus.expiresAt,
          remainingDays: remainingDays
        },
        wageringDetails: {
          perBetRequirements: {
            minBet: 10, // Minimum bet amount
            maxBet: bonusAmount * 0.5, // Maximum 50% of bonus per bet
            eligibleGames: ['casino', 'slots', 'sports', 'live_casino'],
            ineligibleBets: ['free_spin', 'bonus_round']
          },
          progressBreakdown: {
            last7Days: Math.min(100, (amountWagered / requiredWagering) * 100), // Simplified
            last30Days: Math.min(100, (amountWagered / requiredWagering) * 100) // Simplified
          }
        },
        recentContributingBets: contributingBets.slice(0, 10).map(bet => ({
          betId: bet._id,
          betAmount: bet.bet_amount,
          winAmount: bet.win_amount || 0,
          netAmount: bet.net_amount || 0,
          game: bet.game_type || bet.provider_code,
          timestamp: bet.transaction_time || bet.createdAt,
          contributedToWagering: Math.min(bet.bet_amount, remainingWagering)
        })),
        remainingRequirements: {
          dailyTarget: remainingDays > 0 ? remainingWagering / remainingDays : 0,
          estimatedCompletion: remainingDays > 0 && amountWagered > 0 
            ? `Approximately ${Math.ceil(remainingWagering / (amountWagered / 30))} days` 
            : 'Not enough data',
          urgency: remainingDays < 7 ? 'high' : remainingDays < 14 ? 'medium' : 'low'
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching bonus turnover details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus turnover details"
    });
  }
});

// GET user's turnover timeline (recent activity)
Userrouter.get("/turnover/timeline", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { limit = 20 } = req.query;

    // Get betting history
    const bettingHistory = await BettingHistory.find({ user_id: user._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Get deposit history
    const depositHistory = user.depositHistory?.slice(0, 10) || [];

    // Combine and sort all activities
    const allActivities = [
      ...bettingHistory.map(bet => ({
        type: 'bet',
        amount: bet.bet_amount,
        netAmount: bet.net_amount || 0,
        description: `Bet on ${bet.game_type || bet.provider_code}`,
        timestamp: bet.transaction_time || bet.createdAt,
        status: bet.status,
        referenceId: bet.serial_number,
        contributesToWagering: true,
        wageringAmount: bet.bet_amount // Full bet amount contributes
      })),
      
      ...depositHistory.map(deposit => ({
        type: 'deposit',
        amount: deposit.amount,
        description: `Deposit via ${deposit.method}`,
        timestamp: deposit.createdAt,
        status: deposit.status,
        referenceId: deposit.transactionId || deposit._id,
        contributesToWagering: false,
        bonusApplied: deposit.bonusApplied,
        bonusAmount: deposit.bonusAmount || 0
      })),
      
      // Add bonus activation events
      ...(user.bonusActivityLogs || []).map(log => ({
        type: 'bonus_activation',
        amount: log.bonusAmount || 0,
        description: `${log.bonusType} bonus activated`,
        timestamp: log.activatedAt || log.createdAt,
        status: log.status,
        referenceId: log._id,
        contributesToWagering: false,
        bonusCode: log.bonusCode,
        wageringRequirement: log.wageringRequirement
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Calculate cumulative wagering progress
    let cumulativeWagering = 0;
    const timelineWithProgress = allActivities.map(activity => {
      if (activity.contributesToWagering) {
        cumulativeWagering += activity.wageringAmount || 0;
      }
      
      return {
        ...activity,
        cumulativeWagering: activity.contributesToWagering ? cumulativeWagering : undefined
      };
    });

    const response = {
      success: true,
      data: {
        timeline: timelineWithProgress,
        stats: {
          totalActivities: timelineWithProgress.length,
          totalBets: timelineWithProgress.filter(a => a.type === 'bet').length,
          totalDeposits: timelineWithProgress.filter(a => a.type === 'deposit').length,
          totalBonuses: timelineWithProgress.filter(a => a.type === 'bonus_activation').length,
          totalWagered: cumulativeWagering,
          lastUpdated: new Date()
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching turnover timeline:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch turnover timeline"
    });
  }
});

// POST cancel active bonus (user initiated)
Userrouter.post("/turnover/bonus/cancel", authenticateToken, async (req, res) => {
  try {
    const { bonusId, reason } = req.body;
    const user = req.user;

    if (!bonusId) {
      return res.status(400).json({
        success: false,
        message: "Bonus ID is required"
      });
    }

    // Find the bonus in active bonuses
    const bonusIndex = user.bonusInfo?.activeBonuses?.findIndex(b => 
      b._id.toString() === bonusId || b.id === bonusId
    );

    if (bonusIndex === -1 || bonusIndex === undefined) {
      return res.status(404).json({
        success: false,
        message: "Active bonus not found"
      });
    }

    const bonus = user.bonusInfo.activeBonuses[bonusIndex];
    const bonusAmount = bonus.amount || bonus.originalAmount || 0;

    // Check if bonus has any wagering completed
    const amountWagered = bonus.amountWagered || 0;
    const requiredWagering = bonusAmount * (bonus.wageringRequirement || 30);

    // Apply penalty if wagering has started
    let penaltyAmount = 0;
    let message = "Bonus cancelled successfully";

    if (amountWagered > 0) {
      // Penalty: 50% of remaining bonus amount + 20% penalty
      const remainingBonus = Math.max(0, bonusAmount - (amountWagered / (bonus.wageringRequirement || 30)));
      penaltyAmount = remainingBonus * 1.2; // 120% penalty
      
      // Check if user has enough balance to pay penalty
      if (user.balance < penaltyAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance to pay cancellation penalty. Required: ${penaltyAmount} ${user.currency}`
        });
      }

      // Deduct penalty from balance
      user.balance -= penaltyAmount;
      message = `Bonus cancelled with ${penaltyAmount} ${user.currency} penalty applied`;
    }

    // Remove bonus amount from bonus balance
    user.bonusBalance = Math.max(0, (user.bonusBalance || 0) - bonusAmount);

    // Move bonus to cancelled bonuses
    user.bonusInfo.cancelledBonuses = user.bonusInfo.cancelledBonuses || [];
    user.bonusInfo.cancelledBonuses.push({
      bonusType: bonus.bonusType,
      amount: bonusAmount,
      penaltyApplied: penaltyAmount,
      cancelledAt: new Date(),
      cancellationReason: reason || 'User requested cancellation',
      amountWagered: amountWagered,
      wageringRequirement: bonus.wageringRequirement
    });

    // Remove from active bonuses
    user.bonusInfo.activeBonuses.splice(bonusIndex, 1);

    // Update bonus activity log
    const bonusLog = user.bonusActivityLogs?.find(log => 
      log.bonusCode === bonus.bonusCode && log.status === 'active'
    );

    if (bonusLog) {
      bonusLog.status = 'cancelled';
      bonusLog.cancelledAt = new Date();
      bonusLog.cancellationReason = reason || 'User requested cancellation';
    }

    // Add transaction record
    user.transactionHistory.push({
      type: "bonus_cancellation",
      amount: -penaltyAmount,
      balanceBefore: user.balance + penaltyAmount,
      balanceAfter: user.balance,
      description: `${bonus.bonusType} bonus cancellation${penaltyAmount > 0 ? ` with penalty` : ''}`,
      referenceId: `BONUS-CANCEL-${Date.now()}`,
      createdAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: message,
      data: {
        cancelledBonus: {
          type: bonus.bonusType,
          amount: bonusAmount,
          penaltyApplied: penaltyAmount,
          newBalance: user.balance,
          newBonusBalance: user.bonusBalance,
          cancellationReason: reason || 'User requested cancellation'
        }
      }
    });

  } catch (error) {
    console.error("Error cancelling bonus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel bonus"
    });
  }
});

// GET turnover requirements summary
Userrouter.get("/turnover/requirements", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Deposit turnover requirement
    const depositRequirement = {
      type: 'deposit_turnover',
      name: 'Deposit Turnover',
      description: 'You must bet 3x your total deposit amount before withdrawal',
      currentAmount: user.total_bet || 0,
      requiredAmount: (user.total_deposit || 0) * 3,
      progress: (user.total_deposit || 0) > 0 
        ? Math.min(100, ((user.total_bet || 0) / ((user.total_deposit || 0) * 3)) * 100)
        : 0,
      isCompleted: (user.total_bet || 0) >= ((user.total_deposit || 0) * 3),
      penaltyIfNotMet: '20% withdrawal commission',
      priority: 'high'
    };

    // Bonus turnover requirements
    const bonusRequirements = (user.bonusInfo?.activeBonuses || []).map(bonus => {
      const bonusAmount = bonus.amount || bonus.originalAmount || 0;
      const wageringRequirement = bonus.wageringRequirement || 30;
      const requiredWagering = bonusAmount * wageringRequirement;
      const currentWagering = bonus.amountWagered || 0;
      const progress = requiredWagering > 0 
        ? Math.min(100, (currentWagering / requiredWagering) * 100)
        : 0;

      const remainingDays = bonus.expiresAt 
        ? Math.ceil((new Date(bonus.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        type: 'bonus_wagering',
        bonusId: bonus._id || bonus.id,
        name: `${bonus.bonusType} Bonus Wagering`,
        description: `${bonusAmount} ${user.currency} bonus with ${wageringRequirement}x wagering`,
        currentAmount: currentWagering,
        requiredAmount: requiredWagering,
        progress: progress,
        isCompleted: currentWagering >= requiredWagering,
        expiresIn: remainingDays,
        penaltyIfNotMet: 'Bonus will be forfeited on withdrawal attempt',
        priority: remainingDays && remainingDays < 7 ? 'high' : 'medium'
      };
    });

    // Bonus balance requirement
    const bonusBalanceRequirement = {
      type: 'bonus_balance',
      name: 'Bonus Balance Clearance',
      description: 'All bonus balance must be used or forfeited before withdrawal',
      currentAmount: user.bonusBalance || 0,
      requiredAmount: 0,
      progress: user.bonusBalance > 0 ? 0 : 100,
      isCompleted: (user.bonusBalance || 0) === 0,
      penaltyIfNotMet: 'Withdrawal blocked',
      priority: 'critical'
    };

    const allRequirements = [
      depositRequirement,
      ...bonusRequirements,
      bonusBalanceRequirement
    ];

    // Calculate overall completion status
    const completedRequirements = allRequirements.filter(req => req.isCompleted).length;
    const totalRequirements = allRequirements.length;
    const overallProgress = totalRequirements > 0 
      ? (completedRequirements / totalRequirements) * 100 
      : 100;

    const response = {
      success: true,
      data: {
        requirements: allRequirements,
        summary: {
          totalRequirements: totalRequirements,
          completedRequirements: completedRequirements,
          pendingRequirements: totalRequirements - completedRequirements,
          overallProgress: overallProgress,
          canWithdraw: allRequirements.every(req => req.isCompleted),
          withdrawalConditions: allRequirements.every(req => req.isCompleted) 
            ? 'No restrictions'
            : allRequirements
                .filter(req => !req.isCompleted)
                .map(req => `${req.name}: ${req.description}`)
        },
        actions: {
          canCancelBonuses: bonusRequirements.some(b => b.type === 'bonus_wagering' && !b.isCompleted),
          canConvertBonus: user.bonusBalance > 0 && 
                          bonusRequirements.every(b => b.isCompleted) &&
                          bonusBalanceRequirement.progress < 100
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching turnover requirements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch turnover requirements"
    });
  }
});

// POST apply bet to turnover (for manual adjustment if needed)
Userrouter.post("/turnover/apply-bet", authenticateToken, async (req, res) => {
  try {
    const { betAmount, gameType, description } = req.body;
    const user = req.user;

    if (!betAmount || betAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid bet amount is required"
      });
    }

    // Apply bet to wagering
    await user.applyBetToWagering(parseFloat(betAmount));

    // Add transaction record
    user.transactionHistory.push({
      type: "manual_bet",
      amount: parseFloat(betAmount),
      balanceBefore: user.balance,
      balanceAfter: user.balance, // Balance doesn't change for manual turnover
      description: description || `Manual turnover adjustment for ${gameType || 'game'}`,
      referenceId: `MANUAL-${Date.now()}`,
      createdAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: "Bet applied to turnover successfully",
      data: {
        betAmount: parseFloat(betAmount),
        newTotalBet: user.total_bet,
        newTotalWagered: user.totalWagered,
        bonusProgress: user.bonusInfo?.activeBonuses?.map(bonus => ({
          bonusType: bonus.bonusType,
          amountWagered: bonus.amountWagered || 0,
          requiredWagering: (bonus.originalAmount || bonus.amount) * (bonus.wageringRequirement || 30),
          progress: ((bonus.amountWagered || 0) / ((bonus.originalAmount || bonus.amount) * (bonus.wageringRequirement || 30))) * 100
        }))
      }
    });
  } catch (error) {
    console.error("Error applying bet to turnover:", error);
    res.status(500).json({
      success: false,
      message: "Failed to apply bet to turnover"
    });
  }
});
module.exports = Userrouter;
