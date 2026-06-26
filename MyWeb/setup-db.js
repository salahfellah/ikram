const mysql = require("mysql2/promise");

async function setup() {
  const conn = await mysql.createConnection({
    host: "gateway03.us-west-2.prod.aws.tidbcloud.com",
    port: 4000,
    user: "3NE8E6t8trjSkqG.root",
    password: "hA1K2gCG3TBgQWGY",
    database: "geoviz_db",
    ssl: {},
  });

  await conn.execute(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    password VARCHAR(255),
    role VARCHAR(50)
  )`);

  await conn.execute(`CREATE TABLE IF NOT EXISTS places (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    latitude DOUBLE,
    longitude DOUBLE,
    type VARCHAR(100)
  )`);

  await conn.execute(`INSERT IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, ["admin", "admin123", "admin"]);

  console.log("Tables created and admin user inserted!");
  const [rows] = await conn.execute("SELECT * FROM users");
  console.log("Users:", rows);
  await conn.end();
}

setup().catch(e => console.error(e));
