const express = require("express");
const path = require('path');
const authRoutes = require('./routes/auth');

//initialising express so that we can use it in our application
const app = express();

// Middleware to parse JSON and URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
require("dotenv").config();


// Static folders
app.use('/allcss', express.static(path.join(__dirname, 'allcss')));
app.use('/alljs', express.static(path.join(__dirname, 'alljs')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

//port in which application is running
const port=process.env.PORT;


// Routes
app.use('/', authRoutes);

// All mpesa routes will now be under /api
const mpesaRoutes = require("./routes/mpesa");
app.use("/api/mpesa", mpesaRoutes); 


// starts the server and listens on the defined port
app.listen(port,()=>{
    console.log(`The application is running on port ${port}`);
});
