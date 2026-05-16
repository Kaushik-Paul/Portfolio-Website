(function () {
    const LOCAL_API_BASE_URL = 'http://127.0.0.1:8000';
    const PRODUCTION_API_BASE_URL = 'https://api.ai-chat.pp.ua';
    const FULL_CHAT_URL = 'https://www.ai-chat.pp.ua/';
    const STORAGE_KEYS = {
        sessionId: 'kaushik_chat_session_id',
        messages: 'kaushik_chat_messages',
    };

    function getChatConfig() {
        const externalConfig = window.KAUSHIK_CHAT_CONFIG || {};
        const hostname = window.location.hostname;
        const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

        return {
            apiBaseUrl: externalConfig.apiBaseUrl || (isLocalHost ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL),
            apiKey: externalConfig.apiKey || '',
        };
    }

    function safeStorageGet(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function safeStorageSet(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            // Storage is optional; the chat still works without persistence.
        }
    }

    function safeStorageRemove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            // Ignore storage errors.
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function linkifyEscapedText(value) {
        return value.replace(
            /(https?:\/\/[^\s<]+|[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/g,
            function (match) {
                const isEmail = match.indexOf('@') > -1 && !match.startsWith('http');
                const href = isEmail ? `mailto:${match}` : match;
                return `<a href="${href}" target="_blank" rel="noopener noreferrer">${match}</a>`;
            }
        );
    }

    function formatContent(content) {
        const escaped = escapeHtml(content || '');
        return linkifyEscapedText(escaped);
    }

    function formatTime(timestamp) {
        const date = timestamp ? new Date(timestamp) : new Date();
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function loadMessages() {
        const stored = safeStorageGet(STORAGE_KEYS.messages);
        if (!stored) return [];

        try {
            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) return [];
            return parsed.filter(message => message && !message.intro && message.role && typeof message.content === 'string');
        } catch (error) {
            return [];
        }
    }

    function saveMessages(messages) {
        const persisted = messages.slice(-30);
        safeStorageSet(STORAGE_KEYS.messages, JSON.stringify(persisted));
    }

    function autosizeInput(input) {
        input.style.height = 'auto';
        input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    }

    function createMessageElement(message) {
        const row = document.createElement('div');
        row.className = `chat-widget__message-row chat-widget__message-row--${message.role}`;

        if (message.role === 'assistant') {
            const avatar = document.createElement('div');
            avatar.className = 'chat-widget__mini-avatar';
            avatar.innerHTML = '<i class="fas fa-robot" aria-hidden="true"></i>';
            row.appendChild(avatar);
        }

        const bubble = document.createElement('div');
        bubble.className = 'chat-widget__bubble';
        bubble.innerHTML = `<p>${formatContent(message.content)}</p><span class="chat-widget__time">${formatTime(message.timestamp)}</span>`;
        row.appendChild(bubble);

        return row;
    }

    function createTypingElement() {
        const row = document.createElement('div');
        row.className = 'chat-widget__message-row chat-widget__message-row--assistant';
        row.dataset.typing = 'true';
        row.innerHTML = [
            '<div class="chat-widget__mini-avatar"><i class="fas fa-robot" aria-hidden="true"></i></div>',
            '<div class="chat-widget__bubble"><div class="chat-widget__typing" aria-label="Assistant typing">',
            '<span></span><span></span><span></span>',
            '</div></div>',
        ].join('');
        return row;
    }

    function initChatWidget(root) {
        const widget = root.querySelector('#chat-widget');
        const panel = root.querySelector('#chat-widget-panel');
        const fab = root.querySelector('#chat-widget-fab');
        const closeButton = root.querySelector('#chat-widget-close');
        const clearButton = root.querySelector('#chat-widget-clear');
        const messagesEl = root.querySelector('#chat-widget-messages');
        const form = root.querySelector('#chat-widget-form');
        const input = root.querySelector('#chat-widget-input');
        const sendButton = root.querySelector('#chat-widget-send');
        const chips = Array.from(root.querySelectorAll('.chat-widget__chip'));

        if (!widget || !panel || !fab || !messagesEl || !form || !input || !sendButton) return;

        let messages = loadMessages();
        let sessionId = safeStorageGet(STORAGE_KEYS.sessionId) || '';
        let isSending = false;
        const chatConfig = getChatConfig();

        const scrollToBottom = () => {
            messagesEl.scrollTop = messagesEl.scrollHeight;
        };

        const renderMessages = () => {
            Array.from(messagesEl.querySelectorAll('.chat-widget__message-row')).forEach(node => node.remove());
            messages.forEach(message => {
                messagesEl.appendChild(createMessageElement(message));
            });
            scrollToBottom();
        };

        const setOpen = (isOpen) => {
            widget.dataset.open = isOpen ? 'true' : 'false';
            panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            fab.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            fab.setAttribute('aria-label', isOpen ? 'Minimize Kaushik AI Assistant' : 'Open Kaushik AI Assistant');
            document.body.classList.toggle('chat-widget-open', isOpen);
            if (isOpen) {
                setTimeout(() => input.focus(), 120);
                scrollToBottom();
            }
        };

        const setSending = (sending) => {
            isSending = sending;
            sendButton.disabled = sending || !input.value.trim();
            input.disabled = sending;
            chips.forEach(chip => {
                chip.disabled = sending;
            });
        };

        const appendMessage = (role, content) => {
            const message = {
                role,
                content,
                timestamp: new Date().toISOString(),
            };
            messages.push(message);
            messagesEl.appendChild(createMessageElement(message));
            saveMessages(messages);
            scrollToBottom();
            return message;
        };

        const sendMessage = async (content) => {
            const messageText = String(content || '').trim();
            if (!messageText || isSending) return;

            appendMessage('user', messageText);
            input.value = '';
            autosizeInput(input);
            setSending(true);

            const typingEl = createTypingElement();
            messagesEl.appendChild(typingEl);
            scrollToBottom();

            try {
                const headers = {
                    'Content-Type': 'application/json',
                };
                if (chatConfig.apiKey) {
                    headers['x-api-key'] = chatConfig.apiKey;
                }

                const response = await fetch(`${chatConfig.apiBaseUrl}/chat`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        message: messageText,
                        session_id: sessionId || undefined,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Chat request failed with status ${response.status}`);
                }

                const data = await response.json();
                if (data.session_id) {
                    sessionId = data.session_id;
                    safeStorageSet(STORAGE_KEYS.sessionId, sessionId);
                }

                appendMessage('assistant', data.response || 'I received that, but I could not generate a response.');
            } catch (error) {
                appendMessage(
                    'assistant',
                    `I could not reach the assistant right now. You can still open the full chat here: ${FULL_CHAT_URL}`
                );
            } finally {
                typingEl.remove();
                setSending(false);
                input.focus();
            }
        };

        fab.addEventListener('click', () => {
            setOpen(widget.dataset.open !== 'true');
        });

        closeButton.addEventListener('click', () => {
            setOpen(false);
        });

        clearButton.addEventListener('click', () => {
            messages = [];
            sessionId = '';
            safeStorageRemove(STORAGE_KEYS.sessionId);
            safeStorageRemove(STORAGE_KEYS.messages);
            renderMessages();
            input.focus();
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            sendMessage(input.value);
        });

        input.addEventListener('input', () => {
            autosizeInput(input);
            sendButton.disabled = isSending || !input.value.trim();
        });

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage(input.value);
            }
        });

        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                setOpen(true);
                sendMessage(chip.dataset.prompt || chip.textContent);
            });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && widget.dataset.open === 'true') {
                setOpen(false);
            }
        });

        renderMessages();
        setSending(false);

        const healthHeaders = chatConfig.apiKey ? { 'x-api-key': chatConfig.apiKey } : {};
        fetch(`${chatConfig.apiBaseUrl}/health`, { method: 'GET', headers: healthHeaders }).catch(() => {
            // Health is a warm-up hint only. Send still handles errors explicitly.
        });
    }

    async function loadChatWidget() {
        try {
            const response = await fetch('chat-widget.html', { cache: 'no-cache' });
            if (!response.ok) throw new Error('Unable to load chat widget markup');

            const mount = document.createElement('div');
            mount.id = 'chat-widget-mount';
            mount.innerHTML = await response.text();
            document.body.appendChild(mount);
            initChatWidget(mount);
        } catch (error) {
            console.error('Chat widget failed to load:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadChatWidget);
    } else {
        loadChatWidget();
    }
})();
