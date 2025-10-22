import React, { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { 
  MessageSquare, Search, Send, Paperclip, 
  Smile, Phone, Video, MoreHorizontal, Check
} from 'lucide-react';
import './Messages.css';

const MessagesSimple = () => {
  const { address, isConnected } = useWallet();
  const { isAuthenticated } = useWalletAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');

  // Mock conversations
  const conversations = [
    {
      id: 1,
      name: 'TechCorp DAO',
      avatar: '🏢',
      lastMessage: '¿Cuándo puedes empezar el proyecto?',
      timestamp: '2h ago',
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: 'DeFi Protocol',
      avatar: '💎',
      lastMessage: 'Perfecto, gracias por la actualización',
      timestamp: '5h ago',
      unread: 0,
      online: false
    },
    {
      id: 3,
      name: 'StartupXYZ',
      avatar: '🚀',
      lastMessage: 'Te envié el contrato para revisar',
      timestamp: '1d ago',
      unread: 1,
      online: true
    }
  ];

  // Mock messages for selected chat
  const messages = selectedChat ? [
    { id: 1, sender: 'them', text: 'Hola! ¿Tienes disponibilidad para un nuevo proyecto?', time: '10:30 AM' },
    { id: 2, sender: 'me', text: 'Sí, claro. ¿De qué se trata?', time: '10:32 AM' },
    { id: 3, sender: 'them', text: '¿Cuándo puedes empezar el proyecto?', time: '10:35 AM' }
  ] : [];

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    console.log('Sending:', messageText);
    setMessageText('');
  };

  if (!isConnected) {
    return (
      <div className="messages-container">
        <div className="empty-state">
          <MessageSquare size={64} className="empty-icon" />
          <h2>Conecta tu wallet</h2>
          <p>Conecta tu wallet para acceder a tus mensajes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      {/* Hero Header */}
      <div className="messages-hero">
        <div className="hero-left">
          <div className="hero-icon">
            <MessageSquare size={48} />
          </div>
          <div className="hero-info">
            <div className="title-section">
              <h1 className="messages-title">Mensajes</h1>
              <div className="title-accent"></div>
            </div>
            <p className="messages-subtitle">Chats y notificaciones con clientes</p>
          </div>
        </div>
      </div>

      {/* Messages Layout */}
      <div className="messages-layout glass-card">
        {/* Conversations List */}
        <div className="conversations-list">
          <div className="conversations-header">
            <h3>Conversaciones</h3>
            <div className="search-box">
              <Search size={16} />
              <input type="text" placeholder="Buscar..." />
            </div>
          </div>
          <div className="conversations">
            {conversations.map((conv) => (
              <div 
                key={conv.id}
                className={`conversation-item ${selectedChat === conv.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(conv.id)}
              >
                <div className="conversation-avatar">
                  {conv.avatar}
                  {conv.online && <div className="online-dot"></div>}
                </div>
                <div className="conversation-content">
                  <div className="conversation-header">
                    <h4>{conv.name}</h4>
                    <span className="timestamp">{conv.timestamp}</span>
                  </div>
                  <p className="last-message">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <div className="unread-badge">{conv.unread}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <div className="chat-user-info">
                  <div className="chat-avatar">
                    {conversations.find(c => c.id === selectedChat)?.avatar}
                  </div>
                  <div>
                    <h3>{conversations.find(c => c.id === selectedChat)?.name}</h3>
                    <span className="status">
                      {conversations.find(c => c.id === selectedChat)?.online ? 'En línea' : 'Desconectado'}
                    </span>
                  </div>
                </div>
                <div className="chat-actions">
                  <button className="action-btn" title="Llamada de voz">
                    <Phone size={20} />
                  </button>
                  <button className="action-btn" title="Videollamada">
                    <Video size={20} />
                  </button>
                  <button className="action-btn" title="Más opciones">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>

              <div className="messages-area">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.sender}`}>
                    <div className="message-bubble">
                      <p>{msg.text}</p>
                      <span className="message-time">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="message-input-area">
                <button className="attach-btn" title="Adjuntar archivo">
                  <Paperclip size={20} />
                </button>
                <button className="emoji-btn" title="Emoji">
                  <Smile size={20} />
                </button>
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button className="send-btn" onClick={handleSendMessage}>
                  <Send size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <MessageSquare size={64} />
              <h3>Selecciona una conversación</h3>
              <p>Elige un contacto para comenzar a chatear</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesSimple;

