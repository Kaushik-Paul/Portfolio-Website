(function () {
    const LOCAL_API_BASE_URL = 'http://127.0.0.1:8000';
    const PRODUCTION_API_BASE_URL = 'https://api.ai-chat.pp.ua';
    const FULL_CHAT_URL = 'https://www.ai-chat.pp.ua/';
    const currentScript = document.currentScript;
    const WIDGET_MARKUP_URL = currentScript
        ? new URL('chat-widget.html', currentScript.src).toString()
        : 'chatbot/chat-widget.html';
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

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
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
        const sheetHandle = root.querySelector('.chat-widget__sheet-handle');
        const messagesEl = root.querySelector('#chat-widget-messages');
        const form = root.querySelector('#chat-widget-form');
        const input = root.querySelector('#chat-widget-input');
        const sendButton = root.querySelector('#chat-widget-send');
        const chips = Array.from(root.querySelectorAll('.chat-widget__chip'));

        if (!widget || !panel || !fab || !messagesEl || !form || !input || !sendButton) return;

        let messages = loadMessages();
        let sessionId = safeStorageGet(STORAGE_KEYS.sessionId) || '';
        let isSending = false;
        let warmupStarted = false;
        let warmupComplete = false;
        let warmupPromise = null;
        let conversationVersion = 0;
        let requestController = null;
        const chatConfig = getChatConfig();
        const mobileSheetQuery = window.matchMedia('(max-width: 767px)');
        const initialInputPlaceholder = input.getAttribute('placeholder') || '';

        const scrollToBottom = () => {
            messagesEl.scrollTop = messagesEl.scrollHeight;
        };

        const getMobileSheetBounds = () => {
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 720;
            const minHeight = Math.min(448, Math.max(320, viewportHeight - 84));
            const maxHeight = Math.max(minHeight, viewportHeight - 12);
            return { minHeight, maxHeight };
        };

        const normalizeMobileSheetHeight = () => {
            if (!mobileSheetQuery.matches) {
                panel.style.removeProperty('--chat-mobile-sheet-height');
                return;
            }

            const currentHeight = panel.getBoundingClientRect().height;
            const { minHeight, maxHeight } = getMobileSheetBounds();
            const nextHeight = clamp(currentHeight || maxHeight * 0.78, minHeight, maxHeight);
            panel.style.setProperty('--chat-mobile-sheet-height', `${Math.round(nextHeight)}px`);
        };

        const renderMessages = () => {
            Array.from(messagesEl.querySelectorAll('.chat-widget__message-row')).forEach(node => node.remove());
            messages.forEach(message => {
                messagesEl.appendChild(createMessageElement(message));
            });
            scrollToBottom();
        };

        const isWarmupBlocking = () => warmupStarted && !warmupComplete;

        const updateComposerState = () => {
            const warmupBlocking = isWarmupBlocking();
            sendButton.disabled = isSending || warmupBlocking || !input.value.trim();
            input.disabled = isSending;
            input.setAttribute(
                'placeholder',
                warmupBlocking ? 'Warming up the assistant...' : initialInputPlaceholder
            );
            chips.forEach(chip => {
                chip.disabled = isSending || warmupBlocking;
            });
        };

        const startWarmup = () => {
            if (warmupComplete) return Promise.resolve();
            if (warmupPromise) return warmupPromise;

            warmupStarted = true;
            widget.dataset.warming = 'true';
            updateComposerState();

            const healthHeaders = chatConfig.apiKey ? { 'x-api-key': chatConfig.apiKey } : {};
            warmupPromise = fetch(`${chatConfig.apiBaseUrl}/health`, {
                method: 'GET',
                headers: healthHeaders,
                cache: 'no-store',
            }).catch(() => {
                // Warm-up should never permanently block the recruiter from trying the chat.
            }).finally(() => {
                warmupComplete = true;
                warmupPromise = null;
                widget.dataset.warming = 'false';
                updateComposerState();
            });

            return warmupPromise;
        };

        const setOpen = (isOpen) => {
            widget.dataset.open = isOpen ? 'true' : 'false';
            panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            fab.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            fab.setAttribute('aria-label', isOpen ? 'Minimize Kaushik AI Assistant' : 'Open Kaushik AI Assistant');
            document.body.classList.toggle('chat-widget-open', isOpen);
            if (isOpen) {
                startWarmup();
                setTimeout(() => input.focus(), 120);
                scrollToBottom();
            }
        };

        const setSending = (sending) => {
            isSending = sending;
            updateComposerState();
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
            if (!messageText || isSending || isWarmupBlocking()) return;

            const activeConversationVersion = conversationVersion;
            const controller = new AbortController();
            requestController = controller;
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
                    signal: controller.signal,
                    body: JSON.stringify({
                        message: messageText,
                        session_id: sessionId || undefined,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Chat request failed with status ${response.status}`);
                }

                const data = await response.json();
                if (activeConversationVersion !== conversationVersion) return;

                if (data.session_id) {
                    sessionId = data.session_id;
                    safeStorageSet(STORAGE_KEYS.sessionId, sessionId);
                }

                appendMessage('assistant', data.response || 'I received that, but I could not generate a response.');
            } catch (error) {
                if (error.name === 'AbortError' || activeConversationVersion !== conversationVersion) return;

                appendMessage(
                    'assistant',
                    `I could not reach the assistant right now. You can still open the full chat here: ${FULL_CHAT_URL}`
                );
            } finally {
                typingEl.remove();
                if (requestController === controller) {
                    requestController = null;
                }
                if (activeConversationVersion === conversationVersion) {
                    setSending(false);
                    input.focus();
                }
            }
        };

        fab.addEventListener('click', () => {
            setOpen(widget.dataset.open !== 'true');
        });

        closeButton.addEventListener('click', () => {
            setOpen(false);
        });

        clearButton.addEventListener('click', () => {
            conversationVersion += 1;
            if (requestController) {
                requestController.abort();
                requestController = null;
            }
            messages = [];
            sessionId = '';
            safeStorageRemove(STORAGE_KEYS.sessionId);
            safeStorageRemove(STORAGE_KEYS.messages);
            renderMessages();
            setSending(false);
            autosizeInput(input);
            input.focus();
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            sendMessage(input.value);
        });

        input.addEventListener('input', () => {
            autosizeInput(input);
            updateComposerState();
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

        if (sheetHandle) {
            sheetHandle.addEventListener('pointerdown', (event) => {
                if (!mobileSheetQuery.matches || widget.dataset.open !== 'true') return;

                event.preventDefault();
                const pointerId = event.pointerId;
                const startY = event.clientY;
                const startHeight = panel.getBoundingClientRect().height;
                const { minHeight, maxHeight } = getMobileSheetBounds();

                widget.classList.add('chat-widget--resizing');
                try {
                    sheetHandle.setPointerCapture(pointerId);
                } catch (error) {
                    // Pointer capture is a nice-to-have; document listeners below keep dragging usable.
                }

                const onPointerMove = (moveEvent) => {
                    if (moveEvent.pointerId !== pointerId) return;
                    const nextHeight = clamp(startHeight + startY - moveEvent.clientY, minHeight, maxHeight);
                    panel.style.setProperty('--chat-mobile-sheet-height', `${Math.round(nextHeight)}px`);
                };

                const stopDragging = (upEvent) => {
                    if (upEvent.pointerId !== pointerId) return;
                    widget.classList.remove('chat-widget--resizing');
                    document.removeEventListener('pointermove', onPointerMove);
                    document.removeEventListener('pointerup', stopDragging);
                    document.removeEventListener('pointercancel', stopDragging);
                    try {
                        sheetHandle.releasePointerCapture(pointerId);
                    } catch (error) {
                        // Ignore release errors from browsers that did not capture the pointer.
                    }
                };

                document.addEventListener('pointermove', onPointerMove);
                document.addEventListener('pointerup', stopDragging);
                document.addEventListener('pointercancel', stopDragging);
            });
        }

        window.addEventListener('resize', normalizeMobileSheetHeight);

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && widget.dataset.open === 'true') {
                setOpen(false);
            }
        });

        renderMessages();
        setSending(false);
    }

    async function loadChatWidget() {
        try {
            const response = await fetch(WIDGET_MARKUP_URL, { cache: 'no-cache' });
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
