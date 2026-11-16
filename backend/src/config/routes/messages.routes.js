
const express = require("express");
const requireAuth = require("../../middleware/auth.middleware");
const createUserClient = require("../supabase-user");

const router = express.Router();

// Listar mensagens de uma conversa
router.get("/:conversationId", requireAuth, async (req, res) => {
    try {
        const { conversationId } = req.params;

        const supabase = createUserClient(req.accessToken);

        // Verificar participação
        const { data: membership, error: memberError } =
            await supabase
                .from("conversation_members")
                .select("conversation_id")
                .eq("conversation_id", conversationId)
                .eq("user_id", req.user.id)
                .maybeSingle();

        if (memberError || !membership) {
            return res.status(403).json({
                error: "Você não participa desta conversa."
            });
        }

        // Buscar mensagens
        const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error(error);

            return res.status(400).json({
                error: "Erro ao buscar mensagens."
            });
        }

        return res.status(200).json({
            messages: data
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro interno."
        });
    }
});


// Enviar mensagem
router.post("/:conversationId", requireAuth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content } = req.body || {};

        if (!content || !content.trim()) {
            return res.status(400).json({
                error: "A mensagem não pode estar vazia."
            });
        }

        const supabase = createUserClient(req.accessToken);

        // Verificar participação
        const { data: membership, error: memberError } =
            await supabase
                .from("conversation_members")
                .select("conversation_id")
                .eq("conversation_id", conversationId)
                .eq("user_id", req.user.id)
                .maybeSingle();

        if (memberError || !membership) {
            return res.status(403).json({
                error: "Você não participa desta conversa."
            });
        }

        // Inserir mensagem
        const { data, error } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversationId,
                sender_id: req.user.id,
                content: content.trim()
            })
            .select()
            .single();

        if (error) {
            console.error(error);

            return res.status(400).json({
                error: "Erro ao enviar mensagem."
            });
        }

        return res.status(201).json({
            message: "Mensagem enviada!",
            data
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro interno."
        });
    }
});

module.exports = router;
