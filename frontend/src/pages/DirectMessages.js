import React, { useState, useEffect, useRef } from 'react';
import { FaPlus } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/DirectMessages.css';

const DirectMessages = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  useEffect(() => {
    fetchChats();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      const interval = setInterval(() => fetchMessages(selectedChat.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      const response = await axios.get('/api/direct-messages/chats/');
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users/');
      setUsers(response.data.filter(u => u.id !== user.id));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await axios.get(`/api/direct-messages/chats/${chatId}/messages/`);
      setMessages(response.data);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setMessages([]);
    fetchMessages(chat.id);
  };

  const handleNewChat = async (e) => {
    e.preventDefault();
    setEmailError('');
    
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    try {
      const response = await axios.post('/api/direct-messages/chats/get_or_create_chat/', {
        email: email.trim()
      });
      
      // Only add to chats list if it has messages
      if (response.data.last_message) {
        setChats(prevChats => {
          const chatExists = prevChats.some(chat => chat.id === response.data.id);
          if (!chatExists) {
            return [...prevChats, response.data];
          }
          return prevChats;
        });
      }
      
      // Clear messages when starting a new chat
      setMessages([]);
      setSelectedChat(response.data);
      setShowNewChatModal(false);
      setEmail('');
    } catch (error) {
      if (error.response) {
        setEmailError(error.response.data.error || 'Failed to start chat');
      } else {
        setEmailError('Failed to start chat');
      }
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        content: newMessage,
        receiver: selectedChat.participants.find(p => p.id !== user.id).id
      };

      const response = await axios.post('/api/direct-messages/messages/', messageData);
      
      if (!chats.some(chat => chat.id === selectedChat.id)) {
        const chatResponse = await axios.get(`/api/direct-messages/chats/${selectedChat.id}/`);
        setChats(prevChats => [...prevChats, chatResponse.data]);
      } else {
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === selectedChat.id 
              ? { ...chat, last_message: response.data }
              : chat
          )
        );
      }
      
      setMessages(prevMessages => [...prevMessages, response.data]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteChat = async (chat) => {
    try {
      await axios.delete(`/api/direct-messages/chats/${chat.id}/`);
      setChats(chats.filter(c => c.id !== chat.id));
      if (selectedChat?.id === chat.id) {
        setSelectedChat(null);
      }
      setShowDeleteConfirmModal(false);
      setChatToDelete(null);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  return (
    <div className="direct-messages-container">
      <div className="chat-list">
        <div className="chat-list-header">
          <h2>Direct Messages</h2>
          <button className="new-chat-btn" onClick={() => setShowNewChatModal(true)}>
            <FaPlus />
          </button>
        </div>
        <div className="chats">
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`chat-item ${selectedChat?.id === chat.id ? 'selected' : ''}`}
              onClick={() => handleChatSelect(chat)}
            >
              <div className="chat-item-info">
                <div className="chat-item-header">
                  <span className="chat-name">
                    {(() => {
                      const participant = chat.participants.find(p => p.id !== user.id);
                      return `${participant?.first_name} ${participant?.last_name}`;
                    })()}
                  </span>
                  <button
                    className="delete-chat-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setChatToDelete(chat);
                      setShowDeleteConfirmModal(true);
                    }}
                  >
                    Delete
                  </button>
                </div>
                {chat.last_message && (
                  <span className="last-message">
                    {chat.last_message.content.substring(0, 30)}
                    {chat.last_message.content.length > 30 ? '...' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-window">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <h2>
                {(() => {
                  const participant = selectedChat.participants.find(p => p.id !== user.id);
                  return `${participant?.first_name} ${participant?.last_name}`;
                })()}
              </h2>
            </div>

            <div className="messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.sender.id === user.id ? 'message-own' : 'message-other'}`}
                >
                  <div className="message-header">
                    <span className="message-sender">
                      {message.sender.first_name} {message.sender.last_name}
                    </span>
                    <span className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-content">{message.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="chat-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="chat-input-field"
              />
              <div className="chat-actions">
                <button type="submit" className="chat-send-btn">
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select a chat or start a new conversation</p>
          </div>
        )}
      </div>

      {showNewChatModal && (
        <div className="modal-overlay">
          <div className="modal new-chat-modal">
            <h2>New Chat</h2>
            <form onSubmit={handleNewChat} className="new-chat-form">
              <div className="form-group">
                <label htmlFor="email">Enter user's email:</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className={emailError ? 'error' : ''}
                />
                {emailError && <div className="error-message">{emailError}</div>}
              </div>
              <div className="modal-buttons">
                <button
                  type="submit"
                  className="start-chat-btn"
                  disabled={!email.trim()}
                >
                  Start Chat
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowNewChatModal(false);
                    setEmail('');
                    setEmailError('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && (
        <div className="modal-overlay">
          <div className="modal delete-chat-modal">
            <h2>Delete Chat</h2>
            <p>Are you sure you want to delete this chat? This action cannot be undone.</p>
            <div className="modal-buttons">
              <button
                className="delete-btn"
                onClick={() => handleDeleteChat(chatToDelete)}
              >
                Delete
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setChatToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectMessages; 