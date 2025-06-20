//to use in routes-everytime we vist routes we call a certain controller to handle request
//to access variables in env file
require("dotenv").config();
//to get current time
const dateTime=require("node-datetime");
// to make HTTP requests to Safaricom Authentication Endpouint to get token to trigger stk push
const axios=require("axios");
// Temp store for status (better to use DB in production)
const paymentStatusMap = new Map();
// In-memory map to prevent duplicate payments (temporary lock)
const pendingPayments = new Map();

exports.paymentStatusMap = paymentStatusMap; 




//to access Mpesa cred in env file
const passkey=process.env.PASSKEY;
const shortcode=process.env.SHORTCODE;
const consumerKey = process.env.CONSUMERKEY;
const consumerSecret = process.env.CONSUMERSECRET;


//method to generate password
const newPassword=()=>{
    //get current time and date
    const dt=dateTime.create();
    //change to required format
    const timestamp=dt.format("YmdHMS");
    //generate password
    const password=shortcode+passkey+timestamp;
    //hash password
    const base64Password=Buffer.from(password).toString("base64");

    return { password: base64Password, timestamp };


};

// ===================== 1. Generate Access Token =====================
exports.token = (req, res, next) => {
    const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    // prepare Basic Auth header
    const auth = "Basic " + Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");


    axios.get(url, {
        headers: {
            Authorization: auth,
        },
    })
    .then(response => {
        //gett access token 
        let data =response.data;
       // extract access token from response
        let access_token=data.access_token;
         console.log("✅ Access Token Generated");
         // attach it to request
        req.access_token=access_token;
        // move to the next function (stkPush)
        next();
    })
    .catch(error =>  {
        console.error("Authorization Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Token generation failed" });
    });
};

// ===================== 2. Testing: Return Password =====================
exports.mpesaPassword=(req,res)=>{
    res.json({
    password:newPassword(),
    message:"MPESA PASSWORD GENERATED SUCCESSFULLY"
    })
};

// ===================== 3. Initiate STK Push =====================
exports.stkPush = async (req, res) => {
    const { phone, amount, service } = req.body;

    // ✅ Check for duplicate STK push
    if (pendingPayments.has(phone)) {
        return res.status(400).json({
            success: false,
            message: "Payment already in progress for this number. Please complete it first.",
        });
    }

    // ✅ Lock this phone number
    pendingPayments.set(phone, true);

    try {
        // Step 1: Generate password and timestamp
        const { password, timestamp } = newPassword();

        // Step 2: Create STK push payload
        const stkPushRequest = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phone,
            PartyB: shortcode,
            PhoneNumber: phone,
            CallBackURL: process.env.CALLBACK_URL,
            AccountReference: `${service}`,
            TransactionDesc: "SkillsSwap Service Payment"
        };

        // Step 3: Send request to Safaricom
        const response = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            stkPushRequest,
            {
                headers: {
                    Authorization: `Bearer ${req.access_token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // ✅ Send success response to frontend
        console.log("✅ STK Push Sent to Phone:", phone);
        res.json({
            success: true,
            message: "STK Push sent",
            data: response.data,
        });

        

        // ✅ Optional: auto-unlock after 60sec (fallback)
        setTimeout(() => pendingPayments.delete(phone),60 * 1000);
    } catch (error) {
        console.error("STK Push Error:", error.response?.data || error.message);

        // ❌ Clean up lock if failed
        pendingPayments.delete(phone);

        res.status(500).json({
            success: false,
            message: "STK Push failed",
            error: error.message,
        });
    }
};


// Helper function to retrieve payment status
function getPaymentStatus(checkoutID) {
    const status = paymentStatusMap.get(checkoutID);
    if (!status) {
        return { found: false };
    }
    return { found: true, ...status };
}

// ===================== 4. Check Payment Status =====================
exports.checkPaymentStatus = async (req, res) => {
    const checkoutID = req.params.checkoutID;
    const status = await getPaymentStatus(checkoutID); // Your DB logic

    if (status.found && status.phone) {
        pendingPayments.delete(status.phone); // ✅ Unlock the number
    }

    res.json(status);
};



// M-Pesa(Safaricom) callback 
exports.mpesaCallback = (req, res) => {
    const db = require("../database");
    const formatDateTime = require("../formatDateTime");

    console.log(" Callback received");
    console.log("📥 Raw body:", JSON.stringify(req.body, null, 2));

    const callback = req.body.Body.stkCallback;
    const checkoutRequestID = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;
    const resultDesc = callback.ResultDesc;

    console.log("🧾 CheckoutRequestID:", checkoutRequestID);
    console.log("🧾 Result Code:", resultCode);
    console.log("🧾 Result Description:", resultDesc);

    let phone = "Unknown";

    if (resultCode === 0) {
        const metadata = callback.CallbackMetadata.Item;
        phone = metadata.find(i => i.Name === 'PhoneNumber')?.Value || "Unknown";

        // Save status for frontend
        paymentStatusMap.set(checkoutRequestID, {
            status: "success",
            message: resultDesc,
            phone: phone
        });

        // Extract payment details
        const amount = metadata.find(i => i.Name === 'Amount')?.Value || 0;
        const mpesa_code = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value || "Unknown";
        const transaction_date = metadata.find(i => i.Name === 'TransactionDate')?.Value || "";
        const formattedDate = formatDateTime(transaction_date);
        const accountRef = callback.AccountReference || 'Unknown';
        const [service_name] = accountRef.split(":"); // ← works if using :




        

        const sql = `
            INSERT INTO mpesa_payments
            (phone, amount, mpesa_code, transaction_date, service_name)
            VALUES (?, ?, ?, ?, ?)
        `;
        const values = [phone, amount, mpesa_code, formattedDate, service_name || 'Unknown'];

        console.log("📦 Preparing to insert into DB:");
        console.log({ phone, amount, mpesa_code, formattedDate, service_name });

        db.query(sql, values, (err) => {
            if (err) {
                console.error("❌ DB Insert Error:", err);
                return res.status(500).send("DB Insert Error");
            }

            console.log("✅ M-Pesa Payment Recorded Successfully");
            paymentStatusMap.delete(checkoutRequestID); // 🧹 Clean up the map
            res.sendStatus(200);
        });
    } else {
        paymentStatusMap.set(checkoutRequestID, {
            status: "failed",
            message: resultDesc,
            phone: phone
        });

        console.warn("⚠️ STK Push failed:", resultDesc);
        res.sendStatus(200); // Always respond 200 to Safaricom
    }
};


//Authenticate → Get an access token (OAuth).-allowed to use safaricom api
//Secure the Request → Generate password (shortcode + passkey + timestamp).-proof its a legit business
//Trigger Payment → Send STK Push using post method with token (header) + password (body).
//Customer Pays → Enters PIN on their phone (no redirects).
//Callback → Safaricom sends payment result to your CallBackURL-here is the mpesaCallback code-add the console logs and add comments to the code 