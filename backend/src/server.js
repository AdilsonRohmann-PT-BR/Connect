const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});

const express = require("express");
const cors = require("cors");

const conversationRoutes = require("./config/routes/conversation.routes");
const requireAuth = require("./middleware/auth.middleware");
const authRoutes = require("./config/routes/auth.routes");
const profileRoutes = require("./config/routes/profile.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações
app.use(cors());
app.use(express.json());

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/conversations", conversationRoutes);

// Usuário autenticado
app.get("/api/me", requireAuth, (req, res) => {
    res.json({
        message: "Usuário autenticado!",
        user: {
            id: req.user.id,
            email: req.user.email
        }
    });
});

// Rota inicial
app.get("/", (req, res) => {
    res.json({
        message: "Connect API funcionando!"
    });
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "online"
    });
});

// Iniciar servidor
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Connect rodando na porta ${PORT}`);
    });
}

module.exports = app;