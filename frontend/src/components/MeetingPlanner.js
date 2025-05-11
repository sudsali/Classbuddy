import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import { useMeeting } from '../context/MeetingContext';
import 'react-calendar/dist/Calendar.css';
import './MeetingPlanner.css';

const MeetingPlanner = () => {
  const navigate = useNavigate();
  const { createMeeting, error: apiError } = useMeeting();
  const [formData, setFormData] = useState({
    title: '',
    date: new Date(),
    time: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.time) {
      newErrors.time = 'Please enter a valid time (HH:MM)';
    } else {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.time)) {
        newErrors.time = 'Please enter a valid time (HH:MM)';
      }
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
    
    // Validate on change
    const newErrors = { ...errors };
    if (name === 'title') {
      if (!value.trim()) {
        newErrors.title = 'Title is required';
      } else if (value.length > 100) {
        newErrors.title = 'Title must be less than 100 characters';
      } else {
        delete newErrors.title;
      }
    } else if (name === 'time') {
      if (!value) {
        newErrors.time = 'Please enter a valid time (HH:MM)';
      } else {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(value)) {
          newErrors.time = 'Please enter a valid time (HH:MM)';
        } else {
          delete newErrors.time;
        }
      }
    }
    setErrors(newErrors);
    
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      date
    }));
    if (errors.date) {
      setErrors(prev => ({
        ...prev,
        date: ''
      }));
    }
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await createMeeting({
        ...formData,
        date: formData.date.toISOString().split('T')[0]
      });
      navigate('/meetings');
    } catch (err) {
      console.error('Error creating meeting:', err);
      setSubmitError('Error creating meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="meeting-planner">
      <h2>Schedule a Meeting</h2>
      <form onSubmit={handleSubmit} className="meeting-form">
        <div className="form-group">
          <label htmlFor="title">Meeting Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={errors.title ? 'error' : ''}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <div id="title-error" className="error-message" role="alert" data-testid="title-error">
              {errors.title}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <div data-testid="date-picker">
            <input
              type="hidden"
              id="date"
              name="date"
              value={formData.date}
            />
            <div data-testid="mock-calendar">
              <Calendar
                onChange={handleDateChange}
                value={formData.date}
                minDate={new Date()}
                className={errors.date ? 'error' : ''}
                aria-labelledby="date-label"
              />
            </div>
          </div>
          {errors.date && (
            <div id="date-error" className="error-message" role="alert" data-testid="date-error">
              {errors.date}
            </div>
          )}
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
            aria-invalid={!!errors.time}
            aria-describedby={errors.time ? 'time-error' : undefined}
            data-testid="time-input"
          />
          {errors.time && (
            <div id="time-error" className="error-message" role="alert" data-testid="time-error">
              {errors.time}
            </div>
          )}
        </div>

        {submitError && (
          <div className="error-message" role="alert" data-testid="submit-error">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          className="submit-button"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Meeting'}
        </button>
      </form>
    </div>
  );
};

export default MeetingPlanner; 