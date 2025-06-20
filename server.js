//we are initialising/starting our server

//importing express
const express=require ("express");
//initialising express so that we can use it in our application
const app=express();
// Middleware to parse JSON
app.use(express.json());
require("dotenv").config();
//port in which application is running
const port=process.env.PORT;



// ✅ Serve static HTML, CSS, JS
app.use(express.static("public"));

//to use routes
// All mpesa routes will now be under /api
const mpesaRoutes=require("./routes/mpesa");
app.use("/api/mpesa", mpesaRoutes); 




// starts the server and listens on the defined port
app.listen(port,()=>{
    console.log(`The application is running on port ${port}`);
});

