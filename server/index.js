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
      SELECT media_items.*, user_list_items.status, user_list_items.score, user_list_items.progress_current, user_list_items.progress_total, user_list_items.progress_unit
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
    } else if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Session expired. Please log in again." });
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

app.patch("/api/media-list/:mediaItemId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing token" });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user_id;
    const mediaItemId = req.params.mediaItemId;
    const { status, score, progress_current } = req.body;
    const validStatuses = [
      "planned",
      "watching",
      "completed",
      "on_hold",
      "dropped",
    ];

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(mediaItemId)) {
      return res.status(400).json({ error: "Invalid media item id" });
    }
    if (
      status === undefined &&
      score === undefined &&
      progress_current === undefined
    ) {
      return res.status(400).json({ error: "No update fields provided" });
    }
    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (
      progress_current !== undefined &&
      (!Number.isInteger(progress_current) || progress_current < 1)
    ) {
      return res.status(400).json({
        error: "Progress must be a whole number starting at 1",
      });
    }
    if (
      score !== undefined &&
      score !== null &&
      (typeof score !== "number" ||
        score < 1 ||
        score > 10 ||
        score * 2 !== Math.round(score * 2))
    ) {
      return res
        .status(400)
        .json({ error: "Score must be between 1 and 10 in 0.5 increments" });
    }

    const result = await db.query(
      "UPDATE user_list_items " +
        "SET status = COALESCE($1, status), score = CASE WHEN $2::boolean THEN $3 ELSE score END, progress_current = CASE WHEN $4::boolean THEN $5 ELSE progress_current END " +
        "WHERE user_id = $6 AND media_item_id = $7 " +
        "RETURNING media_item_id, status, score, progress_current, progress_total, progress_unit",
      [
        status ?? null,
        score !== undefined,
        score ?? null,
        progress_current !== undefined,
        progress_current ?? null,
        userId,
        mediaItemId,
      ],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Media item is not in your list" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res
        .status(401)
        .json({ error: "Session expired. Please log in again." });
    }
    res.status(500).json({ error: "Failed to update list item" });
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
    const userId = decoded.user_id;
    const userInquiry = req.body.message;
    if (userInquiry === null || userInquiry === "") {
      return res.status(400).json({ error: "Message is required" });
    }
    const userInfo = await db.query(
      `
      SELECT media_items.*, user_list_items.score,
      user_list_items.status
      FROM user_list_items
      JOIN media_items
      ON media_items.id = user_list_items.media_item_id
      WHERE user_list_items.user_id = $1
      `,
      [userId],
    );
    const userInfoStr = JSON.stringify(userInfo.rows);

    const response = await client.responses.create({
      model: "gpt-5-mini",
      instructions: `You are a literature and media fanatic, with your expertise spanning all kinds of
         media from anime to movies to webnovels, any kind of media to exist. Reply in a cheery 
         enthusiastic tone whenever the user asks for anything. 
         Use bullet points when you can and keep your messages brief, 
         as you are in a small chat window. Avoid items already in user list. 
         Keep within 50 words.
         If user enters nothing or gibberish or there is not enough context,
         respond with something similar to about how youre sorry that you cant understand
         them and that theres not enough information and then give them a couple of suggestions for
         what type of questions they may like to ask
         If they ask something not related to literature, media etc (this can be a very broad scope
         do not reject if you are unsure)
         please send a message saying you are unauthorized or unfit or sth like that to handle
         these requests but that you would be glad to help with any lit media etc related ones

         At the end of each user inquiry will be appended a table results of the users entire list info 
         what theyre watching, watched what they thought of the show, the genres etc
         Ensure that information is top priority for recommendations as well
         if the user is watching a show but no rating is given, consider it a slight positive that they kinda like it etc
         if a show is just planned to watch, consider it neutral with a slight tinge of positivity
         if a user specifically asks for a specific genre recommendation, use what the users
         already watched in that genre, what they like and then search up the closest recommendations to it.
         any rating above a 5.5 is considered as the user decently liked it.
         if they didnt specify a genre, find the 3 highest net weighted genres that they usually like 
         and recommend an anime from each.
         net weighted as in use a formula to weigh the amount watched, average rating of that genre etc this will be
         left to your discretion as well
         if you feel unconfident about your response you can ask follow up questions asking users more information to
         build up what you need to recommend them 
         Use the web search tool if necessary
         Format responses using Markdown.
         Use bullet lists with hyphens when listing recommendations.
         Use bold text for titles.
         Keep paragraphs short.
         `,
      input: `User's message: ${userInquiry} 
              User's media Info: ${userInfoStr}
              `,
    });
    return res.status(200).json(response.output_text);
  } catch (error) {
    console.error(error);
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res
        .status(401)
        .json({ error: "Session expired. Please log in again." });
    }

    return res.status(500).json({ error: "Failed to get a response!" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
