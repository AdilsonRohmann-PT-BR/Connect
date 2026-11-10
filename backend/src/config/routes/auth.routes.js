const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

// Cliente isolado para cada operação de autenticação
function createAuthClient() {
    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    });
}

// CADASTRO
router.post("/register", async (req, res) => {
    try {
        const { email, password, displayName, username } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email e senha são obrigatórios."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: "A senha precisa ter pelo menos 8 caracteres."
            });
        }

        const supabase = createAuthClient();

        const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
                data: {
                    display_name: displayName || "",
                    username: username || ""
                }
            }
        });

        if (error) {
            return res.status(400).json({
                error: error.message
            });
        }

        return res.status(201).json({
            message: data.session
                ? "Conta criada com sucesso!"
                : "Conta criada! Verifique seu email.",
            user: {
                id: data.user?.id,
                email: data.user?.email
            },
            session: data.session
        });

    } catch (error) {
    console.error("ERRO NO CADASTRO:", error);

    return res.status(500).json({
        error: "Erro interno ao cadastrar usuário."
    });
}
    
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email e senha são obrigatórios."
            });
        }

        const supabase = createAuthClient();

        const { data, error } =
            await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password
            });

        if (error) {
            return res.status(401).json({
                error: "Email ou senha incorretos."
            });
        }

        return res.json({
            message: "Login realizado com sucesso!",
            user: {
                id: data.user.id,
                email: data.user.email
            },
            session: data.session
        });

    } catch (error) {
        return res.status(500).json({
            error: "Erro interno ao realizar login."
        });
    }
});

module.exports = router;