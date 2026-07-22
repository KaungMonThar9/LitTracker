import express from "express";
import cors from "cors";
import db from "./db.js";
import authRoutes from "./auth/routes.js";
import jwt from "jsonwebtoken";

var app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);

app.get("/api/media-list", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user_id;
    const result = await db.query(`
      SELECT media_item
      FROM user_list_items
      WHERE user_list_items.user_id = $1
      JOIN media_items 
      ON media_items.id = user_list_items.media_item_id
      ORDER BY user_list_items.added_at DESC;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch media items" });
  }
});

app.post("/api/media-list", async (req, res) => {
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
  INSERT INTO user_list_items (user_email, media_item_id) 
  VALUES ($1, $2)
  ON CONFLICT (user_email, media_item_id) DO NOTHING`;
  await db.query(userInsertText, [userEmail, mediaItemId]);
  res.status(201).json(result.rows[0]);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
