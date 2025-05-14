import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMeeting } from '../../services/api';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Meeting.css';

const Meeting = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.time) {
      newErrors.time = 'Time is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      date: date.toISOString().split('T')[0]
    }));
    // Clear date error when date is selected
    if (errors.date) {
      setErrors(prev => ({
        ...prev,
        date: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createMeeting(formData);
      navigate('/meetings');
    } catch (error) {
      setApiError('Error creating meeting. Please try again.');
      console.error('Error creating meeting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="meeting-form">
      <h2>Create New Meeting</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Meeting Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={errors.title ? 'error' : ''}
          />
          {errors.title && <div className="error-message">{errors.title}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="hidden"
            id="date"
            name="date"
            value={formData.date}
            aria-hidden="true"
          />
          <Calendar
            onChange={handleDateChange}
            value={formData.date ? new Date(formData.date) : null}
            minDate={new Date()}
            className={errors.date ? 'error' : ''}
          />
          {errors.date && <div className="error-message">{errors.date}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="time">Time</label>
          <input
            type="time"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleInputChange}
            className={errors.time ? 'error' : ''}
          />
          {errors.time && <div className="error-message">{errors.time}</div>}
        </div>

        {apiError && <div className="error-message">{apiError}</div>}

        <button
          type="submit"
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Meeting'}
        </button>
      </form>
    </div>
  );
};

export default Meeting; 