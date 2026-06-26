CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255),
  password VARCHAR(255),
  role VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS places (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  latitude DOUBLE,
  longitude DOUBLE,
  type VARCHAR(100)
);

INSERT IGNORE INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin');
