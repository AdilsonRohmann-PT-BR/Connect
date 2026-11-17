
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
        const { data: messages, error } = await supabase
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

        // Identificar os remetentes
        const senderIds = [
            ...new Set(messages.map(message => message.sender_id))
        ];

        // Buscar os perfis dos remetentes
        let profiles = [];

        if (senderIds.length > 0) {
            const { data: profileData, error: profileError } =
                await supabase
                    .from("profiles")
                    .select("id, username, display_name, avatar_url")
                    .in("id", senderIds);

            if (profileError) {
                console.error(profileError);

                return res.status(400).json({
                    error: "Erro ao buscar perfis dos usuários."
                });
            }

            profiles = profileData || [];
        }

        // Associar cada mensagem ao perfil do remetente
        const profileMap = new Map(
            profiles.map(profile => [profile.id, profile])
        );

        const messagesWithProfiles = messages.map(message => ({
            ...message,
            sender: profileMap.get(message.sender_id) || null
        }));

        return res.status(200).json({
            messages: messagesWithProfiles
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

        if (typeof content !== "string" || !content.trim()) {
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
