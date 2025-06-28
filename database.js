const mysql = require("mysql2/promise")

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "admin",
  database: "skillswap_db",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
db.getConnection()
  .then(conn => {
    console.log("Connected to MySQL server");
    conn.release();

  })
  .catch(err => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });


module.exports = db;
