import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import './DirectMessages.css';

const DirectMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/direct-messages/conversations/');
      setConversations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(`/api/direct-messages/messages/?conversation=${conversationId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createNewChat = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // First, get the user ID from the email
      const userResponse = await axios.get(`/api/users/by-email/?email=${recipientEmail}`);
      const recipientId = userResponse.data.id;

      // Create a new conversation with the recipient
      const conversationResponse = await axios.post('/api/direct-messages/conversations/', {
        participants: [recipientId]
      });

      // Add the new conversation to the list and select it
      setConversations([...conversations, conversationResponse.data]);
      setSelectedConversation(conversationResponse.data);
      
      // Reset the form
      setRecipientEmail('');
      setShowNewChatModal(false);
    } catch (error) {
      console.error('Error creating chat:', error);
      setError(error.response?.data?.error || 'User not found or unable to create chat');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await axios.post('/api/direct-messages/messages/', {
        conversation: selectedConversation.id,
        content: newMessage
      });
      setNewMessage('');
      fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="direct-messages-container">
      <div className="conversations-list">
        <div className="conversations-header">
          <h2>Conversations</h2>
        </div>
        <button 
          className="create-chat-button"
          onClick={() => setShowNewChatModal(true)}
        >
          + Start New Chat
        </button>
        <div className="conversation-items">
          {conversations.map(conversation => (
            <div
              key={conversation.id}
              className={`conversation-item ${selectedConversation?.id === conversation.id ? 'selected' : ''}`}
              onClick={() => setSelectedConversation(conversation)}
            >
              {conversation.participants.map(participant => participant.full_name).join(', ')}
              {conversation.unread_count > 0 && (
                <span className="unread-count">{conversation.unread_count}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="messages-container">
        {selectedConversation ? (
          <>
            <div className="messages-header">
              <h3>
                {selectedConversation.participants.map(p => p.full_name).join(', ')}
              </h3>
            </div>
            <div className="messages-list">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`message ${message.sender.id === parseInt(localStorage.getItem('userId')) ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <div className="message-sender">{message.sender.full_name}</div>
                    <div className="message-text">{message.content}</div>
                    <div className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <form className="message-input" onSubmit={sendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="no-conversation-selected">
            Select a conversation to start messaging
          </div>
        )}
      </div>

      {showNewChatModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Start New Chat</h3>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={createNewChat}>
              <div className="form-group">
                <label htmlFor="recipientEmail">Recipient's Email:</label>
                <input
                  type="email"
                  id="recipientEmail"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowNewChatModal(false)}>
                  Cancel
                </button>
                <button type="submit">
                  Start Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectMessages; 