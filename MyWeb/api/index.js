const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key_change_this";

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
}

app.post("/api/add-place", requireAuth, requireAdmin, (req, res) => {
  const { name, description, latitude, longitude, type } = req.body;
  if (!name || !latitude || !longitude) {
    return res.status(400).json({ error: "Missing data" });
  }
  const sql = "INSERT INTO places (name, description, latitude, longitude, type) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [name, description, latitude, longitude, type], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Place added successfully", id: result.insertId });
  });
});

app.get("/api/places", (req, res) => {
  db.query("SELECT * FROM places", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
  db.query(sql, [username, password], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length > 0) {
      const user = result[0];
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
      const { password: _, ...safeUser } = user;
      res.json({ success: true, user: safeUser, token });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });
});

module.exports = app;
