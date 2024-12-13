document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const typingIndicator = document.getElementById('typing-indicator');
    const popup = document.getElementById('popup-message');
    const popupClose = document.getElementById('popup-close');
    let popupTimer = null;
    let popupClosed = false;

    // Show popup on initial page load
    function showInitialPopup() {
        if (popup && !popupClosed) {
            popupTimer = setTimeout(() => {
                popup.classList.remove('popup-hidden');
            }, 3000);
        }
    }

    // Show popup when chatbot closes
    function showPopupAfterChatbot() {
        if (popup && !popupClosed) {
            popupTimer = setTimeout(() => {
                popup.classList.remove('popup-hidden');
            }, 3000);
        }
    }

    // Initial popup on page load
    showInitialPopup();

    // Close popup when clicked
    if (popupClose) {
        popupClose.addEventListener('click', (e) => {
            e.preventDefault();
            if (popup) {
                popup.classList.add('popup-hidden');
                popupClosed = true;
                clearTimeout(popupTimer);
            }
        });
    }

    // Hide popup when chatbot is opened
    chatbotToggle.addEventListener('click', function() {
        chatbotContainer.classList.add('expanded');
        window.parent.postMessage({ type: 'CHATBOT_STATE', expanded: true }, '*');
        setTimeout(() => userInput.focus(), 300);
    });
    
    chatbotClose.addEventListener('click', function() {
        chatbotContainer.classList.remove('expanded');
        window.parent.postMessage({ type: 'CHATBOT_STATE', expanded: false }, '*');
    });
    

    // Function to add messages to the chat UI
    function addMessage(message, isUser = false) {
        const messageElement = document.createElement('div');
        if (typeof message === 'string') {
            messageElement.innerHTML = message;
        } else {
            messageElement.innerHTML = message.text;
        }
        messageElement.classList.add('message', isUser ? 'user-message' : 'bot-message');

        if (message.buttons) {
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'button-container';
            message.buttons.forEach(button => {
                const buttonElement = document.createElement('button');
                buttonElement.textContent = button.title;
                buttonElement.onclick = () => handleUserInput(button.payload, 'button', button.title);
                buttonsContainer.appendChild(buttonElement);
            });
            messageElement.appendChild(buttonsContainer);
        }

        chatbotMessages.appendChild(messageElement);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        if (message.showInput !== undefined) {
            toggleInputVisibility(message.showInput, message.inputPrompt);
        }
    }

    // Show typing indicator
    function showTypingIndicator() {
        const existingIndicator = document.querySelector('.typing-indicator');
        if (!existingIndicator) {
            const indicator = document.createElement('div');
            indicator.className = 'typing-indicator';
            indicator.innerHTML = '<span></span><span></span><span></span>';
            chatbotMessages.appendChild(indicator);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }
    }

    // Hide typing indicator
    function hideTypingIndicator() {
        const indicators = document.querySelectorAll('.typing-indicator');
        indicators.forEach(indicator => indicator.remove());
    }

    // Call chatbot API
    async function callChatbotAPI(message, messageType) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, messageType })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            return await response.json();
        } catch (error) {
            console.error('Error calling chatbot API:', error);
            return { text: 'Sorry, something went wrong. Please try again later.' };
        }
    }

    // Handle user input
    async function handleUserInput(message, messageType = 'text', displayText = null) {
        if (messageType === 'text') {
            message = userInput.value.trim();
            displayText = message;
        }

        if (message) {
            addMessage(displayText || message, true);
            userInput.value = '';

            try {
                showTypingIndicator();
                const response = await callChatbotAPI(message, messageType);
                hideTypingIndicator();

                if (Array.isArray(response)) {
                    await addMultipleMessages(response);
                } else {
                    addMessage(response);
                }

                const lastMessage = Array.isArray(response) ? response[response.length - 1] : response;
                toggleInputVisibility(lastMessage.showInput, lastMessage.inputPrompt);
            } catch (error) {
                console.error('Error:', error);
                addMessage('Sorry, I encountered an error. Please try again.');
            }
        }
    }

    // Add multiple messages
    async function addMultipleMessages(messages, delay = 1000) {
        for (const message of messages) {
            showTypingIndicator();
            await new Promise(resolve => setTimeout(resolve, delay));
            hideTypingIndicator();
            addMessage(message);
        }
    }

    // Toggle input visibility
    function toggleInputVisibility(show, promptMessage = '') {
        const inputContainer = document.getElementById('chatbot-input');
        if (show) {
            inputContainer.style.display = 'flex';
            userInput.placeholder = promptMessage;
            userInput.focus();
        } else {
            inputContainer.style.display = 'none';
        }
    }

    // Event listeners
    sendButton.addEventListener('click', () => handleUserInput(userInput.value.trim(), 'text'));
    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleUserInput(userInput.value.trim(), 'text');
        }
    });

    // Initial setup
    showTypingIndicator();

    // Initial messages
    const initialMessages = [
        { text: "Hello, welcome to Brownstone EDI Guru." },
        { text: "We are here to advise and support you to ensure equity, diversity, and inclusion (EDI) policies work for you." },
        {
            text: "Can you tell us your name and email id? (All our conversations are confidential and are not shared with any third party)",
            buttons: [
                { payload: "NAME_EMAIL_CONTACT", title: "Share Name, Email & Contact" },
                { payload: "ANONYMOUS", title: "Prefers anonymous" }
            ],
            showInput: false,
            inputPrompt: ""
        }
    ];

    // Initialize chat
    addMultipleMessages(initialMessages).then(() => {
        const lastMessage = initialMessages[initialMessages.length - 1];
        toggleInputVisibility(lastMessage.showInput, lastMessage.inputPrompt);
    });

    // Hide input field initially
    toggleInputVisibility(false);
});
