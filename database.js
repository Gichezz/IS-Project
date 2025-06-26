let mysql = require("mysql2");

let db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "admin",
    port: 3306,
    database: "skillswap_db" 
});




db.connect(function (err) {
    if (err) throw err;
    console.log("CONNECTED TO SQL SERVER SUCCESSFULLY");

   // db.query(createTable, function (err) {
   //     if (err) throw err;
   //     console.log("MPESA TABLE CREATED SUCCESSFULLY");
   // });


   let createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id VARCHAR(50),
        sender_id VARCHAR(50),
        text TEXT,
        time_sent DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`;

db.query(createMessagesTable, (err) => {
    if (err) throw err;
    console.log("Messages table created or exists.");
});


let userTable=`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'expert') DEFAULT 'expert',
    skills TEXT,             -- For experts only
    description TEXT,        -- For experts only
    files TEXT,              -- For experts only
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

)`;
db.query(userTable, (err) => {
    if (err) throw err;
    console.log("User table created or exists.");
});

});





module.exports = db;
