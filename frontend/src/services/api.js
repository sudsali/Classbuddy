import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:8000/api';

// Create a new meeting
export const createMeeting = async (meetingData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/meetings/`, meetingData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create meeting');
  }
};

// Get all meetings
export const getMeetings = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/meetings/`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch meetings');
  }
};

// Get a single meeting by ID
export const getMeeting = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/meetings/${id}/`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch meeting');
  }
};

// Update a meeting
export const updateMeeting = async (id, meetingData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/meetings/${id}/`, meetingData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update meeting');
  }
};

// Delete a meeting
export const deleteMeeting = async (id) => {
  try {
    await axios.delete(`${API_BASE_URL}/meetings/${id}/`);
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete meeting');
  }
}; 