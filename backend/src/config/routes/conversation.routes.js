
const express = require("express");
const requireAuth = require("../../middleware/auth.middleware");
const createUserClient = require("../supabase-user");

const router = express.Router();

// Criar ou recuperar conversa direta
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

        if (!uuidRegex.test(otherUserId)) {
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


// Listar conversas com perfis dos participantes
router.get("/", requireAuth, async (req, res) => {
    try {
        const supabase = createUserClient(req.accessToken);

        // Buscar participações do usuário
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

        if (!memberships || memberships.length === 0) {
            return res.status(200).json({
                conversations: []
            });
        }

        const ids = memberships.map(
            member => member.conversation_id
        );

        // Buscar conversas
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

        // Buscar participantes dessas conversas
        const { data: allMembers, error: participantsError } =
            await supabase
                .from("conversation_members")
                .select("conversation_id, user_id, role, joined_at")
                .in("conversation_id", ids);

        if (participantsError) {
            console.error(participantsError);

            return res.status(400).json({
                error: "Erro ao buscar participantes."
            });
        }

        // Identificar os outros usuários
        const otherUserIds = [
            ...new Set(
                (allMembers || [])
                    .filter(member => member.user_id !== req.user.id)
                    .map(member => member.user_id)
            )
        ];

        // Buscar perfis
        let profiles = [];

        if (otherUserIds.length > 0) {
            const { data: profileData, error: profileError } =
                await supabase
                    .from("profiles")
                    .select("id, username, display_name, avatar_url")
                    .in("id", otherUserIds);

            if (profileError) {
                console.error(profileError);

                return res.status(400).json({
                    error: "Erro ao buscar perfis dos participantes."
                });
            }

            profiles = profileData || [];
        }

        // Associar perfis aos participantes
        const profileMap = new Map(
            profiles.map(profile => [profile.id, profile])
        );

        const conversationsWithProfiles = conversations.map(conversation => {
            const participants = (allMembers || [])
                .filter(member =>
                    member.conversation_id === conversation.id
                )
                .map(member => ({
                    user_id: member.user_id,
                    role: member.role,
                    joined_at: member.joined_at,
                    profile: profileMap.get(member.user_id) || null
                }));

            const otherParticipants = participants.filter(
                participant => participant.user_id !== req.user.id
            );

            return {
                ...conversation,
                membership: memberships.find(
                    member => member.conversation_id === conversation.id
                ),
                participants,
                other_participant: conversation.is_group
                    ? null
                    : otherParticipants[0] || null
            };
        });

        return res.status(200).json({
            conversations: conversationsWithProfiles
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro interno."
        });
    }
});

module.exports = router;
