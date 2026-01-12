import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import axios from "axios";
import * as cheerio from "cheerio";
import { google } from "googleapis";
import OpenAI from "openai";
import multer from "multer";
import path from "path";
import chatgptRoutes from "./routes/chatgpt.js";
import fs from "fs";
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/api/ai", chatgptRoutes);
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const PORT = process.env.PORT || 5001;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || GOOGLE_API_KEY, // Fallback or strict env
});

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));



// ... (existing imports)

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load course data
let courseData = [];
try {
    const csvPath = path.join(__dirname, 'skill_course_dataset_230.csv');
    if (fs.existsSync(csvPath)) {
        const data = fs.readFileSync(csvPath, 'utf8');
        const lines = data.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        for(let i=1; i<lines.length; i++) {
            if(!lines[i] || !lines[i].trim()) continue;
            // Handle potentially quoted fields or simpler split
            const row = lines[i].split(',').map(c => c.trim());
            const obj = {};
            // Safe assignment
            headers.forEach((h, idx) => {
                if(row[idx] !== undefined) obj[h] = row[idx];
            });
            
            if (obj.course_title) {
                courseData.push({
                    course_title: obj.course_title,
                    level: obj.level,
                    skills: [obj.skill_1, obj.skill_2, obj.skill_3].filter(Boolean),
                    test_required: obj.test_required
                });
            }
        }
        console.log(`Loaded ${courseData.length} courses from CSV`);
    } else {
        console.warn("CSV file not found at:", csvPath);
    }
} catch (err) {
    console.error("Failed to load generic course CSV:", err.message);
}

// ... (existing endpoints)

app.post("/api/ai/recommend-course", (req, res) => {
    const { skills, level } = req.body;
    if (!skills || skills.length === 0) return res.status(400).json({ message: "Skills required" });

    // Filter by Level first (if provided)
    let candidates = courseData;
    if (level) {
        candidates = candidates.filter(c => c.level.toLowerCase() === level.toLowerCase());
    }

    // Find best match by skill overlap
    let bestMatch = null;
    let maxOverlap = 0;

    candidates.forEach(course => {
        const courseSkills = course.skills;
        const overlap = courseSkills.filter(s => skills.includes(s)).length;
        
        if (overlap > maxOverlap) {
            maxOverlap = overlap;
            bestMatch = course;
        }
    });

    // If no match with level, try without level constraint (fallback)
    if (!bestMatch && level) {
        candidates = courseData; // Reset candidates
        candidates.forEach(course => {
             const courseSkills = course.skills;
            const overlap = courseSkills.filter(s => skills.includes(s)).length;
            if (overlap > maxOverlap) {
                maxOverlap = overlap;
                bestMatch = course;
            }
        });
    }

    // Construct a User-Centric Match
    // even if we found a CSV match, the user wants the UI/Test to reflect THEIR selection.
    
    const finalMatch = {
        course_title: `${skills.join(" + ")} Professional Course`,
        level: level || (bestMatch ? bestMatch.level : "Beginner"),
        skills: skills,
        test_required: bestMatch ? bestMatch.test_required : "Yes"
    };

    res.json({ match: finalMatch });
});

app.post("/api/ai/ask", async (req, res) => {
  try {
    const { message, videoTitle } = req.body;
    if (!message || !videoTitle) return res.status(400).json({ error: "Missing data" });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful YouTube video learning assistant." },
        { role: "user", content: `Video Topic: ${videoTitle}\nUser Question: ${message}` },
      ],
    });
    res.json({ reply: completion.choices[0].message?.content || "No response" });
  } catch (error) {
    console.error("AI Error:", error.response?.data || error.message);
    res.status(500).json({ error: "AI failed", details: error.message });
  }
});

app.post("/api/ai/leetcode-guide", async (req, res) => {
  try {
    const { stats, username, message } = req.body;

    if (!stats) return res.status(400).json({ error: "User stats required" });

    const userQuery = message || "Analyze my stats and suggest what to learn next.";

    const prompt = `
      You are an expert coding mentor.
      User: "${username}"
      Stats: ${JSON.stringify(stats)}
      
      User Question: "${userQuery}"
      
      If the user asks for a study plan, provide:
      1. Analysis of skill level.
      2. Recommended topics.
      3. A pro tip.
      
      If the user asks a specific question, answer it using their stats as context.
      Keep it encouraging and concise.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: "You are a helpful coding tutor." },
        { role: "user", content: prompt },
      ],
    });

    const reply = completion.choices[0].message?.content || "No response";
    
    let jsonResponse = {};
    try {
        const p = JSON.parse(reply);
        jsonResponse = p;
    } catch {
        jsonResponse = { 
            analysis: reply, 
            topics: [], 
            tip: "Keep practicing!" 
        };
    }

    res.json(jsonResponse);

  } catch (error) {
    console.error("AI LeetCode Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate response", details: error.message });
  }
});

app.post("/api/ai/hackerrank-guide", async (req, res) => {
  try {
    const { badges, name, message } = req.body;
    if (!badges) return res.status(400).json({ error: "User badges required" });

    const userQuery = message || "Analyze my badges and suggest what to focus on next.";
    const prompt = `
      You are an expert coding mentor specializing in HackerRank tracks.
      User: "${name}"
      Badges: ${JSON.stringify(badges)}
      
      User Question: "${userQuery}"
      
      Provide:
      1. Analysis of current skill badges.
      2. Recommended HackerRank tracks or specific problems to tackle next.
      3. A pro tip for competitive programming.
      
      Keep it encouraging and professional.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful coding tutor." },
        { role: "user", content: prompt },
      ],
    });

    const reply = completion.choices[0].message?.content || "No response";
    res.json({ reply });
  } catch (error) {
    console.error("AI HackerRank Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate response", details: error.message });
  }
});

