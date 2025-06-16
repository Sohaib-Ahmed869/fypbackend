const mongoose = require("mongoose");

const competitiveAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
    index: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true,
    index: true,
  },
  restaurantName: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  menu: {
    type: String, // JSON string of menu items from products
    required: true,
  },
  status: {
    type: String,
    enum: ["processing", "completed", "failed"],
    default: "processing",
    index: true,
  },

  // Main analysis results from GPT
  analysisResults: {
    // Market Positioning
    marketPositioning: {
      type: String, // Raw text from GPT analysis
      default: "",
    },

    // Competitive Landscape
    competitiveLandscape: {
      type: String, // Raw text from GPT analysis
      default: "",
    },

    // Menu & Pricing Analysis
    menuAnalysis: {
      type: String, // Raw text from GPT analysis
      default: "",
    },

    // Market Opportunities
    marketOpportunities: {
      type: String, // Raw text from GPT analysis
      default: "",
    },

    // Strategic Recommendations
    strategicRecommendations: {
      type: String, // Raw text from GPT analysis
      default: "",
    },

    // Risk Assessment
    riskAssessment: {
      type: String, // Raw text from GPT analysis
      default: "",
    },

    // Executive Summary
    executiveSummary: {
      type: String, // Raw text from GPT analysis
      default: "",
    },

    // Full raw analysis from GPT
    rawAnalysis: {
      type: String,
      default: "",
    },

    // Analysis metadata
    generatedAt: {
      type: Date,
      default: Date.now,
    },

    // Confidence and quality metrics
    analysisQuality: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  completedAt: {
    type: Date,
  },
  refreshedAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // Processing metrics
  processingTime: {
    type: Number, // in seconds
  },
  gptTokensUsed: {
    type: Number,
  },

  // User feedback
  userRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  userNotes: {
    type: String,
  },

  // Error tracking
  errorDetails: {
    type: String,
  },
});

// Compound indexes for better query performance
competitiveAnalysisSchema.index({ userId: 1, shopId: 1, createdAt: -1 });
competitiveAnalysisSchema.index({ branchId: 1, status: 1 });

// Instance methods
competitiveAnalysisSchema.methods.isCompleted = function () {
  return this.status === "completed" && this.completedAt;
};

competitiveAnalysisSchema.methods.getProcessingDuration = function () {
  if (this.completedAt && this.createdAt) {
    return Math.round((this.completedAt - this.createdAt) / 1000); // seconds
  }
  return null;
};

competitiveAnalysisSchema.methods.hasValidResults = function () {
  return (
    this.analysisResults &&
    this.analysisResults.rawAnalysis &&
    this.analysisResults.rawAnalysis.length > 100
  );
};

// Static methods
competitiveAnalysisSchema.statics.getLatestForBranch = function (branchId) {
  return this.findOne({ branchId, status: "completed" }).sort({
    completedAt: -1,
  });
};

competitiveAnalysisSchema.statics.getAnalyticsForShop = function (shopId) {
  return this.aggregate([
    { $match: { shopId: mongoose.Types.ObjectId(shopId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgProcessingTime: { $avg: "$processingTime" },
      },
    },
  ]);
};

competitiveAnalysisSchema.statics.getRecentAnalyses = function (
  userId,
  limit = 5
) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("branchId", "branch_name address")
    .select("restaurantName status createdAt completedAt branchId");
};

// Pre-save middleware
competitiveAnalysisSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Calculate processing time if completed
  if (this.status === "completed" && this.completedAt && !this.processingTime) {
    this.processingTime = Math.round(
      (this.completedAt - this.createdAt) / 1000
    );
  }

  next();
});

// Post-save middleware for logging
competitiveAnalysisSchema.post("save", function (doc) {
  if (doc.status === "completed") {
    console.log(
      `Competitive analysis completed for ${doc.restaurantName} (ID: ${doc._id})`
    );
  } else if (doc.status === "failed") {
    console.error(
      `Competitive analysis failed for ${doc.restaurantName} (ID: ${doc._id})`
    );
  }
});

const CompetitiveAnalysis = mongoose.model(
  "CompetitiveAnalysis",
  competitiveAnalysisSchema
);

module.exports = CompetitiveAnalysis;
