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
        <div>Selected: {value.toISOString().split('T')[0]}</div>
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

  // Basic functionality tests
  test('renders meeting planner form', () => {
    render(
      <MeetingProvider>
        <MeetingPlanner />
      </MeetingProvider>
    );
    expect(screen.getByLabelText(/meeting title/i)).toBeInTheDocument();
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
  });

  // Valid input tests
  test('creates meeting with valid inputs', async () => {
    render(
      <MeetingProvider>
        <MeetingPlanner />
      </MeetingProvider>
    );

    fillForm();

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create meeting/i }));

    await waitFor(() => {
      expect(createMeeting).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Meeting',
          time: '14:00',
          date: expect.any(String),
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/meetings');
    });
  });

  // Boundary testing
  test('handles maximum title length', async () => {
    render(
      <MeetingProvider>
        <MeetingPlanner />
      </MeetingProvider>
    );

    const longTitle = 'a'.repeat(101); // Assuming max length is 100
    fireEvent.change(screen.getByLabelText(/meeting title/i), {
      target: { value: longTitle },
    });

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('title-error')).toHaveTextContent('Title must be less than 100 characters');
    });
    expect(createMeeting).not.toHaveBeenCalled();
  });

  // Invalid input tests
  test('handles empty title submission', async () => {
    render(
      <MeetingProvider>
        <MeetingPlanner />
      </MeetingProvider>
    );

    // Only fill date and time
    fireEvent.click(screen.getByText('Select Date'));
    fireEvent.change(screen.getByLabelText(/time/i), {
      target: { value: '14:00' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create meeting/i }));

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByTestId('title-error')).toHaveTextContent('Title is required');
    });
    expect(createMeeting).not.toHaveBeenCalled();
  });

  // Time validation tests
  test('validates time format', async () => {
    render(
      <MeetingProvider>
        <MeetingPlanner />
      </MeetingProvider>
    );

    // Fill in required fields first
    fireEvent.change(screen.getByLabelText(/meeting title/i), {
      target: { value: 'Test Meeting' },
    });
    fireEvent.click(screen.getByText('Select Date'));

    // Test invalid time format
    const timeInput = screen.getByTestId('time-input');
    fireEvent.change(timeInput, {
      target: { value: '25:00' }, // Invalid time
    });

    // Submit the form to trigger validation
    fireEvent.click(screen.getByRole('button', { name: /create meeting/i }));

    // Wait for the error message
    await waitFor(() => {
      const errorElement = screen.getByTestId('time-error');
      expect(errorElement).toHaveTextContent('Please enter a valid time (HH:MM)');
    });
    expect(createMeeting).not.toHaveBeenCalled();
  });

  test('validates time boundaries', async () => {
    render(
      <MeetingProvider>
        <MeetingPlanner />
      </MeetingProvider>
    );

    // Fill in required fields first
    fireEvent.change(screen.getByLabelText(/meeting title/i), {
      target: { value: 'Test Meeting' },
    });
    fireEvent.click(screen.getByText('Select Date'));

    // Test invalid time format
    const timeInput = screen.getByTestId('time-input');
    fireEvent.change(timeInput, {
      target: { value: '24:00' }, // Invalid time
    });

    // Submit the form to trigger validation
    fireEvent.click(screen.getByRole('button', { name: /create meeting/i }));

    // Wait for the error message
    await waitFor(() => {
      const errorElement = screen.getByTestId('time-error');
      expect(errorElement).toHaveTextContent('Please enter a valid time (HH:MM)');
    });
    expect(createMeeting).not.toHaveBeenCalled();
  });

  test('validates required time field', async () => {
    render(
      <MeetingProvider>
        <MeetingPlanner />
      </MeetingProvider>
    );

    // Fill in other required fields
    fireEvent.change(screen.getByLabelText(/meeting title/i), {
      target: { value: 'Test Meeting' },
    });
    fireEvent.click(screen.getByText('Select Date'));

    // Submit without time
    fireEvent.click(screen.getByRole('button', { name: /create meeting/i }));

    // Wait for the error message
    await waitFor(() => {
      const errorElement = screen.getByTestId('time-error');
      expect(errorElement).toHaveTextContent('Please enter a valid time (HH:MM)');
    });
    expect(createMeeting).not.toHaveBeenCalled();
  });

  // Error handling
  test('handles API errors gracefully', async () => {
    createMeeting.mockRejectedValueOnce(new Error('API Error'));
    
    render(
      <MeetingProvider>
        <MeetingPlanner />
      </MeetingProvider>
    );

    fillForm();

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create meeting/i }));

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText('Error creating meeting')).toBeInTheDocument();
    });
    expect(createMeeting).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Meeting',
        time: '14:00',
        date: expect.any(String),
      })
    );
  });

  // Test error message display
  test('shows error message when API call fails', async () => {
    createMeeting.mockRejectedValueOnce(new Error('API Error'));
    
    render(
      <MeetingProvider>
        <MeetingPlanner />
      </MeetingProvider>
    );

    fillForm();

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create meeting/i }));

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText('Error creating meeting')).toBeInTheDocument();
    });
  });
}); 