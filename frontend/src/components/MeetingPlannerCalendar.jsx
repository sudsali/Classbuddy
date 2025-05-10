import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import API_BASE_URL from '../config';
import './MeetingPlannerCalendar.css';

const localizer = momentLocalizer(moment);

const MeetingPlannerCalendar = ({ meetingId, groupId }) => {
  const [events, setEvents] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailability();
    fetchGroupMembers();
  }, [meetingId, groupId]);

  const fetchAvailability = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/meetings/${meetingId}/availability/`);
      const availabilityData = response.data;
      
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
  };

  const fetchGroupMembers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/study-groups/${groupId}/members/`);
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching group members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async ({ start, end }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/meetings/${meetingId}/availability/`, {
        start_time: start,
        end_time: end,
      });
      
      // Add new availability to events
      setEvents(prev => [...prev, {
        id: response.data.id,
        title: `${response.data.user.first_name} ${response.data.user.last_name}`,
        start: new Date(response.data.start_time),
        end: new Date(response.data.end_time),
        user: response.data.user,
      }]);
    } catch (error) {
      console.error('Error adding availability:', error);
    }
  };

  const eventPropGetter = (event) => {
    // Generate a unique color for each user
    const userIndex = members.findIndex(m => m.id === event.user.id);
    const hue = (userIndex * 137.5) % 360; // Golden ratio for better color distribution
    
    return {
      style: {
        backgroundColor: `hsl(${hue}, 70%, 50%)`,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="meeting-planner-calendar">
      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          selectable
          onSelectSlot={handleSelect}
          eventPropGetter={eventPropGetter}
          views={['month', 'week', 'day']}
          defaultView="week"
        />
      </div>
      <div className="legend">
        <h3>Member Availability</h3>
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
      </div>
    </div>
  );
};

export default MeetingPlannerCalendar; 