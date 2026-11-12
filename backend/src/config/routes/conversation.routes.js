const express = require("express");
const requireAuth = require("../../middleware/auth.middleware");
const createUserClient = require("../supabase-user");

const router = express.Router();

router.post("/direct", requireAuth, async (req, res) => {
    try {
        const { otherUserId } = req.body || {};

if (!otherUserId) {
    return res.status(400).json({
        error: "Informe o otherUserId no corpo da requisição."
    });
}

        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(otherUserId || "")) {
            return res.status(400).json({
                error: "ID do usuário inválido."
            });
        }

        const supabase = createUserClient(req.accessToken);

        const { data, error } = await supabase.rpc(
            "create_direct_conversation",
            {
                p_other_user_id: otherUserId
            }
        );

        if (error) {
            console.error("Erro ao criar conversa:", error.message);

            return res.status(400).json({
                error: "Não foi possível criar a conversa."
            });
        }

        return res.status(200).json({
            message: "Conversa criada ou já existente!",
            conversationId: data
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro interno."
        });
    }
});


router.get("/", requireAuth, async (req, res) => {
    try {
        const supabase = createUserClient(req.accessToken);

        // Buscar as participações do usuário
        const { data: memberships, error: memberError } =
            await supabase
                .from("conversation_members")
                .select("conversation_id, role, joined_at")
                .eq("user_id", req.user.id);

        if (memberError) {
            console.error(memberError);
            return res.status(400).json({
                error: "Erro ao buscar participações."
            });
        }

        // Se não participa de nenhuma conversa
        if (!memberships || memberships.length === 0) {
            return res.status(200).json({
                conversations: []
            });
        }

        const ids = memberships.map(
            member => member.conversation_id
        );

        // Buscar as conversas
        const { data: conversations, error } = await supabase
            .from("conversations")
            .select("id, name, is_group, created_by, created_at")
            .in("id", ids)
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
            return res.status(400).json({
                error: "Erro ao buscar conversas."
            });
        }

        return res.status(200).json({
            conversations: conversations.map(conversation => ({
                ...conversation,
                membership: memberships.find(
                    member => member.conversation_id === conversation.id
                )
            }))
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro interno."
        });
    }
});
















module.exports = router;