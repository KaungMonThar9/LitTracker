import express from "express";
import cors from "cors";
import db from "./db.js";
import authRoutes from "./auth/routes.js";
import jwt from "jsonwebtoken";
import OpenAI from "openai";
import "dotenv/config";

var app = express();
const PORT = process.env.PORT || 3001;

const client = new OpenAI();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);

app.get("/api/media-list", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing token" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user_id;
    const result = await db.query(
      `
      SELECT media_items.*
      FROM user_list_items
      JOIN media_items 
      ON media_items.id = user_list_items.media_item_id
      WHERE user_list_items.user_id = $1
      ORDER BY user_list_items.added_at DESC;
    `,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    res.status(500).json({ error: "Failed to fetch media items" });
  }
});

app.post("/api/media-list", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing token" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user_id;
    const {
      media_type,
      external_source,
      external_id,
      title,
      image_url,
      release_date,
      rating,
    } = req.body;

    if (!media_type || !external_source || !external_id || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const queryValues = [
      media_type,
      external_source,
      external_id,
      title,
      image_url,
      release_date,
      rating,
    ];

    const queryText = `
        INSERT INTO media_items (
        media_type,
        external_source,
        external_id,
        title,
        image_url,
        release_date,
        rating
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (media_type, external_source, external_id)
        DO UPDATE SET
        title = EXCLUDED.title,
        image_url = EXCLUDED.image_url,
        release_date = EXCLUDED.release_date,
        rating = EXCLUDED.rating
        RETURNING *`;
    const result = await db.query(queryText, queryValues);
    const mediaItemId = result.rows[0].id;

    const userInsertText = `
  INSERT INTO user_list_items (user_id, media_item_id) 
  VALUES ($1, $2)
  ON CONFLICT (user_id, media_item_id) DO NOTHING`;
    await db.query(userInsertText, [userId, mediaItemId]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    return res.status(500).json({ error: "Failed to add media item" });
  }
});

app.post("/api/chat-response", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing token" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userInquiry = req.body.message;
    const response = await client.responses.create({
      model: "gpt-5-mini",
      instructions:
        "You are a literature and media fanatic, with your expertise spanning all kinds of media from anime to movies to webnovels, any kind of media to exist. Reply in a cheery enthusiastic tone whenever the user asks for anything. Use bullet points when you can and keep your messages brief, as you are in a small chat window. Keep within 50 words.",
      input: userInquiry,
    });

    res.status(200).json(response.output_text);
  } catch (error) {
    console.error(error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    return res.status(500).json({ error: "Failed to get a response!" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
