import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [calendarData, setCalendarData] = useState({
    events: [],
    members: [],
    loading: true,
    error: null
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [tempEvent, setTempEvent] = useState(null);

  // Fetch calendar data
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchCalendarData = async () => {
      try {
        // Only proceed if component is still mounted
        if (!isMounted) return;

        // Fetch both data in parallel with abort controller
        const [availabilityRes, groupRes] = await Promise.all([
          api.get(`/api/meetings/${meetingId}/availability/`, {
            signal: controller.signal
          }),
          api.get(`/api/study-groups/${groupId}/`, {
            signal: controller.signal
          })
        ]);

        // Only update state if component is still mounted
        if (!isMounted) return;

        // Process availability data
        const events = (availabilityRes.data || []).map(slot => ({
          id: slot.id,
          title: `${slot.user.first_name} ${slot.user.last_name}`,
          start: new Date(slot.start_time),
          end: new Date(slot.end_time),
          user: slot.user,
        }));

        // Process group members
        const members = groupRes.data?.members || [];

        setCalendarData({
          events,
          members,
          loading: false,
          error: null
        });
      } catch (error) {
        // Only handle errors if component is still mounted
        if (!isMounted) return;

        // Ignore cancellation errors
        if (error.name === 'CanceledError' || error.name === 'AbortError') {
          return;
        }
        
        console.error('Error fetching calendar data:', error);
        setCalendarData(prev => ({
          ...prev,
          loading: false,
          error: error.response?.data?.error || error.message || 'Failed to load calendar data'
        }));
      }
    };

    // Only fetch if we have both IDs
    if (meetingId && groupId) {
      fetchCalendarData();
    }

    // Cleanup function
    return () => {
      isMounted = false;
      // Only abort if there's an active request
      if (controller.signal.aborted === false) {
        controller.abort();
      }
    };
  }, [meetingId, groupId, api]);

  // Reset states when meeting changes
  useEffect(() => {
    setCalendarData(prev => ({
      ...prev,
      loading: true,
      error: null
    }));
    setSelectedSlot(null);
    setTempEvent(null);
  }, [meetingId]);

  const handleSelect = async ({ start, end }) => {
    try {
      // Create temporary event
      const tempEvent = {
        id: 'temp-' + Date.now(),
        title: 'Your Availability',
        start,
        end,
        user: { id: 'temp', first_name: 'You', last_name: '' },
        isTemp: true
      };
      setTempEvent(tempEvent);

      // Send availability to server
      const response = await api.post(`/api/meetings/${meetingId}/availability/`, {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      });

      // Add new availability to events
      const newEvent = {
        id: response.data.id,
        title: response.data.user ? 
          `${response.data.user.first_name} ${response.data.user.last_name}` :
          'Your Availability',
        start: new Date(response.data.start_time),
        end: new Date(response.data.end_time),
        user: response.data.user || { id: 'temp', first_name: 'You', last_name: '' },
      };

      setCalendarData(prev => ({
        ...prev,
        events: [...prev.events, newEvent]
      }));
      setSelectedSlot(newEvent);
      setTempEvent(null);
    } catch (error) {
      console.error('Error adding availability:', error);
      setTempEvent(null);
      setCalendarData(prev => ({
        ...prev,
        error: error.response?.data?.error || error.message || 'Failed to add availability'
      }));
    }
  };

  // Calculate overlaps whenever events change
  const overlaps = useMemo(() => {
    if (!calendarData.events.length) return [];

    const timeSlotMap = {};
    
    calendarData.events.forEach(event => {
      if (!event.start || !event.end) return;
      
      const key = `${event.start.getTime()}-${event.end.getTime()}`;
      
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
    
    return Object.values(timeSlotMap)
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
      .sort((a, b) => b.count - a.count);
  }, [calendarData.events]);

  // Style getter for calendar events
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
      const maxMembers = calendarData.members.length;
      const ratio = Math.min(event.count / maxMembers, 1);
      const lightness = 50 - (ratio * 25);
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
    const userIndex = calendarData.members.findIndex(m => m.id === event.user.id);
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

  if (calendarData.loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading calendar data...</p>
      </div>
    );
  }

  if (calendarData.error) {
    return (
      <div className="error-container">
        <p>Error: {calendarData.error}</p>
        <button 
          onClick={() => setCalendarData(prev => ({ ...prev, loading: true, error: null }))}
          className="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  // Combine regular events, overlaps, and temporary event for display
  const displayEvents = [...calendarData.events, ...overlaps];
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
            if (event.isTemp) return 'Your selected availability';
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
          {calendarData.members.length === 0 ? (
            <p>No members in this group</p>
          ) : (
            <>
              {calendarData.members.map((member, index) => {
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