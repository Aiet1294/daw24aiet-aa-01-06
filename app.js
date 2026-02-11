//Dependentziak inportatu 
import express from 'express';
import dotenv from 'dotenv';
import Openai from 'openai';
import session from 'express-session'; // SE HA AÑADIDO: Importamos express-session para gestionar el historial del chat

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

// SE HA AÑADIDO: Configuración de la sesión para mantener el historial del chat
// Esto reemplaza la funcionalidad de $_SESSION['txataren_mezuak'] de PHP
app.use(session({
    secret: process.env.OPENAI_API_KEY, // Deberías cambiar esto por una variable de entorno en producción
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // secure: true behar da HTTPS erabiltzen bada
}));

//OpenAI bezeroaren instantzia sortu eta Api key-a pasatu
const openai = new Openai({
    apiKey: process.env.OPENAI_API_KEY,
});

// Backend-aren ruta perstonalizatua definitu
// SE HA CAMBIADO: La ruta ahora es /api/chat en lugar de /api/translate para el chatbot
app.post('/api/chat', async (req, res) => {

    // SE HA AÑADIDO: Obtener el mensaje del cuerpo de la petición (simil $input['message'])
    const { message } = req.body;

    // SE HA AÑADIDO: Validación del mensaje (simil if (!trim($message)))
    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Mezua hutsik dago.' });
    }

    // SE HA AÑADIDO: Inicializar el historial en la sesión si no existe (simil if (!isset($_SESSION...)))
    if (!req.session.txataren_mezuak) {
        req.session.txataren_mezuak = [];
    }

    // SE HA AÑADIDO: Añadir mensaje del usuario al historial
    req.session.txataren_mezuak.push({ role: 'user', content: message });

    // SE HA AÑADIDO: Mensaje de sistema (simil $systemMessage)
    // Nota: El PHP añadía esto en cada petición pero no lo guardaba en sesión. Hacemos lo mismo.
    const systemMessage = { role: 'system', content: 'Zu laguntzailea zara. Erantzun laburrak eta argiak eman behar dituzu testu formatuan.' };
    
    // Construir el array de mensajes para enviar a OpenAI
    const messages = [systemMessage, ...req.session.txataren_mezuak];

    // OpenAI-ko modelora eskaera egin (await-ak async-a behar du callback-eko funtzioan)
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Mantenemos el modelo que usaba el script PHP
            messages: messages,
            temperature: 0.7,
        });

        // Respuesta del asistente
        const botReply = completion.choices[0].message.content;

        // SE HA AÑADIDO: Guardar la respuesta del asistente en el historial de sesión
        req.session.txataren_mezuak.push({ role: 'assistant', content: botReply });

        // SE HA AÑADIDO: Enviar respuesta al cliente (simil echo json_encode(...))
        return res.status(200).json({ success: true, reply: botReply });

    } catch (error) {
        console.log("Error:", error);
        // Manejo de errores
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
