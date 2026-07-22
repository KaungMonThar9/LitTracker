import db from "../db.js";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { user_id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing registration fields" });
    }

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
    RETURNING id, name, email
    `;
    const result = await db.query(queryText, queryValues);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/login-check", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing login fields" });
    }

    const queryText = `SELECT id, email, password_hash FROM users
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
      const token = createToken(user);
      return res.status(200).json({
        message: "Welcome!",
        token: token,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

export default router;
