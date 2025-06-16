const OpenAI = require("openai");
const CompetitiveAnalysis = require("../Models/CompetitiveAnalysis");
const Branch = require("../Models/Branch");
const Shop = require("../Models/Shop");
const Product = require("../Models/Product");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to format products into menu structure
const formatMenuFromProducts = (products) => {
  const menu = {
    categories: {},
    totalItems: products.length,
    priceRange: { min: null, max: null },
  };

  products.forEach((product) => {
    const category = product.category || "Uncategorized";

    if (!menu.categories[category]) {
      menu.categories[category] = [];
    }

    const price = product.price || 0;
    menu.categories[category].push({
      name: product.product_name,
      price: price,
      description: product.description || "",
    });

    // Update price range
    if (menu.priceRange.min === null || price < menu.priceRange.min) {
      menu.priceRange.min = price;
    }
    if (menu.priceRange.max === null || price > menu.priceRange.max) {
      menu.priceRange.max = price;
    }
  });

  return menu;
};

// Helper function to build comprehensive analysis prompt
const buildComprehensivePrompt = (
  restaurantName,
  address,
  menu,
  businessType
) => {
  const menuText =
    typeof menu === "object" ? JSON.stringify(menu, null, 2) : menu;

  return `
You are an expert restaurant industry analyst. Conduct a comprehensive competitive analysis for this restaurant in Pakistan.

**RESTAURANT INFORMATION:**
- Name: ${restaurantName}
- Type: ${businessType}
- Address: ${address}
- Menu: ${menuText}

**ANALYSIS REQUIREMENTS:**

**1. MARKET POSITIONING**
Analyze and provide:
- Cuisine type and specific market category
- Price positioning (budget/mid-range/premium/luxury) based on the menu prices
- Target customer demographic for this location in Pakistan
- 3-5 unique selling propositions that differentiate this restaurant
- Market segment analysis

**2. COMPETITIVE LANDSCAPE**
Find and analyze competitors within 2-3km radius of "${address}":
- Identify 5-7 direct competitors (same cuisine type or similar target market)
- For each competitor provide: Name, approximate address/location, distance estimate
- Assess their strengths and weaknesses compared to ${restaurantName}
- Analyze market saturation in this specific area
- Compare their pricing strategy and menu offerings
- Evaluate competitive intensity in the immediate neighborhood

**3. MENU & PRICING ANALYSIS**
Detailed menu evaluation:
- Compare menu variety against local competitors
- Analyze pricing strategy effectiveness for Pakistani market
- Identify trending Pakistani food items missing from menu
- Find menu gaps and expansion opportunities
- Provide specific pricing optimization recommendations
- Assess portion sizes and value perception

**4. MARKET OPPORTUNITIES**
Identify specific opportunities:
- Underserved customer segments in this area
- Trending menu additions suitable for Pakistani market
- Delivery and takeout market gaps
- Seasonal opportunities (Ramadan, Eid, weddings)
- Corporate catering opportunities
- Student market opportunities if near educational institutions

**5. STRATEGIC RECOMMENDATIONS**
Provide actionable strategies:
- IMMEDIATE (Next 30 days): 5 specific actions with estimated costs
- SHORT-TERM (3-6 months): 3-4 strategic initiatives 
- LONG-TERM (6-12 months): 2-3 positioning strategies
- Investment priorities with ROI estimates in PKR
- Marketing recommendations for Pakistani market

**6. RISK ASSESSMENT**
Evaluate potential challenges:
- Market threats specific to this location
- Competitive risks from existing and new restaurants
- Economic factors affecting Pakistani restaurant industry
- Supply chain and ingredient availability risks
- Regulatory and licensing considerations

**7. EXECUTIVE SUMMARY**
Conclude with:
- Top 3 most critical findings
- 3 critical success factors for this location
- Overall competitive position assessment
- One key strategic recommendation for immediate implementation

**OUTPUT REQUIREMENTS:**
- Be specific about competitor names and locations in the area
- Use PKR for all pricing discussions
- Consider Pakistani dining culture and preferences
- Provide actionable recommendations with clear timelines
- Focus on the immediate neighborhood, not entire city
- Include specific street names or landmarks when mentioning competitors

Provide comprehensive analysis with detailed insights for each section above.
`;
};

