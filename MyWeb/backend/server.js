const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken"); // 🔹 NEW: Import JWT
const app = express();

// 🔹 NEW: Secret key for signing tokens (Change this in production!)
const JWT_SECRET = "your_super_secret_key_change_this_in_production"; 

// middlewares
app.use(cors());
app.use(express.json());

// 🔹 الاتصال بقاعدة البيانات
const db = mysql.createConnection({
  host: "localhost",
  user: "root",      
  password: "",      
  database: "geoviz_db",
  port: 3307
});

// 🔹 اختبار الاتصال
db.connect((err) => {
  if (err) {
    console.log(" Error connecting to database:", err);
  } else {
    console.log(" Connected to MySQL database");
  }
});

// 🔹 NEW: Middleware to verify the token
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user info to the request
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
}

// 🔹 NEW: Middleware to check if the user is an admin
function requireAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Admin access required" });
    }
    next();
}

// 🔒 PROTECTED: Only authenticated admins can add places
app.post("/add-place", requireAuth, requireAdmin, (req, res) => {
  const { name, description, latitude, longitude, type } = req.body;

  // تحقق بسيط
  if (!name || !latitude || !longitude) {
    return res.status(400).json({ error: "Missing data" });
  }

  const sql = `
  INSERT INTO places (name, description, latitude, longitude, type)
  VALUES (?, ?, ?, ?, ?)
`;
  db.query(sql, [name, description, latitude, longitude, type], (err, result) => {
    if (err) {
      console.log("❌ Insert error:", err);
      return res.status(500).json(err);
    }

    res.json({
      message: "✅ Place added successfully",
      id: result.insertId
    });
  });
});

app.get("/places", (req, res) => {
  const sql = "SELECT * FROM places";

  db.query(sql, (err, result) => {
    if (err) {
      console.log(" Fetch error:", err);
      return res.status(500).json(err);
    }

    res.json(result);
  });
});
 
app.post("/login", (req, res) => {
    console.log("LOGIN WORKS");
    console.log(req.body);

    const { username, password } = req.body;

    const sql = `
        SELECT * FROM users
        WHERE username = ? AND password = ?
    `;

    db.query(sql, [username, password], (err, result) => {
        if(err){
            console.log(err);
            return res.status(500).json(err);
        }

        console.log(result);

        if(result.length > 0){
            const user = result[0];

            // 🔹 NEW: Generate JWT Token
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role }, 
                JWT_SECRET,
                { expiresIn: "24h" } // Token expires in 24 hours
            );

            // 🔹 NEW: Hide password before sending user data to client
            const { password: userPass, ...safeUser } = user;

            res.json({
                success: true,
                user: safeUser,
                token: token // 🔹 Send token to client
            });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    });
});

app.use(express.static(path.join(__dirname, "..")));
const PORT = 3000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});