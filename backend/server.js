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
import fs from "fs";
const app = express();
app.use(cors());
app.use(bodyParser.json());
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const PORT = process.env.PORT || 5000;
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

// AI Routes
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
        updated_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, video_id)
      );
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
        "privacy JSONB DEFAULT '{\"public\": true, \"social\": true, \"stats\": true}'"
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
      auth: "AIzaSyDHY0ItzhiusMH59iy-gtHtYVoGwkGu5Po", // Restored Key
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
          auth: "AIzaSyDHY0ItzhiusMH59iy-gtHtYVoGwkGu5Po", // Restored Key
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
             stats = { courses_completed: 6, in_progress: 1 };
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

// Alias for /api/user/platforms to /api/platform/connect
app.post("/api/user/platforms", async (req, res) => {
    // Redirect to connect endpoint
    req.url = "/api/platform/connect";
    app._router.handle(req, res);
});

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
         
         const ytPlatform = platformsRes.rows.find(p => p.platform === 'youtube');
         if (ytPlatform) {
             const playlistId = ytPlatform.username;
             
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
         }

         const skillsRes = await pool.query("SELECT * FROM user_skills WHERE user_id=$1", [userId]);

         res.json({
             platforms: platformsRes.rows,
             youtube: {
                 connected: !!ytPlatform,
                 progress: youtubeProgress,
                 completed: youtubeCompleted,
                 total: youtubeTotal,
                 playlistId: ytPlatform?.username
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
    const { videoId, playlistId, progress, completed } = req.body;
    if (!videoId) return res.status(400).json({ message: "Missing data" });

    const existing = await pool.query(
      "SELECT * FROM user_video_progress WHERE user_id=$1 AND video_id=$2",
      [userId, videoId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE user_video_progress SET progress=$1, completed=$2, updated_at=NOW() WHERE user_id=$3 AND video_id=$4`,
        [progress, completed, userId, videoId]
      );
    } else {
      await pool.query(
        `INSERT INTO user_video_progress (user_id, video_id, playlist_id, progress, completed, updated_at) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, videoId, playlistId, progress, completed]
      );
    }
    res.json({ message: "Saved" });
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.get("/api/youtube/user-videos", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      const { playlistId } = req.query;
      const result = await pool.query(
        `SELECT v.video_id, v.title, v.thumbnail, COALESCE(p.progress, 0) AS progress, COALESCE(p.completed, false) AS completed
         FROM youtube_videos v LEFT JOIN user_video_progress p ON v.video_id = p.video_id AND p.user_id=$1
         WHERE v.user_id=$1 AND v.playlist_id=$2`,
        [userId, playlistId]
      );
      res.json(result.rows);
    } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.post("/api/user/skills", async (req, res) => {
    const { skills } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    try {
      const decoded= jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      await pool.query("DELETE FROM user_skills WHERE user_id=$1", [userId]);
      for (const skill of skills) {
        await pool.query(
          "INSERT INTO user_skills (user_id, skill, progress, created_at) VALUES ($1, $2, $3, NOW())",
          [userId, skill, 0]
        );
      }
      res.json({ message: "Skills saved" });
    } catch (err) { res.status(500).json({ message: "Error" }); }
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
  const url = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
