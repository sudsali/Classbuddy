import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './GroupDetailsModal.css';

const GroupDetailsModal = ({ isOpen, onClose, group, onGroupUpdated }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && group) {
      fetchMessages();
    }
  }, [isOpen, group]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/study-groups/${group.id}/messages/`);
      setMessages(response.data);
    } catch (error) {
      toast.error('Failed to load messages. Please try again.');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`/api/study-groups/${group.id}/upload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('File uploaded successfully!');
      onGroupUpdated();
    } catch (error) {
      toast.error('Failed to upload file. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await axios.post(`/api/study-groups/${group.id}/messages/`, {
        content: newMessage,
      });
      setNewMessage('');
      toast.success('Message sent successfully!');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{group.name}</h2>
          <button onClick={onClose} className="close-button">Close</button>
        </div>

        <div className="modal-body">
          <div className="group-info">
            <p><strong>Subject:</strong> {group.subject}</p>
            <p><strong>Description:</strong> {group.description}</p>
            <p><strong>Members:</strong> {group.members_count}/{group.max_members}</p>
          </div>

          <div className="members-list">
            <h3>Members</h3>
            <ul>
              {group.members.map((member) => (
                <li key={member.id}>
                  {member.first_name} {member.last_name}
                  <span className="member-email">{member.email}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="messages-section">
            <h3>Messages</h3>
            <div className="messages-list">
              {messages.map((message) => (
                <div key={message.id} className="message">
                  <div className="message-header">
                    <span className="sender" data-testid="message-sender">
                      {message.sender.first_name} {message.sender.last_name}
                    </span>
                    <span className="timestamp">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="message-content" data-testid="message-content">
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="message-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>

          <div className="file-upload">
            <label htmlFor="file-upload">Upload File</label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              aria-label="Upload File"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsModal; 