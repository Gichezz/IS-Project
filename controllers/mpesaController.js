// ===================== Required Modules =====================

//to access variables in env file
require("dotenv").config();
//to get current time
const dateTime=require("node-datetime");
// to make HTTP requests to Safaricom Authentication Endpouint to get token to trigger stk push
const axios=require("axios");
// Custom module to send email
const sendEmail = require("../sendEmail"); 

// ===================== In-Memory Temp Stores =====================
const paymentStatusMap = new Map(); // Store payment status temporarily
const pendingPayments = new Map();  // Prevent duplicate STK pushes

exports.paymentStatusMap = paymentStatusMap; 




// ===================== MPESA Credentials from .env =====================
const passkey=process.env.PASSKEY;
const shortcode=process.env.SHORTCODE;
const consumerKey = process.env.CONSUMERKEY;
const consumerSecret = process.env.CONSUMERSECRET;


// ===================== Password Generator =====================
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
         console.log("Access Token Generated");
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

    //Check for duplicate STK push
    if (pendingPayments.has(phone)) {
        return res.status(400).json({
            success: false,
            message: "Payment already in progress for this number. Please complete it first.",
        });
    }

    //Lock this phone number
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
            AccountReference: service,                      // ✅ Just the skill name
TransactionDesc: `${service}:SkillSwap Service Payment`,       // Optional extra info

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

        

        //Send success response to frontend
        console.log("STK Push Sent to Phone:", phone);

        //  NEW: Save Checkout ID + service name for callback to access later
        const checkoutID = response.data.CheckoutRequestID;
        paymentStatusMap.set(checkoutID, {
            phone,
            service,
            status: "pending"
        });
        res.json({
            success: true,
            message: "STK Push sent",
            data: response.data,
        });
console.log("🆔 Tracking CheckoutRequestID:", checkoutID);

        

        // auto-unlock after 10sec (fallback)
        setTimeout(() => pendingPayments.delete(phone),10 * 1000);
    } catch (error) {
        console.error("STK Push Error:", error.response?.data || error.message);

        //  Clean up lock if failed
        pendingPayments.delete(phone);

        res.status(500).json({
            success: false,
            message: "STK Push failed",
            error: error.message,
        });
    }
};


// ===================== 4. Check Payment Status (used by frontend) =====================
function getPaymentStatus(checkoutID) {
    const status = paymentStatusMap.get(checkoutID);
    if (!status) {
        return { found: false };
    }
    return { found: true, ...status };
}

exports.checkPaymentStatus = async (req, res) => {
    const checkoutID = req.params.checkoutID;
    const status = await getPaymentStatus(checkoutID); // Your DB logic

    if (status.found && status.phone) {
        pendingPayments.delete(status.phone); //  Unlock the number
    }

    res.json(status);
};



// M-Pesa(Safaricom) callback 
exports.mpesaCallback = (req, res) => {
    const db = require("../database");
    const formatDateTime = require("../formatDateTime");


    
    console.log("📥 Callback received");
    console.log("📄 Raw body:", JSON.stringify(req.body, null, 2));

    

    const callback = req.body.Body.stkCallback;
    const checkoutRequestID = callback.CheckoutRequestID;
console.log("🧾 Callback CheckoutRequestID:", checkoutRequestID);
console.log("🧾 Exists in paymentStatusMap:", paymentStatusMap.has(checkoutRequestID));

    const resultCode = callback.ResultCode;
    const resultDesc = callback.ResultDesc;

    console.log("🧾 CheckoutRequestID:", checkoutRequestID);
    console.log("🔄 Result Code:", resultCode);
    console.log("📜 Result Description:", resultDesc);

    let phone = "Unknown";
//Only continue if the STK push was successful
    if (resultCode === 0) {
        const metadata = callback.CallbackMetadata.Item;
        phone = metadata.find(i => i.Name === 'PhoneNumber')?.Value || "Unknown";

        const previousData = paymentStatusMap.get(checkoutRequestID) || {};

paymentStatusMap.set(checkoutRequestID, {
    ...previousData, // keep phone and service
    status: "success",
    message: resultDesc,
    phone: phone // override if changed
});


        // Extract payment details
        const amount = metadata.find(i => i.Name === 'Amount')?.Value || 0;
        const mpesa_code = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value || "Unknown";
        const transaction_date = metadata.find(i => i.Name === 'TransactionDate')?.Value || "";
        const formattedDate = formatDateTime(transaction_date);
        const tempData = paymentStatusMap.get(checkoutRequestID);

if (!tempData) {
    console.warn("⚠️ No entry found in paymentStatusMap for:", checkoutRequestID);
}

const service_name = tempData?.service || 'Unknown';




        const sql = `
            INSERT INTO mpesa_payments
            (phone, amount, mpesa_code, transaction_date, service_name)
            VALUES (?, ?, ?, ?, ?)
        `;
        const values = [phone, amount, mpesa_code, formattedDate, service_name || 'Unknown'];

        console.log("💾 Inserting to DB:", { phone, amount, mpesa_code, formattedDate, service_name });

        // Save to DB
        db.query(sql, values, (err) => {
            if (err) {
                console.error("❌ DB Insert Error:", err);
                return res.status(500).send("DB Insert Error");
            }

            console.log("✅ M-Pesa Payment Recorded Successfully");

// ✅ Only send response once everything is done
                paymentStatusMap.delete(checkoutRequestID); // Clean up
                res.sendStatus(200); // Final and only response


            // 🔍 Now fetch tutor and send email
            const tutorQuery = `
                SELECT email FROM users
                WHERE role = 'expert' AND skills LIKE ?
                LIMIT 1
            `;
            db.query(tutorQuery, [`%${service_name}%`], async (err, result) => {
                if (err) {
                    console.error("❌ Tutor Email Fetch Error:", err);
                } else if (result.length > 0) {
                    const tutorEmail = result[0].email;
                    const emailText = `
Hello Tutor,

A Student has made payment for your service: "${service_name}".

Accept the session to begin tutoring.

Regards,
SkillSwap Team
                    `;
                    try {
                        await sendEmail(tutorEmail, "New Payment Received - SkillSwap", emailText);
                        console.log("📧 Email sent to:", tutorEmail);
                    } catch (e) {
                        console.error(" Email Send Error:", e.message);
                    }
                } else {
                    console.warn("⚠️ No tutor found matching service:", service_name);
                }

                
            });
        });
    } else {
        const previousData = paymentStatusMap.get(checkoutRequestID) || {};
paymentStatusMap.set(checkoutRequestID, {
    ...previousData,
    status: "failed",
    message: resultDesc,
    phone: phone
});


    console.log("❌ Payment failed or cancelled:");
    console.log("🧾 CheckoutRequestID:", checkoutRequestID);
    console.log("📞 Phone:", phone);
    console.log("📜 Result Description:", resultDesc);
    console.log("📦 Full Callback Payload:", JSON.stringify(callback,null, 2));

    res.sendStatus(200); // Always respond 200 to Safaricom
    }
};

//Authenticate → Get an access token (OAuth).-allowed to use safaricom api
//Secure the Request → Generate password (shortcode + passkey + timestamp).-proof its a legit business
//Trigger Payment → Send STK Push using post method with token (header) + password (body).
//Customer Pays → Enters PIN on their phone (no redirects).
//Callback → Safaricom sends payment result to your CallBackURL-here is the mpesaCallback code-add the console logs and add comments to the code 