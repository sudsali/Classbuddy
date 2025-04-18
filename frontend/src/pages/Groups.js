import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Groups.css';
import { FaPencilAlt } from 'react-icons/fa';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    subject: '',
    max_members: 5
  });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messagePollingInterval, setMessagePollingInterval] = useState(null);
  const [editGroupData, setEditGroupData] = useState({
    name: '',
    description: '',
    subject: '',
    max_members: 5
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (showChatModal && selectedGroup) {
      fetchMessages(selectedGroup.id);
      
      const interval = setInterval(() => {
        fetchMessages(selectedGroup.id);
      }, 3000);
      
      setMessagePollingInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        setMessagePollingInterval(null);
      }
    }
  }, [showChatModal, selectedGroup]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://127.0.0.1:8000/api/study-groups/', {
        headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
      });
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to load study groups. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/study-groups/', newGroup, {
        headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
      });
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '', subject: '', max_members: 5 });
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/study-groups/${groupId}/join/`, {}, {
        headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
      });
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to join group. Please try again.');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/study-groups/${groupId}/leave/`, {}, {
        headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
      });
      fetchGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        alert(error.response.data.detail);
      } else {
        alert('Failed to leave group. Please try again.');
      }
    }
  };

  const handleDismissGroup = async (groupId) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/study-groups/${groupId}/dismiss/`, {}, {
        headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
      });
      fetchGroups();
    } catch (error) {
      console.error('Error dismissing group:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        alert(error.response.data.detail);
      } else {
        alert('Failed to dismiss group. Please try again.');
      }
    }
  };

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setShowMembersModal(true);
  };

  const fetchMessages = async (groupId) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/study-groups/${groupId}/messages/`, {
        headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(`http://127.0.0.1:8000/api/study-groups/${selectedGroup.id}/create_message/`, {
        content: newMessage.trim()
      }, {
        headers: {
          'Authorization': `Token ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      setNewMessage('');
      fetchMessages(selectedGroup.id);
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        alert(error.response.data.detail);
      } else {
        alert('Failed to send message. Please try again.');
      }
    }
  };

  const handleEnterChat = (group) => {
    setSelectedGroup(group);
    setShowMembersModal(false);
    setShowChatModal(true);
  };

  const handleCloseChatModal = () => {
    setShowChatModal(false);
    setMessages([]);
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval);
      setMessagePollingInterval(null);
    }
  };

  const handleUpdateGroupTitle = async () => {
    try {
      await axios.patch(
        `http://127.0.0.1:8000/api/study-groups/${selectedGroup.id}/`,
        { name: editedTitle },
        {
          headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
        }
      );
      setSelectedGroup({ ...selectedGroup, name: editedTitle });
      setIsEditingTitle(false);
      fetchGroups(); // Refresh the groups list
    } catch (error) {
      console.error('Error updating group title:', error);
      if (error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else {
        alert('Failed to update group title. Please try again.');
      }
    }
  };

  const handleEditGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(
        `http://127.0.0.1:8000/api/study-groups/${selectedGroup.id}/`,
        editGroupData,
        {
          headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
        }
      );
      setShowEditModal(false);
      setSelectedGroup({ ...selectedGroup, ...editGroupData });
      fetchGroups(); // Refresh the groups list
    } catch (error) {
      console.error('Error updating group:', error);
      if (error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else {
        alert('Failed to update group. Please try again.');
      }
    }
  };

  const openEditModal = (group) => {
    setEditGroupData({
      name: group.name,
      description: group.description,
      subject: group.subject,
      max_members: group.max_members
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="groups-container">
        <div className="loading-message">Loading study groups...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="groups-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchGroups} className="retry-button">Try Again</button>
      </div>
    );
  }

  return (
    <div className="groups-container">
      <div className="groups-header">
        <h1>Study Groups</h1>
        <button 
          className="create-group-btn"
          onClick={() => setShowCreateModal(true)}
        >
          Create New Group
        </button>
      </div>

      <div className="groups-grid">
        {groups && groups.length > 0 ? (
          groups.map(group => (
            <div key={group.id} className="group-card" onClick={() => handleGroupClick(group)}>
              <h3>{group.name}</h3>
              <p className="group-subject">Subject: {group.subject}</p>
              <p className="group-description">{group.description}</p>
              <div className="group-footer">
                <span>{group.members_count}/{group.max_members} members</span>
                {!group.is_member && group.members_count < group.max_members && (
                  <button 
                    className="join-group-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinGroup(group.id);
                    }}
                  >
                    Join Group
                  </button>
                )}
                {group.is_member && (
                  <>
                    <span className={group.is_creator ? "owner-badge" : "member-badge"}>
                      {group.is_creator ? "Owner" : "Member"}
                    </span>
                    {group.is_creator ? (
                      <button 
                        className="dismiss-group-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissGroup(group.id);
                        }}
                      >
                        Dismiss Group
                      </button>
                    ) : (
                      <button 
                        className="leave-group-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveGroup(group.id);
                        }}
                      >
                        Leave Group
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-groups-message">
            No study groups available. Create one to get started!
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create New Study Group</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={newGroup.subject}
                  onChange={(e) => setNewGroup({...newGroup, subject: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Maximum Members</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={newGroup.max_members}
                  onChange={(e) => setNewGroup({...newGroup, max_members: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="create-btn">Create Group</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMembersModal && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="group-title-container">
                <h2>{selectedGroup.name}</h2>
                {selectedGroup.is_creator && (
                  <button 
                    className="edit-group-btn"
                    onClick={() => openEditModal(selectedGroup)}
                  >
                    <FaPencilAlt />
                    <span>Edit Group</span>
                  </button>
                )}
              </div>
              <h3>Members</h3>
            </div>
            <div className="members-list">
              <table>
                <colgroup>
                  <col className="col-name" />
                  <col className="col-email" />
                  <col className="col-role" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="col-name">Name</th>
                    <th className="col-email">Email</th>
                    <th className="col-role">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGroup.members.map(member => (
                    <tr key={member.id}>
                      <td className="col-name">{`${member.first_name} ${member.last_name}`}</td>
                      <td className="col-email">{member.email}</td>
                      <td className="col-role">
                        <span className={selectedGroup.creator === member.id ? "owner-badge" : "member-badge"}>
                          {selectedGroup.creator === member.id ? "Owner" : "Member"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-buttons">
              {selectedGroup && selectedGroup.is_member && (
                <button 
                  className="chat-btn"
                  onClick={() => {
                    setShowMembersModal(false);
                    setShowChatModal(true);
                  }}
                >
                  Enter Chat Room
                </button>
              )}
              <button 
                className="cancel-btn"
                onClick={() => setShowMembersModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showChatModal && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal chat-modal">
            <h2>{selectedGroup.name} - Chat Room</h2>
            <div className="chat-messages">
              {messages.map(message => (
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
            </div>
            <form onSubmit={sendMessage} className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="chat-input-field"
              />
              <button type="submit" className="chat-send-btn">
                Send
              </button>
            </form>
            <div className="modal-buttons">
              <button 
                className="cancel-btn"
                onClick={handleCloseChatModal}
              >
                Close Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Group</h2>
            <form onSubmit={handleEditGroup}>
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  value={editGroupData.name}
                  onChange={(e) => setEditGroupData({...editGroupData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={editGroupData.subject}
                  onChange={(e) => setEditGroupData({...editGroupData, subject: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editGroupData.description}
                  onChange={(e) => setEditGroupData({...editGroupData, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Maximum Members</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={editGroupData.max_members}
                  onChange={(e) => setEditGroupData({...editGroupData, max_members: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="save-btn">Save Changes</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups; 