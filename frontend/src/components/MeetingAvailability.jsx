import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './MeetingAvailability.css';

const MeetingAvailability = ({ meetingId }) => {
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availability, setAvailability] = useState({});

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/meetings/${meetingId}/`, {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` }
        });
        setMeeting(response.data);
        
        // Initialize availability state
        const initialAvailability = {};
        response.data.dates.forEach(date => {
          initialAvailability[date.id] = false;
        });
        setAvailability(initialAvailability);
      } catch (error) {
        console.error('Error fetching meeting:', error);
        setError('Failed to load meeting information');
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingId]);

  const handleAvailabilityChange = async (dateId, isAvailable) => {
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/meetings/${meetingId}/set_availability/`,
        {
          date_id: dateId,
          is_available: isAvailable
        },
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` }
        }
      );
      
      setAvailability(prev => ({
        ...prev,
        [dateId]: isAvailable
      }));
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading-message">Loading meeting information...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!meeting) {
    return <div className="error-message">Meeting not found</div>;
  }

  return (
    <div className="meeting-availability">
      <h2>Select Your Availability</h2>
      <p className="meeting-title">{meeting.title}</p>
      
      <div className="availability-calendar">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileClassName={({ date }) => {
            const meetingDate = meeting.dates.find(d => d.date === date.toISOString().split('T')[0]);
            if (meetingDate) {
              return availability[meetingDate.id] ? 'available-date' : 'unavailable-date';
            }
            return null;
          }}
        />
      </div>

      <div className="availability-list">
        <h3>Available Time Slots</h3>
        {meeting.dates.map(date => (
          <div key={date.id} className="time-slot">
            <div className="date-info">
              <span className="date">{new Date(date.date).toLocaleDateString()}</span>
              <span className="time-range">{date.earliest_time} - {date.latest_time}</span>
            </div>
            <div className="availability-toggle">
              <button
                className={`toggle-button ${availability[date.id] ? 'available' : ''}`}
                onClick={() => handleAvailabilityChange(date.id, !availability[date.id])}
              >
                {availability[date.id] ? 'Available' : 'Not Available'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="availability-summary">
        <h3>Group Availability Summary</h3>
        {meeting.dates.map(date => (
          <div key={date.id} className="summary-item">
            <span className="date">{new Date(date.date).toLocaleDateString()}</span>
            <span className="time-range">{date.earliest_time} - {date.latest_time}</span>
            <span className="availability-count">
              {meeting.availabilities.filter(a => a.date === date.id && a.is_available).length} / {meeting.study_group.members_count} available
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingAvailability; 