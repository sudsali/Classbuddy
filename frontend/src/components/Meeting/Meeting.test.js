import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Meeting from './Meeting';
import { createMeeting } from '../../services/api';

// Mock the API calls
jest.mock('../../services/api', () => ({
  createMeeting: jest.fn().mockResolvedValue({ data: { success: true } }),
  getMeetings: jest.fn(),
  updateMeeting: jest.fn(),
  deleteMeeting: jest.fn(),
}));

// Mock react-calendar
jest.mock('react-calendar', () => {
  return function MockCalendar({ onChange, value }) {
    return (
      <div data-testid="mock-calendar">
        <button onClick={() => onChange(new Date('2024-02-01'))}>Select Date</button>
        <div>Selected: {value ? value.toISOString().split('T')[0] : ''}</div>
      </div>
    );
  };
});

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Meeting Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders meeting form', () => {
    renderWithRouter(<Meeting />);

    // Check if the form elements are rendered
    expect(screen.getByLabelText(/meeting title/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create meeting/i })).toBeInTheDocument();
  });

  test('allows creating a meeting with valid data', async () => {
    renderWithRouter(<Meeting />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/meeting title/i), {
      target: { value: 'Test Meeting' },
    });
    fireEvent.click(screen.getByText('Select Date'));
    fireEvent.change(screen.getByLabelText(/time/i), {
      target: { value: '14:00' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create meeting/i }));

    // Wait for the API call and navigation
    await waitFor(() => {
      expect(createMeeting).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Meeting',
        time: '14:00',
        date: expect.any(String)
      }));
    });
  });

  test('handles API errors gracefully', async () => {
    createMeeting.mockRejectedValueOnce(new Error('API Error'));
    
    renderWithRouter(<Meeting />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/meeting title/i), {
      target: { value: 'Test Meeting' },
    });
    fireEvent.click(screen.getByText('Select Date'));
    fireEvent.change(screen.getByLabelText(/time/i), {
      target: { value: '14:00' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create meeting/i }));

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText('Error creating meeting. Please try again.')).toBeInTheDocument();
    });
  });
}); 