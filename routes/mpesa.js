// importing express router
const express=require("express");
const router=express.Router();
const path = require("path");



//import controller methods from mpesaController.js
const mpesa= {
    mpesaPassword,
    token,
    stkPush,
    mpesaCallback,
    checkPaymentStatus
}=require("../controllers/mpesaController");



// welcome page
router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/home.html")); // Optional: serve your landing HTML
});


//route to generate M-Pesa password
router.get("/password" , mpesaPassword);

router.get("/payment-status/:checkoutID", checkPaymentStatus); 
//route to initiate STK push but requires token first)
router.post("/stk/push",token,stkPush);
router.post('/stk/callback', mpesa.mpesaCallback);    // for /api/mpesa/stk/callback





//to allow us to use the router in the server.js file
module.exports=router;