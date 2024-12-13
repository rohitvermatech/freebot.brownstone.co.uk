const { generateBotReply } = require('./src/handleChat');
const express = require('express');
const path = require('path');
const cors = require('cors');
const winston = require('winston');
const app = express();
const port = 3300;

require('dotenv').config();
const mongoose = require('mongoose');

// Add MongoDB connection using env variable
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
    
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chatbot.html'));
});

app.post('/api/chat', async (req, res) => {
    const { message, messageType } = req.body;

    if (!message || !messageType) {
        logger.error('Invalid request: Missing message or messageType.');
        return res.status(400).json({ error: 'Invalid request: Missing message or messageType.' });
    }

    try {
        const botReply = await generateBotReply(message, messageType);
        setTimeout(() => {
            res.json(botReply);
        }, 1000);
    } catch (error) {
        logger.error('Error processing bot reply:', error);
        res.status(500).json({ error: 'Failed to generate bot response.' });
    }
});

app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
});