// Helper function to extract specific sections from GPT response
const extractSection = (text, sectionHeader, fallbackKeyword) => {
  try {
    // Split the text into lines for better processing
    const lines = text.split("\n");
    let startIndex = -1;
    let endIndex = lines.length;

    // Find the start of our section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (
        line.includes(sectionHeader.toLowerCase()) ||
        line.includes(`**${sectionHeader.toLowerCase()}**`) ||
        line.match(new RegExp(`\\d+\\.\\s*\\*\\*${sectionHeader}`, "i"))
      ) {
        startIndex = i;
        break;
      }
    }

    // If section header found, find the end
    if (startIndex !== -1) {
      for (let i = startIndex + 1; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        // Look for next section header
        if (
          line.match(/\*\*\d+\.|^\d+\.\s*\*\*|^\*\*[a-z\s&]+\*\*$/i) &&
          !line.includes(sectionHeader.toLowerCase())
        ) {
          endIndex = i;
          break;
        }
      }

      // Extract the content between start and end
      const sectionLines = lines.slice(startIndex, endIndex);
      let content = sectionLines.join("\n").trim();

      // Clean up the content
      content = content.replace(/\*\*/g, ""); // Remove bold markers
      content = content.replace(/^\d+\.\s*/, ""); // Remove section numbers
      content = content.replace(new RegExp(`^${sectionHeader}:?\\s*`, "i"), ""); // Remove header
      content = content.trim();

      if (content.length > 20) {
        return content;
      }
    }

    // Fallback: search for keywords and extract surrounding context
    const keywordIndex = text
      .toLowerCase()
      .indexOf(fallbackKeyword.toLowerCase());
    if (keywordIndex !== -1) {
      // Extract 500 characters after the keyword
      const start = Math.max(0, keywordIndex - 50);
      const end = Math.min(text.length, keywordIndex + 800);
      let content = text.substring(start, end).trim();

      // Clean up
      content = content.replace(/\*\*/g, "");
      content = content.replace(/^\d+\.\s*/, "");

      if (content.length > 50) {
        return content;
      }
    }

    return `${sectionHeader} analysis is being processed. Please check the raw analysis section for complete details.`;
  } catch (error) {
    console.error(`Error extracting section ${sectionHeader}:`, error);
    return `${sectionHeader} analysis encountered an error during extraction. Please refer to the raw analysis section.`;
  }
};

// Helper function to parse GPT response into structured format
const parseAndStructureAnalysis = async (gptResponse) => {
  try {
    console.log("Starting analysis parsing...");
    console.log("Response length:", gptResponse.length);

    // Enhanced extraction with better fallbacks
    const structured = {
      marketPositioning: extractSection(
        gptResponse,
        "MARKET POSITIONING",
        "cuisine type"
      ),

      competitiveLandscape: extractSection(
        gptResponse,
        "COMPETITIVE LANDSCAPE",
        "competitors"
      ),

      menuAnalysis: extractSection(
        gptResponse,
        "MENU & PRICING ANALYSIS",
        "menu variety"
      ),

      marketOpportunities: extractSection(
        gptResponse,
        "MARKET OPPORTUNITIES",
        "opportunities"
      ),

      strategicRecommendations: extractSection(
        gptResponse,
        "STRATEGIC RECOMMENDATIONS",
        "recommendations"
      ),

      riskAssessment: extractSection(gptResponse, "RISK ASSESSMENT", "threats"),

      executiveSummary: extractSection(
        gptResponse,
        "EXECUTIVE SUMMARY",
        "key findings"
      ),

      rawAnalysis: gptResponse,
      generatedAt: new Date(),
    };

    // Log what we extracted
    console.log("Extracted sections:");
    Object.keys(structured).forEach((key) => {
      if (key !== "rawAnalysis" && key !== "generatedAt") {
        console.log(`${key}: ${structured[key].substring(0, 100)}...`);
      }
    });

    return structured;
  } catch (error) {
    console.error("Analysis parsing error:", error);

    // Return a fallback structure with raw analysis
    return {
      marketPositioning:
        "Market positioning analysis available in raw analysis section",
      competitiveLandscape:
        "Competitive landscape analysis available in raw analysis section",
      menuAnalysis: "Menu analysis available in raw analysis section",
      marketOpportunities:
        "Market opportunities analysis available in raw analysis section",
      strategicRecommendations:
        "Strategic recommendations available in raw analysis section",
      riskAssessment: "Risk assessment available in raw analysis section",
      executiveSummary: "Executive summary available in raw analysis section",
      rawAnalysis: gptResponse,
      generatedAt: new Date(),
    };
  }
};

