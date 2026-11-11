const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});



const requireAuth = require("./middleware/auth.middleware");
const express = require("express");
const cors = require("cors");

const supabase = require("./config/supabase");
const authRoutes = require("./config/routes/auth.routes");
const profileRoutes = require("./config/routes/profile.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);



app.get("/api/me", requireAuth, (req, res) => {
    res.json({
        message: "Usuário autenticado!",
        user: {
            id: req.user.id,
            email: req.user.email
        }
    });
});



// Rota inicial de teste
app.get("/", (req, res) => {
    res.json({
        message: "Connect API funcionando!"
    });
});

// Teste da API
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
