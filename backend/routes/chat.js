const express = require('express');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { authMiddleware } = require('./auth');
const router = express.Router();

// Get user's conversations
router.get('/conversations', authMiddleware, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id
        })
            .populate('participants', 'username')
            .populate('messages.sender', 'username');
        res.json(conversations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create or fetch a conversation with another user
router.post('/conversations', authMiddleware, async (req, res) => {
    try {
        const { participantUsername } = req.body;
        const participant = await User.findOne({ username: participantUsername });

        if (!participant) return res.status(404).json({ error: 'User not found' });
        if (participant._id.toString() === req.user.id) return res.status(400).json({ error: 'Cannot chat with yourself' });

        // Check for existing private conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user.id, participant._id] },
            type: 'private'
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [req.user.id, participant._id],
                type: 'private'
            });
            await conversation.save();
        }

        await conversation.populate('participants', 'username');
        res.json(conversation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Send a message
router.post('/message/:convId', authMiddleware, async (req, res) => {
    try {
        const { content, fileUrl } = req.body;
        const conversation = await Conversation.findById(req.params.convId);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        const newMessage = {
            content,
            sender: req.user.id,
            fileUrl,
            timestamp: new Date()
        };

        conversation.messages.push(newMessage);
        await conversation.save();

        // Populate sender details for the response
        const populationMap = {
            path: 'messages.sender',
            select: 'username'
        };
        // Re-fetch or populate is tricky on subdocs array push return. 
        // Usually easier to just return the object with sender ID and let frontend handle, 
        // or fully populate conversation. 
        // For this simple app, we'll return the object as is, assuming frontend handles ID or refetch.
        // Wait, the frontend ChatRoom expects msg.sender.username in some places?
        // "msg.sender.username" is accessed in ChatRoom.jsx.
        // So we MUST populate sender.

        const popConv = await Conversation.findById(req.params.convId).populate('messages.sender', 'username');
        const savedMsg = popConv.messages[popConv.messages.length - 1];

        res.json(savedMsg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
