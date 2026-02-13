//Dependentziak inportatu 
import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// API key-a kargatu
dotenv.config();

//Express kargatu
const app = express();
const PORT = process.env.PORT || 3000;

// Frontend-eko fitxategiak zerbitzatzeko middleware-a definitiu
app.use("/", express.static('public'));

//Backend-ean jasotako JSON string-ak Javascript-eko middlewarea bihurtzeko
app.use(express.json());

//Backend-ean jasotako form datuak Javascript-eko middlewarea bihurtzeko
// (a-www-form-encoded form datuak)
app.use(express.urlencoded({ extended: true }));

// OpenAI bezeroaren instantzia bat sortu eta API key-a pasatu
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Konbertzazioen mezuak gordetzeko bilduma sortu
let conversations = {};

// Backend-aren ruta pertsonalizatua eta eskaria prozesatzeko callback funtzioa definitu
app.post('/api/chatbot', async (req, res) => {

    // jasotako datuak desegituratu
    const { userMessage, userId } = req.body;

    if (!userMessage) {
        return res.status(400).json({ error: "Mezuaren testua falta da." });
    }

    if (!userId) {
        return res.status(400).json({ error: "Erabiltzailearen identifikadorea falta da." });
    }

    // Erabiltzailearen konbertzazioaren mezuen bilduma existitzen ez bada hasieratu
    if (!conversations[userId]) {
        conversations[userId] = [
            { role: 'system', content: 'Laguntzaile adimenduna zara.' },
            { role: 'system', content: 'Erantzun labur eta zuzena izan behar du, ahalik eta token gutxien erabiliz'},
            { role: 'system', content: 'Erantzuna testu hutsean eman, ez erabili markdown formatuan' }
        ];
    }

    // Erabiltzailearen mezua historiara gehitu
    conversations[userId].push({ role: 'user', content: userMessage });

    // OpenAI-ra bidaltzeko mezuen array-a eraiki
    const messages = conversations[userId];

    // OpenAI-ko modelora eskaera egin (await-ak async-a behar du callback-eko funtzioan)
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
            response_format: { type: "text" }
        });

        // Laguntzailearen erantzuna
        const botReply = completion.choices[0].message.content;

        // Laguntzailearen erantzuna historiara gehitu
        conversations[userId].push({ role: 'assistant', content: botReply });
        
        // Erantzuna bezeroari bidali
        return res.status(200).json({ success: true, reply: botReply });

    } catch (error) {
        console.log("Error:", error);
        if (error.response) {
            return res.status(500).json({ success: false, error: error.response.data.error.message });
        }
        return res.status(500).json({ success: false, error: 'Errore ezezaguna gertatu da.' });
    }
});

// Serverra abiarazi
app.listen(PORT, () => {
    console.log(`Zerbitzaria martxan http://localhost:${PORT} portuan abiarazi da.`);
});
