import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';

const localizer = momentLocalizer(moment);

const MeetingCalendar = ({ meetingId, groupId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    fetchAvailability();
  }, [meetingId, groupId]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/meetings/${meetingId}/availability`);
      const availabilityData = response.data;
      
      // Transform availability data into calendar events
      const calendarEvents = availabilityData.map(availability => ({
        id: availability.id,
        title: `${availability.user.name}'s Availability`,
        start: new Date(availability.start_time),
        end: new Date(availability.end_time),
        resource: availability.user.id,
        color: getAvailabilityColor(availability.overlap_count)
      }));

      setEvents(calendarEvents);
      setError(null);
    } catch (err) {
      setError('Failed to fetch availability data');
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (overlapCount) => {
    if (overlapCount >= 3) return '#4CAF50'; // High overlap - green
    if (overlapCount >= 2) return '#FFC107'; // Medium overlap - yellow
    return '#F44336'; // Low overlap - red
  };

  const handleSelect = async ({ start, end }) => {
    try {
      setSelectedSlot({ start, end });
      
      // Save the selected time slot
      await axios.post(`/api/meetings/${meetingId}/availability`, {
        start_time: start.toISOString(),
        end_time: end.toISOString()
      });

      // Refresh availability data
      fetchAvailability();
    } catch (err) {
      setError('Failed to save availability');
      console.error('Error saving availability:', err);
    }
  };

  const eventPropGetter = (event) => ({
    style: {
      backgroundColor: event.color,
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    }
  });

  if (loading) {
    return <div className="loading-container">Loading calendar...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="calendar-wrapper">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        selectable
        onSelectSlot={handleSelect}
        eventPropGetter={eventPropGetter}
        views={['week', 'day']}
        defaultView="week"
        min={new Date(0, 0, 0, 8, 0, 0)} // 8 AM
        max={new Date(0, 0, 0, 20, 0, 0)} // 8 PM
        step={30}
        timeslots={2}
      />
    </div>
  );
};

export default MeetingCalendar; 