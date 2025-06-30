const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Sends an email with optional HTML support
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content (for fallback)
 * @param {string} html - HTML content (optional)
 */

const sendEmail = async (to, subject, text, html) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
    };

    if (html) {
        mailOptions.html = html;
    }

    try {
        await transporter.sendMail(mailOptions);
        console.log(" Email sent to:", to);
    } catch (error) {
        console.error(" Email sending failed:", error.message);
    }
};

module.exports = sendEmail;
