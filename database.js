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
});

module.exports = db;
