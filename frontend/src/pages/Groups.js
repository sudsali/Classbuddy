import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Groups.css';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    subject: '',
    max_members: 5
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchGroups();
  }, []);

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
            <div key={group.id} className="group-card">
              <h3>{group.name}</h3>
              <p className="group-subject">Subject: {group.subject}</p>
              <p className="group-description">{group.description}</p>
              <div className="group-footer">
                <span>{group.members_count}/{group.max_members} members</span>
                {!group.is_member && group.members_count < group.max_members && (
                  <button 
                    className="join-group-btn"
                    onClick={() => handleJoinGroup(group.id)}
                  >
                    Join Group
                  </button>
                )}
                {group.is_member && (
                  <>
                    <span className="member-badge">Member</span>
                    <button 
                      className="leave-group-btn"
                      onClick={() => handleLeaveGroup(group.id)}
                    >
                      Leave Group
                    </button>
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
    </div>
  );
};

export default Groups; 