import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import GroupDetailsModal from './GroupDetailsModal';
import axios from 'axios';
import toast from 'react-hot-toast';

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
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

describe('GroupDetailsModal Component', () => {
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
      },
      {
        id: 2,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      }
    ]
  };

  const mockMessages = [
    {
      id: 1,
      content: 'Hello everyone!',
      sender: {
        id: 1,
        first_name: 'Test',
        last_name: 'User'
      },
      created_at: '2024-03-20T10:00:00Z'
    },
    {
      id: 2,
      content: 'Hi there!',
      sender: {
        id: 2,
        first_name: 'John',
        last_name: 'Doe'
      },
      created_at: '2024-03-20T10:01:00Z'
    }
  ];

  const mockOnClose = jest.fn();
  const mockOnGroupUpdated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API responses
    axios.get.mockResolvedValue({ data: mockMessages });
    axios.post.mockResolvedValue({ data: { success: true } });
  });

  test('renders group details correctly', async () => {
    await act(async () => {
      render(
        <GroupDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          group={mockGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    // Check if all group details are displayed
    expect(screen.getByText('Test Group')).toBeInTheDocument();
    expect(screen.getByText(/Subject:/)).toBeInTheDocument();
    expect(screen.getByText('Test Subject')).toBeInTheDocument();
    expect(screen.getByText(/Description:/)).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText(/Members:/)).toBeInTheDocument();
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  test('displays member list correctly', async () => {
    await act(async () => {
      render(
        <GroupDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          group={mockGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    // Check if all members are displayed in the members list
    const membersList = screen.getByRole('list');
    expect(membersList).toBeInTheDocument();
    
    const memberItems = screen.getAllByRole('listitem');
    expect(memberItems).toHaveLength(2);
    
    expect(memberItems[0]).toHaveTextContent('Test User');
    expect(memberItems[0]).toHaveTextContent('test@example.com');
    expect(memberItems[1]).toHaveTextContent('John Doe');
    expect(memberItems[1]).toHaveTextContent('john@example.com');
  });

  test('displays message history correctly', async () => {
    await act(async () => {
      render(
        <GroupDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          group={mockGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    // Wait for messages to load
    await waitFor(() => {
      expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    // Check if sender names are displayed in messages
    const messageSenders = screen.getAllByTestId('message-sender');
    expect(messageSenders).toHaveLength(2);
    expect(messageSenders[0]).toHaveTextContent('Test User');
    expect(messageSenders[1]).toHaveTextContent('John Doe');
    
    const messages = screen.getAllByTestId('message-content');
    expect(messages).toHaveLength(2);
    expect(messages[0]).toHaveTextContent('Hello everyone!');
    expect(messages[1]).toHaveTextContent('Hi there!');
  });

  test('handles file upload successfully', async () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    await act(async () => {
      render(
        <GroupDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          group={mockGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    const fileInput = screen.getByLabelText('Upload File');
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Verify file upload API call
    expect(axios.post).toHaveBeenCalledWith(
      `/api/study-groups/${mockGroup.id}/upload/`,
      expect.any(FormData),
      expect.any(Object)
    );

    // Verify success message
    expect(toast.success).toHaveBeenCalledWith('File uploaded successfully!');
  });

  test('handles file upload error', async () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    axios.post.mockRejectedValueOnce(new Error('Upload failed'));
    
    await act(async () => {
      render(
        <GroupDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          group={mockGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    const fileInput = screen.getByLabelText('Upload File');
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Verify error message
    expect(toast.error).toHaveBeenCalledWith('Failed to upload file. Please try again.');
  });

  test('sends message successfully', async () => {
    await act(async () => {
      render(
        <GroupDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          group={mockGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    const messageInput = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    // Type and send message
    await act(async () => {
      fireEvent.change(messageInput, { target: { value: 'New message' } });
      fireEvent.click(sendButton);
    });

    // Verify message API call
    expect(axios.post).toHaveBeenCalledWith(
      `/api/study-groups/${mockGroup.id}/messages/`,
      { content: 'New message' }
    );

    // Verify success message
    expect(toast.success).toHaveBeenCalledWith('Message sent successfully!');
  });

  test('handles message sending error', async () => {
    axios.post.mockRejectedValueOnce(new Error('Failed to send message'));
    
    await act(async () => {
      render(
        <GroupDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          group={mockGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    const messageInput = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    // Try to send message
    await act(async () => {
      fireEvent.change(messageInput, { target: { value: 'New message' } });
      fireEvent.click(sendButton);
    });

    // Verify error message
    expect(toast.error).toHaveBeenCalledWith('Failed to send message. Please try again.');
  });

  test('closes modal when close button is clicked', async () => {
    await act(async () => {
      render(
        <GroupDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          group={mockGroup}
          onGroupUpdated={mockOnGroupUpdated}
        />
      );
    });

    const closeButton = screen.getByText('Close');
    
    await act(async () => {
      fireEvent.click(closeButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });
}); 