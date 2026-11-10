require("dotenv").config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;

async function testarSupabase() {
    try {
        const response = await fetch(
            `${url.replace(/\/$/, "")}/rest/v1/connection_test?select=id,message&limit=1`,
            {
                headers: {
                    apikey: key
                }
            }
        );

        const resultado = await response.json();

        console.log("Status:", response.status);
        console.log("Resultado:", resultado);

        if (response.ok) {
            console.log("Connect conectado ao Supabase!");
        }

    } catch (error) {
        console.error("Erro:", error.message);
    }
}

testarSupabase();