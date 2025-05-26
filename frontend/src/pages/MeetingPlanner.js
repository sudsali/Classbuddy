import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './MeetingPlanner.css';

const localizer = momentLocalizer(moment);

const MeetingPlanner = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [studyGroups, setStudyGroups] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    study_group: ''
  });

  // Get the auth token from sessionStorage
  const getAuthToken = () => {
    return sessionStorage.getItem('token');
  };

  // Create axios instance with auth header
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
      'Authorization': `Token ${getAuthToken()}`
    }
  });

  const fetchMeetings = useCallback(async () => {
    try {
      const response = await api.get('/api/meetings/');
      setMeetings(response.data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setError('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchStudyGroups = useCallback(async () => {
    try {
      const response = await api.get('/api/study-groups/');
      setStudyGroups(response.data);
    } catch (error) {
      console.error('Error fetching study groups:', error);
    }
  }, [api]);

  useEffect(() => {
    fetchMeetings();
    fetchStudyGroups();
  }, [fetchMeetings, fetchStudyGroups]);

  // Handle input changes for the meeting creation form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission to create a new meeting
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting meeting data:', formData); // Debug log

      // First, get the study group details
      const groupResponse = await api.get(`/api/study-groups/${formData.study_group}/`);
      const studyGroup = groupResponse.data;

      // Create the meeting with properly formatted data
      const meetingData = {
        title: formData.title,
        description: formData.description,
        study_group_id: formData.study_group // Make sure this matches the serializer field
      };

      console.log('Sending meeting data to API:', meetingData); // Debug log

      const response = await api.post('/api/meetings/', meetingData);
      console.log('Meeting creation response:', response.data); // Debug log

      // Add the study group details to the meeting data
      const newMeeting = {
        ...response.data,
        study_group: studyGroup
      };

      // Update the meetings list
      setMeetings(prev => [...prev, newMeeting]);
      setSelectedMeeting(newMeeting);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        study_group: ''
      });
      setFormVisible(false);
    } catch (error) {
      console.error('Error creating meeting:', error);
      console.error('Error response data:', error.response?.data); // Log the error response
      setError(error.response?.data?.error || 'Failed to create meeting. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="meeting-planner">
      <div className="meeting-planner-header">
        <div className="header-left">
          <button 
            className="back-button"
            onClick={() => navigate('/groups')}
          >
            ← Back to Groups
          </button>
          <h1>Meeting Planner</h1>
        </div>
        <button 
          className="create-meeting-btn"
          onClick={() => setFormVisible(!formVisible)}
        >
          {formVisible ? 'Cancel' : 'Create New Meeting'}
        </button>
      </div>

      {formVisible && (
        <div className="create-meeting-form">
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
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="study_group">Study Group</label>
              <select
                id="study_group"
                name="study_group"
                value={formData.study_group}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a study group</option>
                {studyGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Create Meeting</button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setFormVisible(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="meeting-planner-content">
        <div className="meetings-list">
          <h2>Your Meetings</h2>
          {error && <div className="error-message">{error}</div>}
          {meetings.length === 0 ? (
            <p className="empty-state">No meetings found. Create a new meeting to get started.</p>
          ) : (
            <div className="meetings-grid">
              {meetings.map(meeting => (
                <div
                  key={meeting.id}
                  className={`meeting-card ${selectedMeeting?.id === meeting.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMeeting(meeting)}
                >
                  <h3>{meeting.title}</h3>
                  <p>{meeting.description}</p>
                  <div className="meeting-meta">
                    <span>Group: {meeting.study_group.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedMeeting && (
          <div className="calendar-section">
            <div className="calendar-header">
              <h2>{selectedMeeting.title}</h2>
              <p className="calendar-description">
                Click and drag on the calendar to select time slots when you're available.
                Other members' availability will appear in color-coded blocks.
              </p>
            </div>
            <MeetingCalendar
              meetingId={selectedMeeting.id}
              groupId={selectedMeeting.study_group.id}
              api={api}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Extracted the calendar component for better organization
const MeetingCalendar = ({ meetingId, groupId, api }) => {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overlaps, setOverlaps] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [tempEvent, setTempEvent] = useState(null);

  // Clear all states when meetingId changes
  useEffect(() => {
    setEvents([]);
    setMembers([]);
    setOverlaps([]);
    setSelectedSlot(null);
    setTempEvent(null);
    setLoading(true);
  }, [meetingId]);

  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/meetings/${meetingId}/availability/`);
      // Ensure response.data is an array before mapping
      const availabilityData = Array.isArray(response.data) ? response.data : [];
      const calendarEvents = availabilityData.map(slot => ({
        id: slot.id,
        title: `${slot.user.first_name} ${slot.user.last_name}`,
        start: new Date(slot.start_time),
        end: new Date(slot.end_time),
        user: slot.user,
      }));
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [api, meetingId]);

  const fetchGroupMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/study-groups/${groupId}/members/`);
      // Ensure response.data is an array before setting
      setMembers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching group members:', error);
      setMembers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [api, groupId]);

  const calculateOverlaps = useCallback(() => {
    if (!Array.isArray(events) || events.length === 0) {
      setOverlaps([]);
      return;
    }

    // Group events by their time slots
    const timeSlotMap = {};
    
    events.forEach(event => {
      if (!event.start || !event.end) return; // Skip invalid events
      
      const startTime = event.start.getTime();
      const endTime = event.end.getTime();
      const key = `${startTime}-${endTime}`;
      
      if (!timeSlotMap[key]) {
        timeSlotMap[key] = {
          start: event.start,
          end: event.end,
          users: [event.user],
          count: 1
        };
      } else {
        timeSlotMap[key].users.push(event.user);
        timeSlotMap[key].count++;
      }
    });
    
    // Convert to array of overlaps
    const overlapArray = Object.values(timeSlotMap)
      .filter(slot => slot.count > 1)
      .map((slot, index) => ({
        id: `overlap-${index}`,
        title: `${slot.count} members available`,
        start: slot.start,
        end: slot.end,
        users: slot.users,
        count: slot.count,
        isOverlap: true
      }))
      .sort((a, b) => b.count - a.count); // Sort by most overlap first
    
    setOverlaps(overlapArray);
  }, [events]);

  useEffect(() => {
    fetchAvailability();
    fetchGroupMembers();
  }, [meetingId, groupId, fetchAvailability, fetchGroupMembers]);

  useEffect(() => {
    calculateOverlaps();
  }, [events, calculateOverlaps]);

  const handleSelect = async ({ start, end }) => {
    try {
      // Create a temporary event for immediate display
      const tempEvent = {
        id: 'temp-' + Date.now(),
        title: 'Your Availability',
        start: start,
        end: end,
        user: { id: 'temp', first_name: 'You', last_name: '' },
        isTemp: true
      };
      setTempEvent(tempEvent);

      // Format the dates to ISO string format
      const startTime = start.toISOString();
      const endTime = end.toISOString();

      console.log('Sending availability data:', { start_time: startTime, end_time: endTime });

      const response = await api.post(`/api/meetings/${meetingId}/availability/`, {
        start_time: startTime,
        end_time: endTime,
      });
      
      // Safely handle the response data
      if (response?.data) {
        // Add new availability to events
        const newEvent = {
          id: response.data.id || `event-${Date.now()}`,
          title: response.data.user ? 
            `${response.data.user.first_name || 'User'} ${response.data.user.last_name || ''}` :
            'Your Availability',
          start: new Date(response.data.start_time || startTime),
          end: new Date(response.data.end_time || endTime),
          user: response.data.user || { id: 'temp', first_name: 'You', last_name: '' },
        };

        setEvents(prev => [...prev, newEvent]);
        setSelectedSlot(newEvent);
      } else {
        // If response data is not in expected format, create a basic event
        const newEvent = {
          id: `event-${Date.now()}`,
          title: 'Your Availability',
          start: start,
          end: end,
          user: { id: 'temp', first_name: 'You', last_name: '' },
        };
        setEvents(prev => [...prev, newEvent]);
        setSelectedSlot(newEvent);
      }

      setTempEvent(null);

      // Refresh the availability data
      await fetchAvailability();
    } catch (error) {
      console.error('Error adding availability:', error);
      console.error('Error response:', error.response?.data);
      
      // Create a basic event even if the API call fails
      const newEvent = {
        id: `event-${Date.now()}`,
        title: 'Your Availability',
        start: start,
        end: end,
        user: { id: 'temp', first_name: 'You', last_name: '' },
      };
      setEvents(prev => [...prev, newEvent]);
      setSelectedSlot(newEvent);
      
      setTempEvent(null);
    }
  };

  const eventPropGetter = (event) => {
    if (event.isTemp) {
      return {
        style: {
          backgroundColor: 'rgba(0, 123, 255, 0.5)',
          borderRadius: '4px',
          color: 'white',
          border: '2px dashed #007bff',
          display: 'block'
        }
      };
    }

    if (event.isOverlap) {
      // Enhanced style for overlapping slots based on member count
      // More members = darker color
      const maxMembers = members.length;
      
      // Calculate how much to darken based on member count
      const ratio = Math.min(event.count / maxMembers, 1); // Normalized ratio of available members
      const lightness = 50 - (ratio * 25); // Will go from 50% to 25% lightness as more members are available
      const darkerColor = `hsl(120, 45%, ${lightness}%)`;
      
      return {
        style: {
          backgroundColor: darkerColor,
          borderRadius: '4px',
          color: 'white',
          fontWeight: 'bold',
          border: '2px solid #2e7d32',
          display: 'block'
        }
      };
    }
    
    // Style for individual availability
    const userIndex = members.findIndex(m => m.id === event.user.id);
    const hue = (userIndex * 137.5) % 360; // Golden ratio for better color distribution
    
    return {
      style: {
        backgroundColor: `hsl(${hue}, 70%, 50%)`,
        borderRadius: '4px',
        opacity: 0.75,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  if (loading) {
    return <div>Loading calendar...</div>;
  }

  // Combine regular events, overlaps, and temporary event for display
  const displayEvents = [...events, ...overlaps];
  if (tempEvent) {
    displayEvents.push(tempEvent);
  }

  return (
    <div className="meeting-planner-calendar">
      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={displayEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          selectable
          onSelectSlot={handleSelect}
          eventPropGetter={eventPropGetter}
          views={['month', 'week', 'day']}
          defaultView="week"
          tooltipAccessor={(event) => {
            if (event.isTemp) {
              return 'Your selected availability';
            }
            if (event.isOverlap) {
              return `${event.count} members available: ${event.users.map(u => `${u.first_name} ${u.last_name}`).join(', ')}`;
            }
            return event.title;
          }}
          onSelectEvent={(event) => setSelectedSlot(event)}
          selected={selectedSlot}
        />
      </div>
      <div className="sidebar">
        <div className="legend">
          <h3>Member Availability</h3>
          {members.length === 0 ? (
            <p>No members in this group</p>
          ) : (
            <>
              {members.map((member, index) => {
                const hue = (index * 137.5) % 360;
                return (
                  <div key={member.id} className="legend-item">
                    <div 
                      className="color-box" 
                      style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
                    />
                    <span>{member.first_name} {member.last_name}</span>
                  </div>
                );
              })}

              {/* Overlapping availabilities legend section */}
              <div className="legend-section">
                <h4>Availability Overlap</h4>
                <div className="overlap-gradient">
                  <div className="legend-item overlap">
                    <div 
                      className="color-box" 
                      style={{ backgroundColor: `hsl(120, 45%, 50%)` }}
                    />
                    <span>Low overlap (2 members)</span>
                  </div>
                  <div className="legend-item overlap">
                    <div 
                      className="color-box" 
                      style={{ backgroundColor: `hsl(120, 45%, 40%)` }}
                    />
                    <span>Medium overlap</span>
                  </div>
                  <div className="legend-item overlap">
                    <div 
                      className="color-box" 
                      style={{ backgroundColor: `hsl(120, 45%, 25%)` }}
                    />
                    <span>High overlap (all members)</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {overlaps.length > 0 && (
          <div className="best-times">
            <h3>Best Meeting Times</h3>
            <div className="best-times-list">
              {overlaps.slice(0, 5).map((overlap, index) => (
                <div key={overlap.id} className="best-time-item">
                  <div className="best-time-header">
                    <span className="best-time-rank">{index + 1}</span>
                    <span className="best-time-count">{overlap.count} members</span>
                  </div>
                  <div className="best-time-details">
                    <div>
                      <strong>{moment(overlap.start).format('ddd, MMM D')}</strong>
                    </div>
                    <div className="best-time-hours">
                      {moment(overlap.start).format('h:mm A')} - {moment(overlap.end).format('h:mm A')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingPlanner;