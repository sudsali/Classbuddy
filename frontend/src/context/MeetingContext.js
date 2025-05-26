import React, { createContext, useContext, useState } from 'react';
import { createMeeting, getMeetings, updateMeeting, deleteMeeting } from '../services/api';

const MeetingContext = createContext();

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
};

export const MeetingProvider = ({ children }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateMeeting = async (meetingData) => {
    try {
      setLoading(true);
      setError(null);
      const newMeeting = await createMeeting(meetingData);
      setMeetings(prev => [...prev, newMeeting]);
      return newMeeting;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleGetMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMeetings();
      setMeetings(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMeeting = async (id, meetingData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedMeeting = await updateMeeting(id, meetingData);
      setMeetings(prev => prev.map(meeting => 
        meeting.id === id ? updatedMeeting : meeting
      ));
      return updatedMeeting;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await deleteMeeting(id);
      setMeetings(prev => prev.filter(meeting => meeting.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    meetings,
    loading,
    error,
    createMeeting: handleCreateMeeting,
    getMeetings: handleGetMeetings,
    updateMeeting: handleUpdateMeeting,
    deleteMeeting: handleDeleteMeeting,
  };

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
}; 