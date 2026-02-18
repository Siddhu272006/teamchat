const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    fileUrl: String, // For file sharing
    reactions: [{ type: String, user: mongoose.Schema.Types.ObjectId }]
});

const conversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    type: { type: String, enum: ['private', 'group'], default: 'private' },
    messages: [messageSchema],
    name: String // For group chats
});

module.exports = mongoose.model('Conversation', conversationSchema);
