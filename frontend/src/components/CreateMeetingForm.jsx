import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import './CreateMeetingForm.css';

const CreateMeetingForm = ({ onMeetingCreated }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/study-groups/`);
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to load groups');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/meetings/`, {
        title,
        description,
        study_group: selectedGroup,
      });

      onMeetingCreated(response.data);
      // Reset form
      setTitle('');
      setDescription('');
      setSelectedGroup('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-meeting-form">
      <h2>Create New Meeting</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="group">Select Group</label>
          <select
            id="group"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            required
          >
            <option value="">Select a group</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="title">Meeting Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter meeting title"
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter meeting description"
            rows="4"
          />
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Creating...' : 'Create Meeting'}
        </button>
      </form>
    </div>
  );
};

export default CreateMeetingForm; 