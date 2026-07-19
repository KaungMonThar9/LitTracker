import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import db from "./db.js";

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

app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const existingCheck = await db.query(
    `
    SELECT email FROM users WHERE email=$1`,
    [email],
  );

  if (existingCheck.rows.length > 0) {
    return res.status(403).json({ error: "User already exists!" });
  }
  const passwordHash = await bcrypt.hash(password, 9);
  const queryValues = [name, email, passwordHash];
  const queryText = `
  INSERT INTO users (name, email, password_hash)
  VALUES ($1, $2, $3)
  RETURNING *
  `;
  const result = await db.query(queryText, queryValues);
  res.status(201).json(result.rows[0]);
});

app.post("/api/login-check", async (req, res) => {
  const { email, password } = req.body;
  const queryText = `SELECT email, password_hash FROM users
  WHERE email = $1`;
  const result = await db.query(queryText, [email]);
  if (result.rows.length == 0) {
    return res.status(400).json({ error: "No such user exists!" });
  }
  const user = result.rows[0];
  const check = await bcrypt.compare(password, user.password_hash);
  if (check == false) {
    return res.status(400).json({ error: "Wrong password!" });
  } else {
    return res.status(200).json("Welcome!");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
