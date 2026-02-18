import { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import { MessageSquare, LogOut, Users, PlusCircle } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      fetchConversations(token);
    }
  }, []);

  const fetchConversations = async (token) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
      if (res.data.length > 0 && !activeConversation) {
        // Only auto-select if nothing selected
        // setActiveConversation(res.data[0]); 
        // Actually, maybe don't auto-select for better UX
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
      if (err.response?.status === 401) logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setConversations([]);
    setActiveConversation(null);
  };

  const startNewChat = async () => {
    const username = prompt("Enter username to chat with:");
    if (!username) return;

    if (username === user.username) {
      alert("You cannot chat with yourself.");
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/chat/conversations', { participantUsername: username }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      let newConv = res.data;
      // Check if already in list to avoid duplicates
      const exists = conversations.find(c => c._id === newConv._id);

      if (!exists) {
        setConversations(prev => [...prev, newConv]);
      } else {
        newConv = exists;
      }

      setActiveConversation(newConv);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to start conversation. User might not exist.");
    }
  };

  if (!user) {
    return <Login onLogin={(u) => { setUser(u); fetchConversations(localStorage.getItem('token')); }} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/4 min-w-[250px] bg-white border-r flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2 text-blue-800">
            <MessageSquare className="text-blue-600" />
            TeamChat
          </h1>
          <button onClick={logout} title="Logout" className="text-gray-500 hover:text-red-600">
            <LogOut size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between p-3">
            <span className="text-xs font-semibold text-gray-500 uppercase">Conversations</span>
            <button onClick={startNewChat} className="text-blue-600 hover:text-blue-800" title="New Chat">
              <PlusCircle size={18} />
            </button>
          </div>

          {conversations.map(conv => {
            // Determine display name (other participant)
            const otherPart = conv.participants.find(p => p._id !== user.id && p.username !== user.username);
            const displayName = conv.name || (otherPart ? otherPart.username : 'Unknown');

            return (
              <div
                key={conv._id}
                onClick={() => setActiveConversation(conv)}
                className={`p-3 mx-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${activeConversation?._id === conv._id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {displayName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{displayName}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {/* Last message preview could go here */}
                    {conv.type === 'private' ? 'Private Chat' : 'Group'}
                  </div>
                </div>
              </div>
            );
          })}

          {conversations.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              <p className="mb-2">No active chats.</p>
              <button onClick={startNewChat} className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700">
                Start a Conversation
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold">
              {user.username[0].toUpperCase()}
            </div>
            <div className="text-sm font-medium">
              {user.username} (You)
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <ChatRoom conversation={activeConversation} currentUser={user} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={48} className="text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-500">Welcome to TeamChat</p>
            <p className="text-sm">Select a conversation or start a new one to begin messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
