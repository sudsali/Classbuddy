import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import './MeetingPlanner.css';

const localizer = momentLocalizer(moment);

const MeetingPlanner = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [studyGroups, setStudyGroups] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    studyGroupId: '',
    location: ''
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format the meeting data
      const meetingData = {
        title: formData.title,
        description: formData.description,
        study_group_id: formData.studyGroupId,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        location: formData.location
      };

      console.log('Sending meeting data to API:', meetingData);
      const response = await api.post('/api/meetings/', meetingData);
      console.log('Meeting creation response:', response.data);

      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        studyGroupId: '',
        location: ''
      });
      fetchMeetings();
    } catch (error) {
      console.error('Error creating meeting:', error);
      setError(error.response?.data?.error || 'Failed to create meeting. Please try again.');
    }
  };

  const handleMeetingSelect = (meeting) => {
    setSelectedMeeting(meeting);
  };

  if (loading) {
    return (
      <div className="meeting-planner">
        <div className="loading-container">
          Loading meetings...
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-planner">
      <div className="meeting-planner-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
          </button>
          <h1>Meeting Planner</h1>
        </div>
        <button className="create-meeting-btn" onClick={() => setShowForm(true)}>
          <FaPlus /> Create Meeting
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
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
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="studyGroupId">Study Group</label>
              <select
                id="studyGroupId"
                name="studyGroupId"
                value={formData.studyGroupId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a study group</option>
                {studyGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter meeting location or video call link"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Create Meeting
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="meeting-planner-content">
        <div className="meetings-list">
          <h2>Upcoming Meetings</h2>
          {!Array.isArray(meetings) || meetings.length === 0 ? (
            <div className="empty-state">No upcoming meetings</div>
          ) : (
            <div className="meetings-grid">
              {meetings.map(meeting => (
                <div
                  key={meeting.id}
                  className={`meeting-card ${selectedMeeting?.id === meeting.id ? 'selected' : ''}`}
                  onClick={() => handleMeetingSelect(meeting)}
                >
                  <h3>{meeting.title}</h3>
                  <p>{meeting.description}</p>
                  <div className="meeting-meta">
                    <div>Date: {new Date(meeting.date).toLocaleDateString()}</div>
                    <div>Time: {meeting.start_time} - {meeting.end_time}</div>
                    <div>Location: {meeting.location}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="calendar-section">
          <div className="calendar-header">
            <h2>Calendar View</h2>
            <p className="calendar-description">
              Select a meeting to view its details and manage availability
            </p>
          </div>
          {selectedMeeting ? (
            <div className="meeting-planner-calendar">
              <div className="calendar-container">
                <MeetingCalendar
                  meetingId={selectedMeeting.id}
                  groupId={selectedMeeting.study_group.id}
                  api={api}
                />
              </div>
              <div className="sidebar">
                <div className="legend">
                  <h3>Availability Legend</h3>
                  <div className="legend-item">
                    <div className="color-box" style={{ backgroundColor: '#4CAF50' }} />
                    <span>Available</span>
                  </div>
                  <div className="legend-item">
                    <div className="color-box" style={{ backgroundColor: '#FFC107' }} />
                    <span>Partially Available</span>
                  </div>
                  <div className="legend-item">
                    <div className="color-box" style={{ backgroundColor: '#F44336' }} />
                    <span>Unavailable</span>
                  </div>
                </div>
                <div className="best-times">
                  <h3>Best Meeting Times</h3>
                  <div className="best-times-list">
                    {/* Best times will be populated here */}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              Select a meeting to view its calendar and manage availability
            </div>
          )}
        </div>
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

  const fetchAvailability = useCallback(async () => {
    try {
      const response = await api.get(`/api/meetings/${meetingId}/availability/`);
      const availabilityData = Array.isArray(response.data) ? response.data : [];
      
      // Transform availability data into calendar events
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
    }
  }, [api, meetingId]);

  const fetchGroupMembers = useCallback(async () => {
    try {
      const response = await api.get(`/api/study-groups/${groupId}/members/`);
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching group members:', error);
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

      const response = await api.post(`/api/meetings/${meetingId}/availability/`, {
        start_time: startTime,
        end_time: endTime,
      });
      
      // Add new availability to events
      const newEvent = {
        id: response.data.id,
        title: `${response.data.user.first_name} ${response.data.user.last_name}`,
        start: new Date(response.data.start_time),
        end: new Date(response.data.end_time),
        user: response.data.user,
      };

      setEvents(prev => [...prev, newEvent]);
      setSelectedSlot(newEvent);
      setTempEvent(null);

      // Refresh the availability data
      fetchAvailability();
    } catch (error) {
      console.error('Error adding availability:', error);
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
      const maxMembers = members.length;
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
    const userIndex = members.findIndex(m => m.id === event.user.id);
    const hue = (userIndex * 137.5) % 360;
    
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