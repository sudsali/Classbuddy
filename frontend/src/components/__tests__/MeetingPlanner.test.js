import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MeetingPlanner from '../MeetingPlanner';
import { MeetingProvider } from '../../context/MeetingContext';
import { createMeeting } from '../../services/api';

// Mock react-calendar
jest.mock('react-calendar', () => {
  return function MockCalendar({ onChange, value }) {
    return (
      <div>
        <button onClick={() => onChange(new Date('2024-02-01'))}>Select Date</button>
        <div data-testid="mock-calendar">
          Selected: {value ? value.toISOString().split('T')[0] : 'No date selected'}
        </div>
      </div>
    );
  };
});




// Mock the API calls
jest.mock('../../services/api', () => ({
  createMeeting: jest.fn().mockResolvedValue({ data: { success: true } }),
  getMeetings: jest.fn(),
  updateMeeting: jest.fn(),
  deleteMeeting: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('MeetingPlanner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const fillForm = () => {
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/meeting title/i), {
      target: { value: 'Test Meeting' },
    });
    
    // Select date using the mock calendar
    fireEvent.click(screen.getByText('Select Date'));
    
    fireEvent.change(screen.getByLabelText(/time/i), {
      target: { value: '14:00' },
    });
  };

  test('displays the heading correctly', () => {
    render(
      <MeetingProvider>
        <MeetingPlanner />
      </MeetingProvider>
    );
  
    expect(screen.getByRole('heading', { name: /schedule a meeting/i })).toBeInTheDocument();
  });

  test('renders create meeting button', () => {
    render(
      <MeetingProvider>
        <MeetingPlanner />
      </MeetingProvider>
    );
  
    const button = screen.getByRole('button', { name: /create meeting/i });
    expect(button).toBeInTheDocument();
  });
  
  test('updates meeting title input', () => {
    render(
      <MeetingProvider>
        <MeetingPlanner />
      </MeetingProvider>
    );
  
    const titleInput = screen.getByLabelText(/meeting title/i);
    fireEvent.change(titleInput, { target: { value: 'Weekly Sync' } });
  
    expect(titleInput.value).toBe('Weekly Sync');
  });
  
  test('updates meeting time input', () => {
    render(
      <MeetingProvider>
        <MeetingPlanner />
      </MeetingProvider>
    );
  
    const timeInput = screen.getByLabelText(/time/i);
    fireEvent.change(timeInput, { target: { value: '15:30' } });
  
    expect(timeInput.value).toBe('15:30');
  });
  
  test('disables submit button when submitting', async () => {
    render(
      <MeetingProvider>
        <MeetingPlanner />
      </MeetingProvider>
    );
  
    // Fill form
    fireEvent.change(screen.getByLabelText(/meeting title/i), {
      target: { value: 'Test Meeting' },
    });
    fireEvent.click(screen.getByText('Select Date'));
    fireEvent.change(screen.getByLabelText(/time/i), {
      target: { value: '12:00' },
    });
  
    // Click submit
    const submitButton = screen.getByRole('button', { name: /create meeting/i });
    fireEvent.click(submitButton);
  
    // While waiting, the button should be disabled
    await waitFor(() => expect(submitButton).toBeDisabled());
  });
  

}); 