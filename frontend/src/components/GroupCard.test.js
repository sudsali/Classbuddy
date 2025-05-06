import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import GroupCard from './GroupCard';
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

describe('GroupCard Component', () => {
  const mockGroup = {
    id: 1,
    name: 'Test Group',
    subject: 'Test Subject',
    description: 'Test Description',
    max_members: 5,
    members_count: 2,
    is_member: true,
    is_creator: true,
    members: [
      {
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com'
      }
    ]
  };

  const mockOnGroupUpdated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders group details correctly', () => {
    render(
      <GroupCard
        group={mockGroup}
        onGroupUpdated={mockOnGroupUpdated}
      />
    );

    // Check if all group details are displayed
    expect(screen.getByText('Test Group')).toBeInTheDocument();
    expect(screen.getByText('Subject: Test Subject')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  test('displays member count correctly', () => {
    render(
      <GroupCard
        group={mockGroup}
        onGroupUpdated={mockOnGroupUpdated}
      />
    );

    // Check if member count is displayed correctly
    expect(screen.getByText('2/5 members')).toBeInTheDocument();
  });

  test('displays owner badge when user is creator', () => {
    render(
      <GroupCard
        group={mockGroup}
        onGroupUpdated={mockOnGroupUpdated}
      />
    );

    // Check if owner badge is displayed
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  test('does not display owner badge when user is not creator', () => {
    const nonCreatorGroup = {
      ...mockGroup,
      is_creator: false
    };

    render(
      <GroupCard
        group={nonCreatorGroup}
        onGroupUpdated={mockOnGroupUpdated}
      />
    );

    // Check that owner badge is not displayed
    expect(screen.queryByText('Owner')).not.toBeInTheDocument();
  });

  test('shows Join button when user is not a member', async () => {
    const nonMemberGroup = {
      ...mockGroup,
      is_member: false,
      is_creator: false
    };

    axios.post.mockResolvedValue({ data: { success: true } });

    await act(async () => {
      render(
        <GroupCard
          group={nonMemberGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    // Check if Join button is displayed
    const joinButton = screen.getByText('Join Group');
    expect(joinButton).toBeInTheDocument();

    // Test join functionality
    await act(async () => {
      fireEvent.click(joinButton);
    });

    // Verify API call
    expect(axios.post).toHaveBeenCalledWith(
      `/api/study-groups/join/${nonMemberGroup.id}/`
    );
  });

  test('shows Leave button when user is a member but not creator', async () => {
    const memberGroup = {
      ...mockGroup,
      is_member: true,
      is_creator: false
    };

    axios.post.mockResolvedValue({ data: { success: true } });

    await act(async () => {
      render(
        <GroupCard
          group={memberGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    // Check if Leave button is displayed
    const leaveButton = screen.getByText('Leave Group');
    expect(leaveButton).toBeInTheDocument();

    // Test leave functionality
    await act(async () => {
      fireEvent.click(leaveButton);
    });

    // Verify API call
    expect(axios.post).toHaveBeenCalledWith(
      `/api/study-groups/leave/${memberGroup.id}/`
    );
  });

  test('shows Dismiss button when user is creator', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });

    await act(async () => {
      render(
        <GroupCard
          group={mockGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    // Check if Dismiss button is displayed
    const dismissButton = screen.getByText('Dismiss Group');
    expect(dismissButton).toBeInTheDocument();

    // Test dismiss functionality
    await act(async () => {
      fireEvent.click(dismissButton);
    });

    // Verify API call
    expect(axios.post).toHaveBeenCalledWith(
      `/api/study-groups/dismiss/${mockGroup.id}/`
    );
  });

  test('handles API errors gracefully', async () => {
    const nonMemberGroup = {
      ...mockGroup,
      is_member: false,
      is_creator: false
    };

    axios.post.mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(
        <GroupCard
          group={nonMemberGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    // Try to join group
    await act(async () => {
      fireEvent.click(screen.getByText('Join Group'));
    });

    // Verify error handling
    expect(toast.error).toHaveBeenCalledWith('Failed to join group. Please try again.');
    expect(mockOnGroupUpdated).not.toHaveBeenCalled();
  });
}); 