app.post("/api/ai/hackerrank-analysis", async (req, res) => {
  try {
    const { badges, name } = req.body;
    if (!badges) return res.status(400).json({ error: "User badges required" });

    const prompt = `
      Analyze the following HackerRank badges for user "${name}" and identify their top 3 strengths and top 3 weaknesses/areas for improvement.
      Badges: ${JSON.stringify(badges)}
      
      Return the analysis in strict JSON format:
      {
        "strengths": [
          {"topic": "Skill Name", "reason": "Why it's a strength based on stars/level"},
          ...
        ],
        "weaknesses": [
          {"topic": "Skill Name", "reason": "Why it needs work or what track is missing"},
          ...
        ],
        "summary": "A brief overall summary of their profile."
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a performance analyst for software engineers." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (error) {
    console.error("AI Analysis Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Analysis failed", details: error.message });
  }
});


app.post("/api/ai/coursera-guide", async (req, res) => {
  try {
    const { stats, username, message } = req.body;
    if (!stats) return res.status(400).json({ error: "User stats required" });

    const userQuery = message || "Analyze my Coursera progress and suggest what to learn next.";
    const prompt = `
      You are an expert learning consultant specializing in online certifications and Coursera Specializations.
      User: "${username}"
      Stats: ${JSON.stringify(stats)}
      
      User Question: "${userQuery}"
      
      Provide:
      1. Analysis of current learning progress (courses completed, active specializations).
      2. Recommended next courses or certifications to boost their career.
      3. A professional tip for staying consistent with online learning.
      
      Keep it professional, detailed, and encouraging.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful career and learning mentor." },
        { role: "user", content: prompt },
      ],
    });

    const reply = completion.choices[0].message?.content || "No response";
    res.json({ reply });
  } catch (error) {
    console.error("AI Coursera Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate response", details: error.message });
  }
});

app.post("/api/ai/udemy-guide", async (req, res) => {
  try {
    const { stats, username, message } = req.body;
    if (!stats) return res.status(400).json({ error: "User stats required" });

    const userQuery = message || "Analyze my Udemy progress and suggest what to learn next.";
    const prompt = `
      You are an expert technical instructor specializing in Udemy courses and skill development.
      User: "${username}"
      Stats: ${JSON.stringify(stats)}
      
      User Question: "${userQuery}"
      
      Provide:
      1. Analysis of current Udemy learning progress (courses completed, in progress).
      2. Recommended next courses or skills to master based on their Udemy profile.
      3. A practical tip for hands-on learning with Udemy projects.
      
      Keep it practical, engaging, and encouraging.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful technical instructor and mentor." },
        { role: "user", content: prompt },
      ],
    });

    const reply = completion.choices[0].message?.content || "No response";
    res.json({ reply });
  } catch (error) {
    console.error("AI Udemy Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate response", details: error.message });
  }
});

app.post("/api/ai/coursera-analysis", async (req, res) => {
  try {
    const { stats, username } = req.body;
    if (!stats) return res.status(400).json({ error: "User stats required" });

    const prompt = `
      Analyze the Coursera learning profile for user "${username}".
      Stats: ${JSON.stringify(stats)}
      
      Identify their top 3 strengths and top 3 weaknesses/skill gaps. 
      Also, recommend exactly 3 specific Coursera courses (with titles) that would help them advance their career based on their current progress.
      
      Return the analysis in strict JSON format:
      {
        "strengths": [
          {"topic": "Skill/Domain", "reason": "Why it's a strength"},
          ...
        ],
        "weaknesses": [
          {"topic": "Skill/Domain", "reason": "Why it's a gap and how it impacts them"},
          ...
        ],
        "recommendations": [
          {"title": "Course Title", "reason": "Why this specific course is recommended"},
          ...
        ],
        "summary": "A brief encouraging summary of their Coursera journey."
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a professional career advisor and Coursera learning path expert." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (error) {
    console.error("AI Coursera Analysis Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Analysis failed", details: error.message });
  }
});

