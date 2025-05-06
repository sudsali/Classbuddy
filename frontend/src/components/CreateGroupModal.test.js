import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import CreateGroupModal from './CreateGroupModal';
import axios from 'axios';
import toast from 'react-hot-toast';

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn()
}));

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('CreateGroupModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnGroupCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders create group modal', () => {
    render(
      <CreateGroupModal
        isOpen={true}
        onClose={mockOnClose}
        onGroupCreated={mockOnGroupCreated}
      />
    );

    expect(screen.getByText('Create New Study Group')).toBeInTheDocument();
    expect(screen.getByLabelText('Group Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum Members')).toBeInTheDocument();
  });

  test('handles form submission successfully', async () => {
    const mockResponse = {
      data: {
        id: 1,
        name: 'Test Group',
        subject: 'Test Subject',
        description: 'Test Description',
        max_members: 5
      }
    };

    axios.post.mockResolvedValue(mockResponse);

    await act(async () => {
      render(
        <CreateGroupModal
          isOpen={true}
          onClose={mockOnClose}
          onGroupCreated={mockOnGroupCreated}
        />
      );
    });

    // Fill in the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Group Name'), {
        target: { value: 'Test Group' }
      });
      fireEvent.change(screen.getByLabelText('Subject'), {
        target: { value: 'Test Subject' }
      });
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test Description' }
      });
      fireEvent.change(screen.getByLabelText('Maximum Members'), {
        target: { value: '5' }
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByText('Create Group'));
    });

    // Verify API call
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/study-groups/'),
      expect.objectContaining({
        name: 'Test Group',
        subject: 'Test Subject',
        description: 'Test Description',
        max_members: 5
      }),
      expect.any(Object)
    );

    // Verify callbacks
    expect(mockOnGroupCreated).toHaveBeenCalledWith(mockResponse.data);
    expect(mockOnClose).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Group created successfully!');
  });

  test('handles form validation', async () => {
    await act(async () => {
      render(
        <CreateGroupModal
          isOpen={true}
          onClose={mockOnClose}
          onGroupCreated={mockOnGroupCreated}
        />
      );
    });

    // Try to submit without filling required fields
    await act(async () => {
      fireEvent.click(screen.getByText('Create Group'));
    });

    // Check for validation messages
    expect(screen.getByText('Group name is required')).toBeInTheDocument();
    expect(screen.getByText('Subject is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Maximum members is required')).toBeInTheDocument();

    // Verify no API call was made
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('handles API error', async () => {
    axios.post.mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(
        <CreateGroupModal
          isOpen={true}
          onClose={mockOnClose}
          onGroupCreated={mockOnGroupCreated}
        />
      );
    });

    // Fill in the form
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Group Name'), {
        target: { value: 'Test Group' }
      });
      fireEvent.change(screen.getByLabelText('Subject'), {
        target: { value: 'Test Subject' }
      });
      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'Test Description' }
      });
      fireEvent.change(screen.getByLabelText('Maximum Members'), {
        target: { value: '5' }
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByText('Create Group'));
    });

    // Verify error handling
    expect(toast.error).toHaveBeenCalledWith('Failed to create group. Please try again.');
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnGroupCreated).not.toHaveBeenCalled();
  });

  test('closes modal when cancel button is clicked', async () => {
    await act(async () => {
      render(
        <CreateGroupModal
          isOpen={true}
          onClose={mockOnClose}
          onGroupCreated={mockOnGroupCreated}
        />
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    expect(mockOnClose).toHaveBeenCalled();
  });
}); 