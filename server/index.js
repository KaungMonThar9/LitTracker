import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "db.js";

dotenv.config();

var app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/media-list", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        media_type,
        external_source,
        external_id,
        title,
        image_url,
        release_date,
        rating
      FROM media_items
      ORDER BY title ASC
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
  res.status(201).json(result.rows[0]);
});

app.listen(PORT);