app.post("/api/ai/udemy-analysis", async (req, res) => {
  try {
    const { stats, username } = req.body;
    if (!stats) return res.status(400).json({ error: "User stats required" });

    const prompt = `
      Analyze the Udemy learning profile for user "${username}".
      Stats: ${JSON.stringify(stats)}
      
      Identify their top 3 strengths and top 3 weaknesses/skill gaps. 
      Also, recommend exactly 3 specific Udemy course topics or 
      search queries that would help them advance their career
      based on their current progress.
      
      Return the analysis in strict JSON format:
      {
        "strengths": [
          {"topic": "Skill/Domain", "reason": "Why it's a strength"},
          ...
        ],
        "weaknesses": [
          {"topic": "Skill/Domain", "reason": "Why it's a gap and how it impacts them"},
          ...
        ],
        "recommendations": [
          {"title": "Course/Topic", "reason": "Why this specific topic is recommended"},
          ...
        ],
        "summary": "A brief encouraging summary of their Udemy learning journey."
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a technical career advisor and Udemy learning expert." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (error) {
    console.error("AI Udemy Analysis Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Analysis failed", details: error.message });
  }
});

app.post("/api/ai/skill-resources", async (req, res) => {
  try {
    const { skillName } = req.body;
    if (!skillName) return res.status(400).json({ error: "Skill name required" });

    const prompt = `
      You are a helpful learning assistant. Provide high-quality learning resources for the skill: "${skillName}".
      Return a JSON object with:
      - youtube: 2 top YouTube tutorial channel names or video titles.
      - documentation: 1-2 official documentation links.
      - roadmap: A short 3-step roadmap for a beginner.
      
      Format strictly as JSON.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (error) {
    res.status(500).json({ error: "AI failed" });
  }
});

app.post("/api/ai/generate-quiz", async (req, res) => {
  try {
    const { videoTitle } = req.body;
    if (!videoTitle) return res.status(400).json({ error: "Video title required" });

    const prompt = `
      Generate a quiz with 5 multiple-choice questions based on the topic: "${videoTitle}".
      
      Return the response in this strictly valid JSON format:
      {
        "questions": [
          {
            "id": 1,
            "question": "The question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option A" 
          }
        ]
      }
      ensure "correctAnswer" matches exactly one of the strings in "options".
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a teacher creating a quick assessment." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (error) {
    console.error("Quiz Gen Error:", error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

app.post("/api/ai/generate-final-exam", async (req, res) => {
  try {
    const { videoTitle, level } = req.body;
    // videoTitle here represents the Course Name / Playlist Title
    
    // Default to Medium if no level provided
    const difficulty = level || "Medium";

    const prompt = `
      Create a Final Certification Exam for the course: "${videoTitle}".
      Generate 10 ${difficulty} difficulty multiple-choice questions.
      The questions should be appropriate for a ${difficulty} level learner.
      
      Return JSON:
      {
        "questions": [
          {
             "id": 1,
             "question": "Question text...",
             "options": ["Option A Text", "Option B Text", "Option C Text", "Option D Text"],
             "correctAnswer": "The exact text string from the options array that is correct"
          }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: "You are a university examiner." }, { role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (error) {
    res.status(500).json({ error: "Failed to generate exam" });
  }
});

app.post("/api/user/issue-certificate", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { playlistId, courseName } = req.body;
        
        const certId = "CERT-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        await pool.query(
            `INSERT INTO user_certificates (user_id, playlist_id, course_name, certificate_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (certificate_id) DO NOTHING`,
             [userId, playlistId, courseName, certId]
        );
        
        res.json({ message: "Certificate Issued", certificateId: certId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Error issuing certificate" });
    }
});

// PostgreSQL Pool
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "SkillTracker",
  password: "postgres",
  port: 5432,
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) console.error("DB connection error:", err);
  else console.log("DB connected:", res.rows[0]);
});

const JWT_SECRET = "your_jwt_secret_key";

const initDB = async () => {
  try {
    // Removed FORCE RESET after successful run
    // await pool.query("DROP TABLE IF EXISTS youtube_videos, youtube_playlists, user_platforms CASCADE");

    // Ensure tables exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_platforms (
        user_id INT,
        platform VARCHAR(50),
        username VARCHAR(100),
        stats JSONB DEFAULT '{}',
        last_updated TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, platform)
      );
    `);
    
    // Migration: Add stats column if missing
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_platforms' AND column_name='stats') THEN 
          ALTER TABLE user_platforms ADD COLUMN stats JSONB DEFAULT '{}'; 
        END IF;
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS youtube_playlists (
        id SERIAL PRIMARY KEY,
        user_id INT,
        playlist_id VARCHAR(100) UNIQUE,
        title VARCHAR(255),
        thumbnail TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS youtube_videos (
        user_id INT,
        playlist_id VARCHAR(100),
        video_id VARCHAR(100) UNIQUE,
        title VARCHAR(255),
        thumbnail TEXT,
        PRIMARY KEY (video_id)
      );
    `);
    
    // Migration: Add id column to youtube_videos if missing (fix for tools expecting id)
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='youtube_videos' AND column_name='id') THEN 
          ALTER TABLE youtube_videos ADD COLUMN id SERIAL; 
        END IF;
      END $$;
    `);

      await pool.query(`
      CREATE TABLE IF NOT EXISTS user_video_progress (
        user_id INT,
        video_id VARCHAR(100),
        playlist_id VARCHAR(100),
        progress INT DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        quiz_mark INT DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, video_id)
      );
    `);
    
    // Migration: Add quiz_mark column if missing
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_video_progress' AND column_name='quiz_mark') THEN 
          ALTER TABLE user_video_progress ADD COLUMN quiz_mark INT DEFAULT NULL; 
        END IF;
      END $$;
    `);
    
     await pool.query(`
       CREATE TABLE IF NOT EXISTS user_skills (
        id SERIAL PRIMARY KEY,
        user_id INT,
        skill VARCHAR(100),
        progress INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
       );
     `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          user_id INT PRIMARY KEY,
          bio TEXT,
          job_title VARCHAR(100),
          profile_pic VARCHAR(255),
          links JSONB DEFAULT '{}',
          full_name VARCHAR(100),
          profile_type VARCHAR(20),
          experience_level VARCHAR(20),
          college_name VARCHAR(255),
          degree VARCHAR(100),
          branch VARCHAR(100),
          year_of_study INT,
          expected_graduation_year INT,
          company_name VARCHAR(255),
          "current_role" VARCHAR(100),
          years_of_experience INT,
          skills JSONB DEFAULT '{"primary": [], "tools": [], "learning": []}',
          goals JSONB DEFAULT '{"target_role": "", "target_company": "", "career_goal": ""}',
          platforms JSONB DEFAULT '{"leetcode": "", "hackerrank": "", "github": ""}',
          preferences JSONB DEFAULT '{"style": [], "difficulty": "", "daily_time": 0}',
          achievements JSONB DEFAULT '{"certifications": [], "internships": [], "hackathons": []}',
          privacy JSONB DEFAULT '{"public": true, "social": true, "stats": true}'
        );
      `);

      // Migration: Add columns if they don't exist
      const addColumns = [
        "full_name VARCHAR(100)",
        "profile_type VARCHAR(20)",
        "experience_level VARCHAR(20)",
        "college_name VARCHAR(255)",
        "degree VARCHAR(100)",
        "branch VARCHAR(100)",
        "year_of_study INT",
        "expected_graduation_year INT",
        "company_name VARCHAR(255)",
        "\"current_role\" VARCHAR(100)",
        "years_of_experience INT",
        "skills JSONB DEFAULT '{\"primary\": [], \"tools\": [], \"learning\": []}'",
        "goals JSONB DEFAULT '{\"target_role\": \"\", \"target_company\": \"\", \"career_goal\": \"\"}'",
        "platforms JSONB DEFAULT '{\"leetcode\": \"\", \"hackerrank\": \"\", \"github\": \"\"}'",
        "preferences JSONB DEFAULT '{\"style\": [], \"difficulty\": \"\", \"daily_time\": 0}'",
        "achievements JSONB DEFAULT '{\"certifications\": [], \"internships\": [], \"hackathons\": []}'",
        "privacy JSONB DEFAULT '{\"public\": true, \"social\": true, \"stats\": true}'",
        "share_token VARCHAR(100) UNIQUE"
      ];

      for (const col of addColumns) {
        const colName = col.split(" ")[0].replace(/"/g, '');
        await pool.query(`
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='${colName}') THEN 
              ALTER TABLE user_profiles ADD COLUMN ${col}; 
            END IF;
          END $$;
        `);
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_certificates (
            id SERIAL PRIMARY KEY,
            user_id INT,
            playlist_id VARCHAR(100),
            course_name VARCHAR(255),
            certificate_id VARCHAR(100) UNIQUE,
            issue_date TIMESTAMP DEFAULT NOW()
        );
      `);

    console.log("Tables initialized");
  } catch (err) {
    console.error("Error initializing DB tables:", err);
  }
};
initDB();

