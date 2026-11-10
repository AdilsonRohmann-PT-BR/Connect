
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const supabase = require("./config/supabase");





const app = express();
const PORT = process.env.PORT || 3000;

// Configurações
app.use(cors());
app.use(express.json());

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
app.listen(PORT, () => {
    console.log(`Connect rodando na porta ${PORT}`);
});