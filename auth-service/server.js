// server.js
require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(express.json());

// Définition des routes
// Chaque route de authRoutes sera préfixée par '/api/auth'
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Service d'authentification démarré sur le port ${PORT}`);
});
