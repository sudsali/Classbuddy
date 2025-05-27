import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  const fetchChats = useCallback(async () => {
    try {
      setError('');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/direct-messages/chats/`);
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Error fetching chats. Please try again later.');
    }
  }, []);

  const fetchMessages = useCallback(async (chatId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/direct-messages/chats/${chatId}/messages/`);
      setMessages(response.data);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      const interval = setInterval(() => fetchMessages(selectedChat.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChat, fetchMessages]);

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
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/direct-messages/chats/get_or_create_chat/`, {
        email: email.trim()
      });
      
      const chatData = response.data;
      
      // Add to chats list regardless of messages
      setChats(prevChats => {
        const chatExists = prevChats.some(chat => chat.id === chatData.id);
        if (!chatExists) {
          return [...prevChats, chatData];
        }
        return prevChats;
      });
      
      // Clear messages and set selected chat
      setMessages([]);
      setSelectedChat(chatData);
      setShowNewChatModal(false);
      setEmail('');
      
      // Fetch messages for the new chat
      if (chatData.id) {
        fetchMessages(chatData.id);
      }
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

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/direct-messages/messages/`, messageData);
      
      if (!chats.some(chat => chat.id === selectedChat.id)) {
        const chatResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/direct-messages/chats/${selectedChat.id}/`);
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
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/direct-messages/chats/${chat.id}/`);
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
      {error && (
        <div role="alert" className="error-banner">
          {error}
        </div>
      )}
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
                    aria-label="Delete chat"
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
                  role="article"
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
                aria-label="Confirm delete chat"
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