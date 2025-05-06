import React from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './GroupCard.css';

const GroupCard = ({ group, onGroupUpdated }) => {
  const handleJoin = async () => {
    try {
      await axios.post(`/api/study-groups/join/${group.id}/`);
      toast.success('Successfully joined the group!');
      onGroupUpdated();
    } catch (error) {
      toast.error('Failed to join group. Please try again.');
    }
  };

  const handleLeave = async () => {
    try {
      await axios.post(`/api/study-groups/leave/${group.id}/`);
      toast.success('Successfully left the group!');
      onGroupUpdated();
    } catch (error) {
      toast.error('Failed to leave group. Please try again.');
    }
  };

  const handleDismiss = async () => {
    try {
      await axios.post(`/api/study-groups/dismiss/${group.id}/`);
      toast.success('Group dismissed successfully!');
      onGroupUpdated();
    } catch (error) {
      toast.error('Failed to dismiss group. Please try again.');
    }
  };

  return (
    <div className="group-card">
      <div className="group-card-header">
        <h3>{group.name}</h3>
        {group.is_creator && <span className="owner-badge">Owner</span>}
      </div>
      <div className="group-card-content">
        <p className="subject">Subject: {group.subject}</p>
        <p className="description">{group.description}</p>
        <p className="member-count">{group.members_count}/{group.max_members} members</p>
      </div>
      <div className="group-card-actions">
        {!group.is_member && !group.is_creator && (
          <button onClick={handleJoin} className="join-button">
            Join Group
          </button>
        )}
        {group.is_member && !group.is_creator && (
          <button onClick={handleLeave} className="leave-button">
            Leave Group
          </button>
        )}
        {group.is_creator && (
          <button onClick={handleDismiss} className="dismiss-button">
            Dismiss Group
          </button>
        )}
      </div>
    </div>
  );
};

export default GroupCard; 