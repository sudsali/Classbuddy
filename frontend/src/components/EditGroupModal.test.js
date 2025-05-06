import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import EditGroupModal from './EditGroupModal';
import axios from 'axios';
import toast from 'react-hot-toast';

// Mock axios
jest.mock('axios', () => ({
  put: jest.fn()
}));

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('EditGroupModal Component', () => {
  const mockGroup = {
    id: 1,
    name: 'Test Group',
    subject: 'Test Subject',
    description: 'Test Description',
    max_members: 5
  };

  const mockOnClose = jest.fn();
  const mockOnGroupUpdated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API response
    axios.put.mockResolvedValue({ data: { ...mockGroup } });
  });

  test('pre-populates form with group data', async () => {
    await act(async () => {
      render(
        <EditGroupModal
          isOpen={true}
          onClose={mockOnClose}
          group={mockGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    // Check if form fields are pre-populated
    expect(screen.getByLabelText(/Group Name/i)).toHaveValue(mockGroup.name);
    expect(screen.getByLabelText(/Subject/i)).toHaveValue(mockGroup.subject);
    expect(screen.getByLabelText(/Description/i)).toHaveValue(mockGroup.description);
    expect(screen.getByLabelText(/Maximum Members/i)).toHaveValue(mockGroup.max_members);
  });

  test('handles successful group update', async () => {
    const updatedGroup = {
      name: 'Updated Group',
      subject: 'Updated Subject',
      description: 'Updated Description',
      max_members: 10
    };

    await act(async () => {
      render(
        <EditGroupModal
          isOpen={true}
          onClose={mockOnClose}
          group={mockGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    // Update form fields
    fireEvent.change(screen.getByLabelText(/Group Name/i), {
      target: { value: updatedGroup.name }
    });
    fireEvent.change(screen.getByLabelText(/Subject/i), {
      target: { value: updatedGroup.subject }
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: updatedGroup.description }
    });
    fireEvent.change(screen.getByLabelText(/Maximum Members/i), {
      target: { value: updatedGroup.max_members.toString() }
    });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByText('Update Group'));
    });

    // Verify API call
    expect(axios.put).toHaveBeenCalledWith(
      `/api/study-groups/${mockGroup.id}/`,
      updatedGroup
    );

    // Verify success message
    expect(toast.success).toHaveBeenCalledWith('Group updated successfully!');

    // Verify callbacks
    expect(mockOnGroupUpdated).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('validates required fields', async () => {
    await act(async () => {
      render(
        <EditGroupModal
          isOpen={true}
          onClose={mockOnClose}
          group={mockGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    // Clear required fields
    fireEvent.change(screen.getByLabelText(/Group Name/i), {
      target: { value: '' }
    });
    fireEvent.change(screen.getByLabelText(/Subject/i), {
      target: { value: '' }
    });

    // Try to submit form
    await act(async () => {
      fireEvent.click(screen.getByText('Update Group'));
    });

    // Check for validation messages
    expect(screen.getByText('Group name is required')).toBeInTheDocument();
    expect(screen.getByText('Subject is required')).toBeInTheDocument();

    // Verify no API call was made
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('validates maximum members field', async () => {
    await act(async () => {
      render(
        <EditGroupModal
          isOpen={true}
          onClose={mockOnClose}
          group={mockGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    // Set invalid maximum members
    fireEvent.change(screen.getByLabelText(/Maximum Members/i), {
      target: { value: '0' }
    });

    // Try to submit form
    await act(async () => {
      fireEvent.click(screen.getByText('Update Group'));
    });

    // Check for validation message
    expect(screen.getByText('Maximum members must be at least 1')).toBeInTheDocument();

    // Verify no API call was made
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('handles API error', async () => {
    const errorMessage = 'Failed to update group';
    axios.put.mockRejectedValueOnce(new Error(errorMessage));

    await act(async () => {
      render(
        <EditGroupModal
          isOpen={true}
          onClose={mockOnClose}
          group={mockGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByText('Update Group'));
    });

    // Verify error message
    expect(toast.error).toHaveBeenCalledWith('Failed to update group. Please try again.');

    // Verify callbacks were not called
    expect(mockOnGroupUpdated).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('closes modal when cancel button is clicked', async () => {
    await act(async () => {
      render(
        <EditGroupModal
          isOpen={true}
          onClose={mockOnClose}
          group={mockGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    // Click cancel button
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    // Verify close callback was called
    expect(mockOnClose).toHaveBeenCalled();
  });
}); 