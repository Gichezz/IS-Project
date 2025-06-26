// ===================== Required Modules =====================

// Load environment variables
require("dotenv").config();
const dateTime = require("node-datetime"); // For timestamp generation
const axios = require("axios"); // For making HTTP requests to Safaricom
const sendEmail = require("../sendEmail"); // Custom email module

// ===================== In-Memory Temp Stores =====================
const paymentStatusMap = new Map(); // Temporarily store payment statuses
const pendingPayments = new Map();  // Prevent duplicate STK pushes
exports.paymentStatusMap = paymentStatusMap;

// ===================== MPESA Credentials from .env =====================
const passkey = process.env.PASSKEY;
const shortcode = process.env.SHORTCODE;
const consumerKey = process.env.CONSUMERKEY;
const consumerSecret = process.env.CONSUMERSECRET;

// ===================== Password Generator =====================
const newPassword = () => {
    const dt = dateTime.create();
    const timestamp = dt.format("YmdHMS");
    const password = shortcode + passkey + timestamp;
    const base64Password = Buffer.from(password).toString("base64");
    return { password: base64Password, timestamp };
};

// ===================== 1. Generate Access Token =====================
exports.token = (req, res, next) => {
    const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    const auth = "Basic " + Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    axios.get(url, { headers: { Authorization: auth } })
        .then(response => {
            req.access_token = response.data.access_token;
            console.log("Access Token Generated");
            next();
        })
        .catch(error => {
            console.error("Authorization Error:", error.response?.data || error.message);
            res.status(500).json({ success: false, message: "Token generation failed" });
        });
};

// ===================== 2. Testing: Return Password =====================
exports.mpesaPassword = (req, res) => {
    res.json({
        password: newPassword(),
        message: "MPESA PASSWORD GENERATED SUCCESSFULLY"
    });
};

// ===================== 3. Initiate STK Push =====================
exports.stkPush = async (req, res) => {
    const { phone, amount, service } = req.body;

    // Prevent duplicate requests
    if (pendingPayments.has(phone)) {
        return res.status(400).json({
            success: false,
            message: "Payment already in progress for this number."
        });
    }

    pendingPayments.set(phone, true);

    try {
        const { password, timestamp } = newPassword();

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
            AccountReference: service,
            TransactionDesc: `${service}:SkillSwap Service Payment`
        };

        const response = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            stkPushRequest,
            {
                headers: {
                    Authorization: `Bearer ${req.access_token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const checkoutID = response.data.CheckoutRequestID;
        console.log("STK Push Sent to Phone:", phone);
        console.log("🆔 Tracking CheckoutRequestID:", checkoutID);

        paymentStatusMap.set(checkoutID, {
            phone,
            service,
            status: "pending"
        });

        res.json({
            success: true,
            message: "STK Push sent",
            data: response.data
        });

        setTimeout(() => pendingPayments.delete(phone), 10 * 1000);
    } catch (error) {
        console.error("STK Push Error:", error.response?.data || error.message);
        pendingPayments.delete(phone);
        res.status(500).json({ success: false, message: "STK Push failed", error: error.message });
    }
};

// ===================== 4. Check Payment Status =====================
function getPaymentStatus(checkoutID) {
    const status = paymentStatusMap.get(checkoutID);
    return status ? { found: true, ...status } : { found: false };
}

exports.checkPaymentStatus = async (req, res) => {
    const checkoutID = req.params.checkoutID;
    const status = await getPaymentStatus(checkoutID);
    console.log("📡 Payment status check for:", checkoutID, "→", status);


    if (status.found && status.phone) {
        pendingPayments.delete(status.phone);
    }

    res.json(status);
};

// ===================== 5. M-Pesa Callback Handler =====================
exports.mpesaCallback = (req, res) => {
    const db = require("../database");
    const formatDateTime = require("../formatDateTime");

    console.log("📥 Callback received");
    console.log("📄 Raw body:", JSON.stringify(req.body, null, 2));

    const body = req.body;
    if (!body || !body.Body || !body.Body.stkCallback) {
        console.error("❌ Invalid callback format:", JSON.stringify(body, null, 2));
        return res.status(400).send("Invalid callback format");
    }

    const callback = body.Body.stkCallback;
    const checkoutRequestID = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;
    const resultDesc = callback.ResultDesc;

    console.log("🧾 CheckoutRequestID:", checkoutRequestID);
    console.log("🔄 Result Code:", resultCode);
    console.log("📜 Result Description:", resultDesc);

    let phone = "Unknown";

    if (resultCode === 0) {
        const metadata = callback.CallbackMetadata.Item;
        phone = metadata.find(i => i.Name === 'PhoneNumber')?.Value || "Unknown";

        const previousData = paymentStatusMap.get(checkoutRequestID) || {};
        paymentStatusMap.set(checkoutRequestID, {
            ...previousData,
            status: "success",
            message: resultDesc,
            phone: phone
        });

        const amount = metadata.find(i => i.Name === 'Amount')?.Value || 0;
        const mpesa_code = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value || "Unknown";
        const transaction_date = metadata.find(i => i.Name === 'TransactionDate')?.Value || "";
        const formattedDate = formatDateTime(transaction_date);
        const tempData = paymentStatusMap.get(checkoutRequestID);
        const service_name = tempData?.service || callback.AccountReference || 'Unknown';

        const sql = `INSERT INTO mpesa_payments (phone, amount, mpesa_code, transaction_date, service_name) VALUES (?, ?, ?, ?, ?)`;
        const values = [phone, amount, mpesa_code, formattedDate, service_name];

        console.log("💾 Inserting to DB:", { phone, amount, mpesa_code, formattedDate, service_name });

        db.query(sql, values, (err) => {
            if (err) {
                console.error("❌ DB Insert Error:", err);
                return res.status(500).send("DB Insert Error");
            }

            console.log("✅ M-Pesa Payment Recorded Successfully");
            // Delay cleanup to give frontend time to poll
setTimeout(() => {
    paymentStatusMap.delete(checkoutRequestID);
    console.log("🧹 Cleaned up payment status for", checkoutRequestID);
}, 20 * 1000); // 20 seconds

res.sendStatus(200); // Respond to Safaricom right away


            const tutorQuery = `SELECT email FROM users WHERE role = 'expert' AND skills LIKE ? LIMIT 1`;
            db.query(tutorQuery, [`%${service_name}%`], async (err, result) => {
                if (err) {
                    console.error("❌ Tutor Email Fetch Error:", err);
                } else if (result.length > 0) {
                    const tutorEmail = result[0].email;
                    const emailText = `Hello Tutor,\n\nA Student has made payment for your service: \"${service_name}\".\n\nAccept the session to begin tutoring.\n\nRegards,\nSkillSwap Team`;
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
        console.log("📦 Full Callback Payload:", JSON.stringify(callback, null, 2));

        res.sendStatus(200); // Always respond 200 to Safaricom
    }
};
