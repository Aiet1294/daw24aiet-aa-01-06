document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const messagesArea = document.getElementById('messagesArea');
    const sendButton = document.getElementById('sendButton');

    function scrollToBottom() {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // Scroll to bottom on load
    scrollToBottom();

    function addMessage(content, role) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        div.textContent = content;
        messagesArea.appendChild(div);
        scrollToBottom();
    }

    chatForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const message = messageInput.value.trim();
        if (!message) return;

        // 1. Mostrar mensaje del usuario
        addMessage(message, 'user');
        
        // Bloquear input mientras se procesa
        messageInput.value = '';
        messageInput.disabled = true;
        sendButton.disabled = true;
        sendButton.textContent = '...';

        try {
            // 2. Enviar petición al backend (SE HA CAMBIADO: '/app.js' -> '/api/chat')
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();

            if (data.success) {
                // 3. Mostrar respuesta del asistente
                addMessage(data.reply, 'assistant');
            } else {
                addMessage("Errorea: " + (data.error || "Ezin izan da erantzuna jaso."), 'assistant');
            }

        } catch (error) {
            console.error('Error:', error);
            addMessage("Errorea konexioan.", 'assistant');
        } finally {
            // Restaurar estado del input
            messageInput.disabled = false;
            sendButton.disabled = false;
            sendButton.textContent = 'Bidali';
            messageInput.focus();
        }
    });
});
