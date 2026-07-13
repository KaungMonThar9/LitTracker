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