// Helper function to update analysis status
const updateAnalysisStatus = async (
  analysisId,
  status,
  additionalData = {}
) => {
  try {
    await CompetitiveAnalysis.findByIdAndUpdate(analysisId, {
      status,
      ...additionalData,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Update analysis status error:", error);
  }
};

// Helper function for deep analysis using GPT
const performDeepAnalysis = async (
  analysisId,
  restaurantName,
  address,
  menu,
  businessType
) => {
  try {
    const prompt = buildComprehensivePrompt(
      restaurantName,
      address,
      menu,
      businessType
    );

    console.log(`Starting analysis for ${restaurantName} at ${address}`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert restaurant industry analyst with real-time web search capabilities. You MUST use web search to find actual competitors near the given location. Search for real restaurants, their menus, prices, and reviews. Do not provide generic analysis - everything must be based on actual web search results of competitors in the specific area. 

CRITICAL: Structure your response with clear section headers like:
**1. MARKET POSITIONING**
**2. COMPETITIVE LANDSCAPE** 
**3. MENU & PRICING ANALYSIS**
**4. MARKET OPPORTUNITIES**
**5. STRATEGIC RECOMMENDATIONS**
**6. RISK ASSESSMENT**
**7. EXECUTIVE SUMMARY**

Make each section comprehensive with detailed content. Include competitor tables, specific pricing data, and actionable insights.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    });

    // Handle GPT-4o response with tools
    let analysisResult = null;

    if (completion.choices[0].message.content) {
      // Direct content response
      analysisResult = completion.choices[0].message.content;
    } else if (completion.choices[0].message.tool_calls) {
      // Tool calls made - extract from tool responses
      analysisResult =
        "Analysis completed using web search tools. Please check individual sections for detailed insights.";
    } else {
      // Fallback
      analysisResult = "Analysis completed but content format not recognized.";
    }

    console.log("GPT Response format:", {
      hasContent: !!completion.choices[0].message.content,
      hasToolCalls: !!completion.choices[0].message.tool_calls,
      finishReason: completion.choices[0].finish_reason,
    });

    console.log(
      "Analysis result length:",
      analysisResult ? analysisResult.length : 0
    );
    if (analysisResult) {
      console.log("First 500 chars:", analysisResult.substring(0, 500));
    }
    // Parse and structure the analysis
    const structuredAnalysis = await parseAndStructureAnalysis(analysisResult);

    // Validate structured analysis
    console.log("Structured analysis validation:");
    Object.keys(structuredAnalysis).forEach((key) => {
      if (key !== "rawAnalysis" && key !== "generatedAt") {
        const length = structuredAnalysis[key]?.length || 0;
        console.log(`${key}: ${length} characters`);
        if (length < 100) {
          console.warn(`Warning: ${key} section may be too short`);
        }
      }
    });

    // Update the analysis record
    await CompetitiveAnalysis.findByIdAndUpdate(analysisId, {
      status: "completed",
      analysisResults: structuredAnalysis,
      completedAt: new Date(),
    });

    console.log(`Competitive analysis completed for ${restaurantName}`);
  } catch (error) {
    console.error("Deep analysis error:", error);
    await updateAnalysisStatus(analysisId, "failed", {
      errorDetails: error.message,
    });
  }
};

// Main analysis function - uses branchId to get all data
const analyzeCompetition = async (req, res) => {
  try {
    const { branchId } = req.params;
    const userId = req.id;
    const shopId = req.shopId;

    // Get branch details
    const branch = await Branch.findOne({ _id: branchId, shop_id: shopId });
    if (!branch) {
      return res.status(404).json({
        error: true,
        message: "Branch not found",
      });
    }

    // Get shop details for restaurant name and menu
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        error: true,
        message: "Shop not found",
      });
    }

    // Get menu from products
    const products = await Product.find({ shop_id: shopId });
    const menu = formatMenuFromProducts(products);

    // Create analysis record
    const analysisRecord = new CompetitiveAnalysis({
      userId,
      shopId,
      branchId,
      restaurantName: shop.shop_name,
      address: `${branch.address}, ${branch.city}`,
      menu: JSON.stringify(menu),
      status: "processing",
      createdAt: new Date(),
    });

    await analysisRecord.save();

    // Start background analysis
    performDeepAnalysis(
      analysisRecord._id,
      shop.shop_name,
      `${branch.address}, ${branch.city}`,
      menu,
      shop.type || "restaurant"
    ).catch((error) => {
      console.error("Background analysis error:", error);
      updateAnalysisStatus(analysisRecord._id, "failed", {
        errorDetails: error.message,
      });
    });

    res.json({
      error: false,
      message: "Competitive analysis started",
      data: {
        analysisId: analysisRecord._id,
        status: "processing",
        estimatedTime: "3-5 minutes",
        branchName: branch.branch_name,
        restaurantName: shop.shop_name,
      },
    });
  } catch (error) {
    console.error("Analysis initiation error:", error);
    res.status(500).json({
      error: true,
      message: "Failed to start competitive analysis",
      details: error.message,
    });
  }
};

