const fs = require('fs');
const path = require('path');
const User = require('./models/User');

const flowData = JSON.parse(fs.readFileSync(path.join(__dirname, 'flow.json'), 'utf8'));
let userDetails = {};

const generateBotReply = async (userInput, messageType) => {
    console.log('Processing:', messageType, userInput);

    try {
        if (messageType === 'button') {
            return handleButtonClick(userInput);
        } else if (messageType === 'text') {
            return handleTextInput(userInput);
        } else {
            throw new Error("Invalid message type");
        }
    } catch (error) {
        console.error('Error in generating reply:', error);
        return { text: "Something went wrong. Please try again." };
    }
};

const handleButtonClick = (payload) => {
    console.log("Button clicked:", payload);

    if (payload === 'NAME_EMAIL_CONTACT') {
        userDetails.step = 'name';
        return {
            text: "Great! Let's start with your name. What's your full name?",
            showInput: true,
            inputPrompt: "Enter your full name"
        };
    }
    return flowData[payload] || flowData.FALLBACK;
};

const handleTextInput = async (message) => {
    if (userDetails.step) {
        return await handleUserDetails(message);
    }
    return flowData.FALLBACK;
};

const handleUserDetails = async (message) => {
    switch (userDetails.step) {
        case 'name':
            if (isValidName(message)) {
                userDetails.name = message;
                userDetails.step = 'email';
                return {
                    text: `Nice to meet you, ${message.split(' ')[0]}! Now, what's your email address?`,
                    showInput: true,
                    inputPrompt: "Enter your email address"
                };
            } else {
                return {
                    text: "Please enter a valid name (only letters and spaces).",
                    showInput: true,
                    inputPrompt: "Enter your full name"
                };
            }
        case 'email':
            if (isValidEmail(message)) {
                userDetails.email = message;
                userDetails.step = 'contact';
                return {
                    text: "Great! Lastly, what's your contact number?",
                    showInput: true,
                    inputPrompt: "Enter your contact number"
                };
            } else {
                return {
                    text: "Please enter a valid email address.",
                    showInput: true,
                    inputPrompt: "Enter your email address"
                };
            }
        case 'contact':
            if (isValidContact(message)) {
                userDetails.contact = message;
                userDetails.step = 'completed';

                // Save to MongoDB
                try {
                    const user = new User({
                        name: userDetails.name,
                        email: userDetails.email,
                        contact: message
                    });
                    await user.save();
                    console.log('User saved to MongoDB:', user);
                } catch (error) {
                    console.error('MongoDB save error:', error);
                }

                return {
                    text: `Thank you, ${userDetails.name.split(' ')[0]}! Lovely to meet you. What's happening with you and how can we help?`,
                    buttons: [
                        { payload: "DISCRIMINATION", title: "Discrimination" },
                        { payload: "INTERSECTIONALITY", title: "Intersectionality" },
                        { payload: "NEURODIVERSITY", title: "Neurodiversity" },
                        { payload: "RACISM", title: "Racism" },
                        { payload: "SOCIAL_MOBILITY", title: "Social Mobility" },
                        { payload: "MONEY_PAY", title: "Money & Pay" },
                    ],
                    showInput: false,
                    inputPrompt: "Select a topic or type your question"
                };
            }
    }
};

const isValidName = (name) => /^[a-zA-Z\s]+$/.test(name);
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidContact = (contact) => /^\+?[\d\s-]{10,15}$/.test(contact);

module.exports = { generateBotReply };
