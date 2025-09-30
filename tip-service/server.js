require("dotenv").config();
console.log("TIP_SERVICE_JWT_SECRET:", process.env.JWT_SECRET); // Added for debugging
const express = require("express");
const nodemailer = require("nodemailer");
const tipRoutes = require("./routes/tipRoutes");

const app = express();
app.use(express.json());

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

// Make transporter available to controllers
app.set('transporter', transporter);

app.use("/api/tips", tipRoutes);

const PORT = process.env.PORT || 4001; // Using a different port than auth-service

// Start the server only if this file is run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Tip service started on port ${PORT}`);
    });
}
//test
module.exports = app;