// Get analysis history
const getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.id;
    const shopId = req.shopId;
    const { page = 1, limit = 10 } = req.query;

    const analyses = await CompetitiveAnalysis.find({ userId, shopId })
      .populate("branchId", "branch_name address city")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("restaurantName address status createdAt completedAt branchId");

    const total = await CompetitiveAnalysis.countDocuments({
      userId,
      shopId,
    });

    res.json({
      error: false,
      data: {
        analyses,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: analyses.length,
          totalRecords: total,
        },
      },
    });
  } catch (error) {
    console.error("Get analysis history error:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch analysis history",
    });
  }
};

// Get specific analysis report
const getAnalysisReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.id;

    const analysis = await CompetitiveAnalysis.findOne({
      _id: reportId,
      userId,
    }).populate("branchId", "branch_name address city");

    if (!analysis) {
      return res.status(404).json({
        error: true,
        message: "Analysis report not found",
      });
    }

    res.json({
      error: false,
      data: analysis,
    });
  } catch (error) {
    console.error("Get analysis report error:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch analysis report",
    });
  }
};

// Refresh existing analysis
const refreshAnalysis = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.id;

    const analysis = await CompetitiveAnalysis.findOne({
      _id: reportId,
      userId,
    }).populate("branchId");

    if (!analysis) {
      return res.status(404).json({
        error: true,
        message: "Analysis report not found",
      });
    }

    // Get updated shop data
    const shop = await Shop.findById(analysis.shopId);
    const products = await Product.find({ shop_id: analysis.shopId });
    const updatedMenu = formatMenuFromProducts(products);

    // Update status to processing
    await CompetitiveAnalysis.findByIdAndUpdate(reportId, {
      status: "processing",
      refreshedAt: new Date(),
    });

    // Start background refresh with updated data
    performDeepAnalysis(
      reportId,
      analysis.restaurantName,
      analysis.address,
      updatedMenu,
      shop.type || "restaurant"
    ).catch((error) => {
      console.error("Background refresh error:", error);
      updateAnalysisStatus(reportId, "failed", { errorDetails: error.message });
    });

    res.json({
      error: false,
      message: "Analysis refresh started",
      data: {
        analysisId: reportId,
        status: "processing",
      },
    });
  } catch (error) {
    console.error("Refresh analysis error:", error);
    res.status(500).json({
      error: true,
      message: "Failed to refresh analysis",
    });
  }
};

// Delete analysis report
const deleteAnalysisReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.id;

    const result = await CompetitiveAnalysis.findOneAndDelete({
      _id: reportId,
      userId,
    });

    if (!result) {
      return res.status(404).json({
        error: true,
        message: "Analysis report not found",
      });
    }

    res.json({
      error: false,
      message: "Analysis report deleted successfully",
    });
  } catch (error) {
    console.error("Delete analysis report error:", error);
    res.status(500).json({
      error: true,
      message: "Failed to delete analysis report",
    });
  }
};

module.exports = {
  analyzeCompetition,
  getAnalysisHistory,
  getAnalysisReport,
  refreshAnalysis,
  deleteAnalysisReport,
};
