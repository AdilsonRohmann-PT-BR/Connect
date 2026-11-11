const express = require("express");
const requireAuth = require("../../middleware/auth.middleware");
const createUserClient = require("../supabase-user");

const router = express.Router();

router.get("/me", requireAuth, async (req, res) => {
    try {
        const supabase = createUserClient(req.accessToken);

        const { data, error } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url, created_at")
            .eq("id", req.user.id)
            .single();

        if (error) {
            console.error("Erro ao buscar perfil:", error.message);

            return res.status(400).json({
                error: "Não foi possível buscar o perfil."
            });
        }

        return res.status(200).json({
            profile: data
        });

    } catch (error) {
        console.error("Erro interno:", error.message);

        return res.status(500).json({
            error: "Erro interno ao consultar perfil."
        });
    }
});

module.exports = router;