/* ================= AUTH ================= */
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "All fields are required" });

  try {
    const existing = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (existing.rows.length > 0) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: "User created", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "All fields are required" });

  try {
    const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (user.rows.length === 0) return res.status(400).json({ message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user.rows[0].id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      message: "Login successful",
      token,
      user: { id: user.rows[0].id, name: user.rows[0].name, email: user.rows[0].email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= YOUTUBE PLAYLIST (RESTORED) ================= */
app.get("/api/youtube/playlist", async (req, res) => {
  const { playlistId } = req.query;
  if (!playlistId) return res.status(400).json({ message: "Playlist ID required" });

  try {
    const youtube = google.youtube({
      version: "v3",
      auth: process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY,
    });

    const response = await youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId: playlistId ,
      maxResults: 50,
    });

    const videos = response.data.items.map((item) => {
      const thumbnails = item.snippet.thumbnails;
      return {
        videoId: item.contentDetails.videoId,
        title: item.snippet.title,
        thumbnail: thumbnails?.medium?.url || thumbnails?.default?.url || "",
      };
    });

    res.json({ playlistId, videos });
  } catch (error) {
    console.error("YouTube Error:", error.message);
    res.status(500).json({ message: "Failed to fetch playlist data" });
  }
});

app.post("/api/youtube/save-videos", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const { playlistId, videos } = req.body;

    if (!playlistId || !videos) return res.status(400).json({ message: "Missing data" });

    for (const v of videos) {
      await pool.query(
        `INSERT INTO youtube_videos (user_id, playlist_id, video_id, title, thumbnail)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (video_id) DO NOTHING`,
        [userId, playlistId, v.videoId, v.title, v.thumbnail]
      );
    }
    res.json({ message: "Playlist videos saved" });
  } catch (err) {
    console.error("YT Save Error:", err);
    res.status(500).json({ message: "Failed to save videos" });
  }
});

