let mysql = require("mysql2");

let db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    port: 3307,
    database: "skillswap_db" 
});

db.connect(function (err) {
    if (err) throw err;
    console.log("CONNECTED TO SQL SERVER SUCCESSFULLY");

    let createTable = `
        CREATE TABLE IF NOT EXISTS mpesa_payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            phone VARCHAR(20),
            amount DECIMAL(10,2),
            mpesa_code VARCHAR(20),
            transaction_date DATETIME,
            service_name VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(createTable, function (err) {
        if (err) throw err;
        console.log("MPESA TABLE CREATED SUCCESSFULLY");
    });
});

module.exports = db;
