document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const messagesArea = document.getElementById('messagesArea');
    const sendButton = document.getElementById('sendButton');

    // Sortu erabiltzaile ID bat ausaz saio honetarako
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);

    function scrollToBottom() {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // Joan behera kargatzean
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

        // 1. Erabiltzailearen mezua erakutsi
        addMessage(message, 'user');
        
        // Input-a blokeatu prozesatzen den bitartean
        messageInput.value = '';
        messageInput.disabled = true;
        sendButton.disabled = true;
        sendButton.textContent = '...';

        try {
            // 2. Eskaera backend-era bidali ('/api/chatbot')
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userMessage: message, userId: userId })
            });

            const data = await response.json();

            if (data.success) {
                // 3. Laguntzailearen erantzuna erakutsi
                addMessage(data.reply, 'assistant');
            } else {
                addMessage("Errorea: " + (data.error || "Ezin izan da erantzuna jaso."), 'assistant');
            }

        } catch (error) {
            console.error('Error:', error);
            addMessage("Errorea konexioan.", 'assistant');
        } finally {
            // Input-aren egoera leheneratu
            messageInput.disabled = false;
            sendButton.disabled = false;
            sendButton.textContent = 'Bidali';
            messageInput.focus();
        }
    });
});
