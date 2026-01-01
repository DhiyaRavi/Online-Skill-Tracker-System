import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Check if API key is present
if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY is missing in .env file");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/ask", async (req, res) => {
  try {
    const { message, videoTitle } = req.body;

    // Validate input
    if (!message || !videoTitle) {
      return res.status(400).json({ error: "Both 'message' and 'videoTitle' are required" });
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful YouTube video learning assistant.",
        },
        {
          role: "user",
          content: `Video Topic: ${videoTitle}\nUser Question: ${message}`,
        },
      ],
    });

    // Return AI response
    res.json({
      reply: completion.choices[0].message?.content || "No response from AI",
    });
  } catch (error) {
    console.error("OpenAI API Error:", error.response?.data || error.message);

    // Return error with details for easier debugging
    res.status(500).json({
      error: "AI failed to respond",
      details: error.response?.data || error.message,
    });
  }
});

router.post("/leetcode-guide", async (req, res) => {
    try {
      const { stats, username } = req.body;
  
      if (!stats || !username) {
        return res.status(400).json({ error: "User stats and username are required" });
      }
  
      const prompt = `
        You are an expert coding mentor.
        Analyze the LeetCode stats for user "${username}":
        ${JSON.stringify(stats, null, 2)}
        
        Provide a response in the following JSON format ONLY (do not include markdown formatting):
        {
            "analysis": "Brief analysis of their current skill level based on solved count vs total.",
            "topics": ["Topic 1", "Topic 2", "Topic 3"],
            "tip": "One actionable tip to improve."
        }
        
        Focus on what they should learn next to improve. Be encouraging but realistic.
      `;
  
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "You are a helpful coding tutor." },
          { role: "user", content: prompt },
        ],
      });
  
      const responseText = completion.choices[0].message?.content || "{}";
      
      // Attempt to parse JSON
      let data;
      try {
          data = JSON.parse(responseText);
      } catch (e) {
          // Fallback if AI returns plain text
          data = { analysis: responseText, topics: [], tip: "" };
      }
  
      res.json(data);
  
    } catch (error) {
      console.error("AI LeetCode Error:", error);
      res.status(500).json({ error: "Failed to generate guide" });
    }
  });

export default router;
