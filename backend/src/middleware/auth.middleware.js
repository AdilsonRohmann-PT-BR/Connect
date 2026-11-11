const supabase = require("../config/supabase");

async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Token de autenticação não informado."
            });
        }

        const token = authHeader.slice(7);

        const { data, error } = await supabase.auth.getUser(token);


        if (error || !data.user) {
    console.error("ERRO NA AUTENTICAÇÃO:", {
        message: error?.message,
        code: error?.code,
        status: error?.status
    });

    return res.status(401).json({
        error: "Token inválido ou expirado."
    });
}

        req.user = data.user;
        req.accessToken = token;

        next();

    } catch (error) {
        console.error("Erro no middleware de autenticação:", error.message);

        return res.status(500).json({
            error: "Erro ao validar autenticação."
        });
    }
}

module.exports = requireAuth;