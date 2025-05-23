import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import './CreateMeetingForm.css';

const CreateMeetingForm = ({ onMeetingCreated }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/study-groups/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to load groups');
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = 'Title is required';
    }
    if (!selectedGroup) {
      errors.study_group = 'Please select a study group';
    }
    if (!date) {
      errors.date = 'Date is required';
    }
    if (!time) {
      errors.time = 'Time is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/meetings/`,
        {
          title,
          description,
          study_group_id: selectedGroup,
          date,
          time
        },
        {
          headers: {
            'Authorization': `Token ${token}`
          }
        }
      );

      onMeetingCreated(response.data);
      // Reset form
      setTitle('');
      setDescription('');
      setSelectedGroup('');
      setDate('');
      setTime('');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.study_group_id?.[0] ||
                          'Failed to create meeting';
      setError(errorMessage);
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
          <label htmlFor="title">Meeting Title *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={validationErrors.title ? 'error' : ''}
          />
          {validationErrors.title && (
            <div className="error-message">{validationErrors.title}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="study_group">Study Group *</label>
          <select
            id="study_group"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className={validationErrors.study_group ? 'error' : ''}
          >
            <option value="">Select a study group</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {validationErrors.study_group && (
            <div className="error-message">{validationErrors.study_group}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="date">Date *</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={validationErrors.date ? 'error' : ''}
          />
          {validationErrors.date && (
            <div className="error-message">{validationErrors.date}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="time">Time *</label>
          <input
            type="time"
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={validationErrors.time ? 'error' : ''}
          />
          {validationErrors.time && (
            <div className="error-message">{validationErrors.time}</div>
          )}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Meeting'}
        </button>
      </form>
    </div>
  );
};

export default CreateMeetingForm; 