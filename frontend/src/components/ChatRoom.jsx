import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Send, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';

const socket = io(import.meta.env.VITE_API_URL);

export default function ChatRoom({ conversation, currentUser }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [file, setFile] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!conversation) return;
        setMessages(conversation.messages || []);
        socket.emit('join-room', conversation._id);

        const handleNewMessage = (message) => {
            setMessages(prev => [...prev, message]);
        };

        socket.on('new-message', handleNewMessage);
        return () => socket.off('new-message', handleNewMessage);
    }, [conversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFileUpload = async () => {
        if (!file) return null;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('http://localhost:5000/api/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            return res.data.url; // Returns relative URL like /uploads/users/...
        } catch (err) {
            console.error('File upload failed', err);
            return null;
        }
    };

    const sendMessage = async () => {
        if ((!input.trim() && !file) || !conversation) return;

        let fileUrl = null;
        if (file) {
            fileUrl = await handleFileUpload();
            setFile(null); // Clear file after upload attempt
        }

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/chat/message/${conversation._id}`, {
                content: input,
                fileUrl
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            socket.emit('send-message', { roomId: conversation._id, ...res.data });
            setInput('');
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    const fullFileUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `http://localhost:5000${url}`;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="p-4 bg-white border-b shadow-sm">
                <h2 className="text-lg font-semibold">{conversation?.name || 'Chat'}</h2>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, i) => {
                    const senderId = msg.sender._id || msg.sender;
                    const isMe = senderId === currentUser.id;
                    return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border'}`}>
                                {!isMe && <div className="text-xs font-bold text-gray-500 mb-1">{msg.sender.username || 'User'}</div>}

                                {msg.fileUrl && (
                                    <div className="mb-2">
                                        {msg.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                            <img src={fullFileUrl(msg.fileUrl)} alt="attachment" className="max-w-full rounded" />
                                        ) : (
                                            <a href={fullFileUrl(msg.fileUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
                                                <FileText size={16} /> Attachment
                                            </a>
                                        )}
                                    </div>
                                )}

                                <p>{msg.content}</p>
                                <div className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t">
                {file && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-gray-100 rounded">
                        <Paperclip size={14} />
                        <span className="text-sm truncate">{file.name}</span>
                        <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700 ml-auto">×</button>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                        <ImageIcon size={20} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => setFile(e.target.files[0])}
                        className="hidden"
                    />

                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={sendMessage}
                        className="p-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