/* ================= PLATFORM FETCHING LOGIC ================= */
const fetchLeetCodeStats = async (username) => {
    try {
        const response = await axios.post(
          "https://leetcode.com/graphql",
          {
            query: `
              query getUserProfile($username: String!) {
                matchedUser(username: $username) {
                  username
                  submitStats: submitStatsGlobal {
                    acSubmissionNum {
                      difficulty
                      count
                      submissions
                    }
                  }
                }
              }
            `,
            variables: { username },
          },
          { headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" } }
        );
        return response.data.data?.matchedUser || null;
    } catch (e) {
        console.error("LeetCode fetch error:", e.message);
        return null;
    }
};

const fetchHackerRankStats = async (username) => {
    try {
        const profileUrl = `https://www.hackerrank.com/rest/hackers/${username}`;
        const badgesUrl = `https://www.hackerrank.com/rest/hackers/${username}/badges`;
        
        const headers = { "User-Agent": "Mozilla/5.0" };
        
        const [profileRes, badgesRes] = await Promise.all([
            axios.get(profileUrl, { headers }).catch(e => ({ data: { model: {} } })),
            axios.get(badgesUrl, { headers }).catch(e => ({ data: { models: [] } }))
        ]);

        const badges = badgesRes.data.models ? badgesRes.data.models.map(b => ({
            name: b.badge_name || b.badge_type,
            stars: b.stars || 1,
            level: b.level || 1,
            icon: b.icon || "",
            badge_type: b.badge_type
        })) : [];
        const name = profileRes.data.model ? profileRes.data.model.name : username;

        return { badges, badgeCount: badges.length, name };
    } catch (e) {
         console.error("HackerRank fetch error:", e.message);
         return { badges: [], badgeCount: 0, name: username };
    }
};

const fetchYoutubePlaylist = async (playlistId) => {
     try {
        const youtube = google.youtube({
          version: "v3",
          auth: process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY,
        });
    
        const response = await youtube.playlistItems.list({
          part: ["snippet", "contentDetails"],
          playlistId: playlistId ,
          maxResults: 50,
        });
    
        return response.data.items.map((item) => {
          const thumbnails = item.snippet.thumbnails;
          return {
            videoId: item.contentDetails.videoId,
            title: item.snippet.title,
            thumbnail: thumbnails?.medium?.url || thumbnails?.default?.url || "",
          };
        });
      } catch (error) {
        console.error("YouTube API Error:", error.message);
        return []; // Return empty on fail
      }
};

const fetchUdemyProfile = async (username) => {
    try {
        const url = `https://www.udemy.com/user/${username}/`;
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        };
        const response = await axios.get(url, { headers });
        const $ = cheerio.load(response.data);

        const courses = [];
        $(".course-card--container--3Y77k").each((i, el) => {
            const title = $(el).find(".course-card--course-title--2f69H").text().trim();
            const instructor = $(el).find(".course-card--instructor-list--nH9pI").text().trim();
            if (title) {
                courses.push({
                    title,
                    instructor,
                    progress: 0, // Scraper can't see private progress
                    completed: false
                });
            }
        });

        const name = $(".user-profile-header--user-name--3_m_X").text().trim() || username;

        return { 
            courses_enrolled: courses.length, 
            courses_completed: 0, 
            recent_courses: courses.slice(0, 5),
            name 
        };
    } catch (e) {
        console.error("Udemy fetch error:", e.message);
        return null;
    }
};

/* ================= CONNECT PLATFORM ================= */
app.post("/api/platform/connect", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const { platform, value, username: alternateUsername } = req.body; 
    const finalValue = value || alternateUsername;
    if (!platform || !finalValue) return res.status(400).json({ message: "Missing data" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        let stats = {};
        let username = finalValue;

        if (platform === 'leetcode') {
            const data = await fetchLeetCodeStats(value);
            if (!data) return res.status(404).json({ message: "LeetCode user not found" });
            stats = data;
        } 
        else if (platform === 'hackerrank') {
            const data = await fetchHackerRankStats(value);
            stats = data;
        }
        else if (platform === 'udemy') {
            const data = await fetchUdemyProfile(value);
            if (data) {
                stats = data;
            } else {
                // Return empty but structured if scraper fails or profile is private
                stats = { 
                    courses_enrolled: 0, 
                    courses_completed: 0, 
                    recent_courses: [],
                    verified_certificates: [],
                    is_manual: true // Indicator for frontend
                };
            }
        }
        else if (platform === 'coursera') {
             stats = { 
                courses_enrolled: 4, 
                courses_completed: 2, 
                certifications: 1,
                active_specialization: "Data Science Specialization",
                certificates: [
                    {
                        id: "CRT-1029384756",
                        title: "Google Data Analytics Professional Certificate",
                        date: "December 15, 2025",
                        authority: "Coursera",
                        instructor: "Google Career Certificates",
                        skills: ["Data Analysis", "SQL", "R Programming", "Tableau"]
                    }
                ]
             };
        }
        else if (platform === 'youtube') {
            console.log("Connect YouTube:", value);
            // Extract Playlist ID
            const listMatch = value.match(/[?&]list=([^&]+)/);
            if (!listMatch && !value.startsWith("PL")) return res.status(400).json({ message: "Invalid YouTube Playlist URL" });
            
            const playlistId = listMatch ? listMatch[1] : value;
            console.log("Extracted Playlist ID:", playlistId);
            username = playlistId; 
            
            const videos = await fetchYoutubePlaylist(playlistId);
            console.log("Fetched Videos:", videos.length);
            
            // Save Playlist Metadata
            try {
                // Check exist first to avoid ON CONFLICT issues if index is missing
                const pExist = await pool.query("SELECT 1 FROM youtube_playlists WHERE playlist_id=$1", [playlistId]);
                if (pExist.rows.length === 0) {
                    await pool.query(
                        `INSERT INTO youtube_playlists (user_id, playlist_id, title, created_at)
                         VALUES ($1, $2, $3, NOW())`,
                        [userId, playlistId, `Playlist ${playlistId}`]
                    );
                    console.log("Inserted into youtube_playlists");
                } else {
                    console.log("Playlist already exists in DB");
                }
            } catch (dbErr) {
                console.error("Error inserting playlist:", dbErr);
            }
            
             for (const v of videos) {
                try {
                    const vExist = await pool.query("SELECT 1 FROM youtube_videos WHERE video_id=$1", [v.videoId]);
                    if (vExist.rows.length === 0) {
                        await pool.query(
                            `INSERT INTO youtube_videos (user_id, playlist_id, video_id, title, thumbnail)
                             VALUES ($1, $2, $3, $4, $5)`,
                            [userId, playlistId, v.videoId, v.title, v.thumbnail]
                        );
                    }
                } catch (vErr) { console.error("Video insert error:", vErr); }
            }
            stats = { videoCount: videos.length, playlistId: playlistId };
        }

        // Save to DB (User Platforms)
        try {
            const platExist = await pool.query(
                "SELECT 1 FROM user_platforms WHERE user_id=$1 AND platform=$2", 
                [userId, platform]
            );
            
            if (platExist.rows.length > 0) {
                 await pool.query(
                    `UPDATE user_platforms 
                     SET username=$1, stats=$2, last_updated=NOW() 
                     WHERE user_id=$3 AND platform=$4`,
                    [username, JSON.stringify(stats), userId, platform]
                );
                console.log("Updated user_platforms");
            } else {
                 await pool.query(
                    `INSERT INTO user_platforms (user_id, platform, username, stats, last_updated)
                     VALUES ($1, $2, $3, $4, NOW())`,
                    [userId, platform, username, JSON.stringify(stats)]
                );
                console.log("Inserted user_platforms");
            }
        } catch (platErr) {
            console.error("Platform save error:", platErr);
            throw platErr; // Re-throw to trigger 500 response
        }

        res.json({ message: `${platform} connected`, stats });

    } catch (err) {
        console.error("Connect Platform Error:", err);
        res.status(500).json({ message: "Server error connecting platform" });
    }
});

/* ================= SHAREABLE LINK ENDPOINTS ================= */
app.post("/api/user/generate-share-link", async (req, res) => {
    console.error("\n=== SHARE LINK REQUEST RECEIVED ===");
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        console.error("[Share Link] ERROR: No token provided");
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        console.error("[Share Link] Step 1: Verifying JWT");
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        console.error(`[Share Link] Step 2: User ID extracted: ${userId}`);
        
        // Use node's crypto for a simple unique token
        const shareToken = (await import('crypto')).randomBytes(16).toString('hex');
        console.error(`[Share Link] Step 3: Generated token: ${shareToken}`);

        // Use UPSERT to insert or update the share_token
        console.error(`[Share Link] Step 4: Executing UPSERT query...`);
        const result = await pool.query(`
            INSERT INTO user_profiles (user_id, share_token) 
            VALUES ($1, $2)
            ON CONFLICT (user_id) 
            DO UPDATE SET share_token = $2
            RETURNING user_id, share_token
        `, [userId, shareToken]);
        
        console.error(`[Share Link] Step 5: UPSERT completed. Rows affected: ${result.rowCount}`);
        console.error(`[Share Link] Step 6: Returned data:`, result.rows[0]);

        console.error(`[Share Link] Step 7: Successfully saved token for user ${userId}`);
        console.error("=== SHARE LINK SUCCESS ===\n");
        res.json({ shareToken });
    } catch (err) {
        console.error("\n=== SHARE LINK ERROR ===");
        console.error("[Share Link] Error type:", err.name);
        console.error("[Share Link] Error message:", err.message);
        console.error("[Share Link] Full error:", err);
        console.error("=== END ERROR ===\n");
        res.status(500).json({ message: "Failed to generate share link", error: err.message });
    }
});

app.get("/api/public/profile/:token", async (req, res) => {
    const { token } = req.params;
    console.log(`[Public Profile] Request for token: ${token}`);
    if (!token) return res.status(400).json({ message: "Token required" });

    try {
        // Fetch profile
        const profRes = await pool.query(
            "SELECT * FROM user_profiles WHERE share_token=$1",
            [token]
        );
        
        console.log(`[Public Profile] Found ${profRes.rows.length} profiles with token`);
        
        if (profRes.rows.length === 0) {
            return res.status(404).json({ message: "Profile not found or link expired" });
        }

        const profile = profRes.rows[0];
        const userId = profile.user_id;
        console.log(`[Public Profile] Loading data for user ID: ${userId}`);

        // Fetch platforms
        const platformsRes = await pool.query(
            "SELECT platform, username, stats FROM user_platforms WHERE user_id=$1",
            [userId]
        );

        // Fetch youtube stats specifically if connected
        let youtube = { connected: false };
        const ytPlatform = platformsRes.rows.find(p => p.platform === 'youtube');
        if (ytPlatform) {
            const playlistId = ytPlatform.username;
            const totalRes = await pool.query("SELECT COUNT(*) FROM youtube_videos WHERE user_id=$1 AND playlist_id=$2", [userId, playlistId]);
            const completedRes = await pool.query("SELECT COUNT(*) FROM user_video_progress WHERE user_id=$1 AND playlist_id=$2 AND completed=TRUE", [userId, playlistId]);
            const total = parseInt(totalRes.rows[0].count);
            const completed = parseInt(completedRes.rows[0].count);
            youtube = {
                connected: true,
                total,
                completed,
                progress: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        }

        // Fetch skills
        const skillsRes = await pool.query("SELECT * FROM user_skills WHERE user_id=$1", [userId]);

        console.log(`[Public Profile] Successfully loaded profile for user ${userId}`);
        res.json({
            profile: {
                full_name: profile.full_name,
                job_title: profile.job_title,
                bio: profile.bio,
                profile_pic: profile.profile_pic,
                links: profile.links,
                experience_level: profile.experience_level,
                skills: profile.skills,
                achievements: profile.achievements
            },
            platforms: platformsRes.rows,
            youtube,
            skills: skillsRes.rows
        });

    } catch (err) {
        console.error("[Public Profile] Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// TEST ENDPOINT - Remove after debugging
app.get("/api/test/share-link", async (req, res) => {
    try {
        // Get first user
        const userRes = await pool.query('SELECT id FROM users LIMIT 1');
        if (userRes.rows.length === 0) {
            return res.json({ error: 'No users in database' });
        }
        
        const userId = userRes.rows[0].id;
        const shareToken = (await import('crypto')).randomBytes(16).toString('hex');
        
        console.log(`[TEST] Generating share link for user ${userId}`);
        console.log(`[TEST] Token: ${shareToken}`);
        
        // Try UPSERT
        await pool.query(`
            INSERT INTO user_profiles (user_id, share_token) 
            VALUES ($1, $2)
            ON CONFLICT (user_id) 
            DO UPDATE SET share_token = $2
        `, [userId, shareToken]);
        
        console.log(`[TEST] UPSERT completed`);
        
        // Verify
        const check = await pool.query(
            'SELECT share_token FROM user_profiles WHERE user_id=$1',
            [userId]
        );
        
        const publicUrl = `http://localhost:5173/share/${shareToken}`;
        
        res.json({
            success: true,
            userId,
            shareToken,
            savedToken: check.rows[0]?.share_token,
            tokensMatch: check.rows[0]?.share_token === shareToken,
            publicUrl,
            testUrl: `http://localhost:5001/api/public/profile/${shareToken}`
        });
    } catch (err) {
        console.error('[TEST] Error:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

app.post("/api/udemy/update-stats", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;
        const { stats } = req.body;

        await pool.query(
            `UPDATE user_platforms 
             SET stats=$1, last_updated=NOW() 
             WHERE user_id=$2 AND platform='udemy'`,
            [JSON.stringify(stats), userId]
        );

        res.json({ message: "Udemy stats updated successfully" });
    } catch (err) {
        console.error("Udemy Update Error:", err);
        res.status(500).json({ message: "Failed to update Udemy stats" });
    }
});

// Alias for /api/user/platforms to /api/platform/connect
app.post("/api/user/platforms", async (req, res) => {
    // Redirect to connect endpoint
    req.url = "/api/platform/connect";
    app._router.handle(req, res);
});

/* ================= DASHBOARD STATS ================= */
/* ================= DASHBOARD STATS ================= */
app.get("/api/dashboard/stats", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
         const decoded = jwt.verify(token, JWT_SECRET);
         const userId = decoded.id;

         const platformsRes = await pool.query(
             "SELECT platform, username, stats FROM user_platforms WHERE user_id=$1",
             [userId]
         );
         
         let youtubeProgress = 0;
         let youtubeTotal = 0;
         let youtubeCompleted = 0;
         
         // Quiz stats
         let totalQuizzes = 0;
         let completedQuizzes = 0;
         let avgQuizScore = 0;
         let certificate = null;
         
         const ytPlatform = platformsRes.rows.find(p => p.platform === 'youtube');
         if (ytPlatform) {
             const playlistId = ytPlatform.username;
             
             // Video Stats
             const totalRes = await pool.query(
                 "SELECT COUNT(*) FROM youtube_videos WHERE user_id=$1 AND playlist_id=$2",
                 [userId, playlistId]
             );
             youtubeTotal = parseInt(totalRes.rows[0].count);
             
             const completedRes = await pool.query(
                 "SELECT COUNT(*) FROM user_video_progress WHERE user_id=$1 AND playlist_id=$2 AND completed=TRUE",
                 [userId, playlistId]
             );
             youtubeCompleted = parseInt(completedRes.rows[0].count);
             
             if (youtubeTotal > 0) {
                 youtubeProgress = Math.round((youtubeCompleted / youtubeTotal) * 100);
             }
             
             // Quiz Stats
             // We count how many videos have a non-null quiz_mark
             const quizRes = await pool.query(
                 "SELECT count(*) as count, avg(quiz_mark) as avg_score FROM user_video_progress WHERE user_id=$1 AND playlist_id=$2 AND quiz_mark IS NOT NULL",
                 [userId, playlistId]
             );
             
             completedQuizzes = parseInt(quizRes.rows[0].count || 0);
             totalQuizzes = youtubeTotal; // Assuming 1 quiz per video
             avgQuizScore = parseFloat(quizRes.rows[0].avg_score || 0).toFixed(1);
             
             // Check Certificate
             const certRes = await pool.query(
                "SELECT * FROM user_certificates WHERE user_id=$1 AND playlist_id=$2",
                [userId, playlistId]
             );
             if (certRes.rows.length > 0) {
                 certificate = certRes.rows[0];
             }
         }

         const skillsRes = await pool.query("SELECT * FROM user_skills WHERE user_id=$1", [userId]);
         
         // Fetch Profile Pic
         const profileRes = await pool.query("SELECT profile_pic FROM user_profiles WHERE user_id=$1", [userId]);
         const userPic = profileRes.rows[0]?.profile_pic || null;

         res.json({
             platforms: platformsRes.rows,
             userPic, // Send back userPic
             youtube: {
                 connected: !!ytPlatform,
                 progress: youtubeProgress,
                 completed: youtubeCompleted,
                 total: youtubeTotal,
                 playlistId: ytPlatform?.username,
                 quizStats: {
                     total: totalQuizzes,
                     completed: completedQuizzes,
                     averageScore: avgQuizScore
                 },
                 certificate
             },
             skills: skillsRes.rows
         });

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ message: "Server error fetching stats" });
    }
});

/* ================= LEGACY / UTILS ================= */
// Keep existing endpoints if needed for specific pages

app.post("/api/user/video-progress", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded= jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const { videoId, playlistId, progress, completed, quizMark } = req.body;
    if (!videoId) return res.status(400).json({ message: "Missing data" });

    const existing = await pool.query(
      "SELECT * FROM user_video_progress WHERE user_id=$1 AND video_id=$2",
      [userId, videoId]
    );

    if (existing.rows.length > 0) {
      // Only update fields that are provided
      let updateQuery = "UPDATE user_video_progress SET updated_at=NOW()";
      const params = [];
      let paramIndex = 1;

      if (progress !== undefined) {
         updateQuery += `, progress=$${paramIndex++}`;
         params.push(progress);
      }
      if (completed !== undefined) {
          updateQuery += `, completed=$${paramIndex++}`;
          params.push(completed);
      }
      if (quizMark !== undefined) {
          updateQuery += `, quiz_mark=$${paramIndex++}`;
          params.push(quizMark);
      }
      
      updateQuery += ` WHERE user_id=$${paramIndex++} AND video_id=$${paramIndex}`;
      params.push(userId, videoId);

      await pool.query(updateQuery, params);
      
    } else {
      await pool.query(
        `INSERT INTO user_video_progress (user_id, video_id, playlist_id, progress, completed, quiz_mark, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, videoId, playlistId, progress || 0, completed || false, quizMark !== undefined ? quizMark : null]
      );
    }
    res.json({ message: "Saved" });
  } catch (err) { 
      console.error("Progress Error", err);
      res.status(500).json({ message: "Error" }); 
  }
});

app.get("/api/youtube/user-videos", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      const { playlistId } = req.query;
      const result = await pool.query(
        `SELECT v.video_id as "videoId", v.title, v.thumbnail, COALESCE(p.progress, 0) AS progress, COALESCE(p.completed, false) AS completed
         FROM youtube_videos v LEFT JOIN user_video_progress p ON v.video_id = p.video_id AND p.user_id=$1
         WHERE v.user_id=$1 AND v.playlist_id=$2 ORDER BY v.id ASC;`,
        [userId, playlistId]
      );
      res.json(result.rows);
    } catch (err) { 
        console.error("User Videos Error:", err);
        res.status(500).json({ message: "Error fetching user videos", error: err.message }); 
    }
});

app.post("/api/user/skills", async (req, res) => {
    const { skills } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    try {
      const decoded= jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;

      // 1. Fetch existing skills
      const existingRes = await pool.query("SELECT skill FROM user_skills WHERE user_id=$1", [userId]);
      const existingSkills = existingRes.rows.map(r => r.skill);

      // 2. Identify skills to add and remove
      const toAdd = skills.filter(s => !existingSkills.includes(s));
      const toRemove = existingSkills.filter(s => !skills.includes(s));

      // 3. Remove deselected skills
      if (toRemove.length > 0) {
          // Use ANY for array handling in Postgres
          await pool.query("DELETE FROM user_skills WHERE user_id=$1 AND skill = ANY($2::text[])", [userId, toRemove]);
      }

      // 4. Add new skills
      for (const skill of toAdd) {
        await pool.query(
          "INSERT INTO user_skills (user_id, skill, progress, created_at) VALUES ($1, $2, $3, NOW())",
          [userId, skill, 0]
        );
      }

      res.json({ message: "Skills updated successfully" });
    } catch (err) { 
        console.error("Skill Sync Error:", err);
        res.status(500).json({ message: "Error updating skills" }); 
    }
});

app.post("/api/user/skills/score", async (req, res) => {
    const { skills, score } = req.body; // Expecting skills array and score
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    if (!skills || typeof score !== 'number') {
        return res.status(400).json({ message: "Missing skills or score" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        // Update progress/score for the matched specific skills
        // We use the score as 'progress' here as per user request to display marks in dashboard
        await pool.query(
            "UPDATE user_skills SET progress=$1 WHERE user_id=$2 AND skill = ANY($3::text[])",
            [score, userId, skills]
        );

        res.json({ message: "Assessment score saved" });
    } catch (err) {
        console.error("Score Save Error:", err);
        res.status(500).json({ message: "Error saving score" });
    }
});

app.get("/api/user/skills", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      const result = await pool.query("SELECT * FROM user_skills WHERE user_id=$1", [userId]);
      res.json(result.rows);
    } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.get("/api/user/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const result = await pool.query("SELECT * FROM user_profiles WHERE user_id=$1", [userId]);
    res.json(result.rows[0] || {});
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.post("/api/user/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const { 
      bio, job_title, profile_pic, links, 
      full_name, profile_type, experience_level,
      college_name, degree, branch, year_of_study, expected_graduation_year,
      company_name, current_role, years_of_experience,
      skills, goals, platforms, preferences, achievements, privacy
    } = req.body;

    await pool.query(
      `INSERT INTO user_profiles (
        user_id, bio, job_title, profile_pic, links, 
        full_name, profile_type, experience_level,
        college_name, degree, branch, year_of_study, expected_graduation_year,
        company_name, "current_role", years_of_experience,
        skills, goals, platforms, preferences, achievements, privacy
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
       ON CONFLICT (user_id) DO UPDATE 
       SET bio=$2, job_title=$3, profile_pic=$4, links=$5,
           full_name=$6, profile_type=$7, experience_level=$8,
           college_name=$9, degree=$10, branch=$11, year_of_study=$12, expected_graduation_year=$13,
           company_name=$14, "current_role"=$15, years_of_experience=$16,
           skills=$17, goals=$18, platforms=$19, preferences=$20, achievements=$21, privacy=$22`,
      [
        userId, bio, job_title, profile_pic, JSON.stringify(links),
        full_name, profile_type, experience_level,
        college_name, degree, branch, year_of_study, expected_graduation_year,
        company_name, current_role, years_of_experience,
        JSON.stringify(skills), JSON.stringify(goals), JSON.stringify(platforms),
        JSON.stringify(preferences), JSON.stringify(achievements), JSON.stringify(privacy)
      ]
    );
    res.json({ message: "Profile updated" });
  } catch (err) { 
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Error updating profile" }); 
  }
});

app.post("/api/user/upload-photo", upload.single("photo"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ url });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
