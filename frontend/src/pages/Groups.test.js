import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import Groups from './Groups';
import { AuthProvider } from '../context/AuthContext';

// Mock axios before importing it
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn()
}));

// Import axios after mocking
import axios from 'axios';

// Mock the toast notifications
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

// Mock the AuthContext
const mockUser = {
  id: 1,
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com'
};

jest.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: mockUser,
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: true
  })
}));

describe('Groups Component', () => {
  const mockGroups = [
    {
      id: 1,
      name: 'Test Group 1',
      description: 'Test Description 1',
      subject: 'Test Subject 1',
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
    }
  ];

  const mockNonMemberGroup = {
    id: 2,
    name: 'Test Group 2',
    description: 'Test Description 2',
    subject: 'Test Subject 2',
    max_members: 5,
    members_count: 1,
    is_member: false,
    is_creator: false,
    members: [
      {
        id: 2,
        first_name: 'Other',
        last_name: 'User',
        email: 'other@example.com'
      }
    ]
  };

  const mockMemberGroup = {
    id: 3,
    name: 'Test Group 3',
    description: 'Test Description 3',
    subject: 'Test Subject 3',
    max_members: 5,
    members_count: 2,
    is_member: true,
    is_creator: false,
    members: [
      {
        id: 2,
        first_name: 'Other',
        last_name: 'User',
        email: 'other@example.com'
      },
      {
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com'
      }
    ]
  };

  let originalConsoleError;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset sessionStorage mock
    mockSessionStorage.getItem.mockReturnValue('mock-token');
    // Reset axios mock
    axios.get.mockReset();
    // Store original console.error
    originalConsoleError = console.error;
  });

  afterEach(() => {
    // Restore console.error after each test
    console.error = originalConsoleError;
  });

  test('renders Groups component', async () => {
    axios.get.mockResolvedValue({ data: mockGroups });
    
    await act(async () => {
      render(
        <AuthProvider>
          <Groups />
        </AuthProvider>
      );
    });

    // Check if the main heading is rendered
    expect(screen.getByText('Study Groups')).toBeInTheDocument();
  });

  test('displays loading state initially', async () => {
    // Don't resolve the axios call immediately to see loading state
    axios.get.mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      render(
        <AuthProvider>
          <Groups />
        </AuthProvider>
      );
    });

    // The loading state should be visible immediately
    expect(screen.getByText('Loading study groups...')).toBeInTheDocument();
  });

  test('displays groups after loading', async () => {
    axios.get.mockResolvedValue({ data: mockGroups });
    
    await act(async () => {
      render(
        <AuthProvider>
          <Groups />
        </AuthProvider>
      );
    });

    // Wait for the group to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Group 1')).toBeInTheDocument();
    });
  });

  test('shows create group modal when button is clicked', async () => {
    axios.get.mockResolvedValue({ data: mockGroups });
    
    await act(async () => {
      render(
        <AuthProvider>
          <Groups />
        </AuthProvider>
      );
    });

    // Click the create group button
    await act(async () => {
      const createButton = screen.getByText('Create New Group');
      fireEvent.click(createButton);
    });

    // Check if modal elements are present
    expect(screen.getByText('Create New Study Group')).toBeInTheDocument();
    expect(screen.getByText('Group Name')).toBeInTheDocument();
    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Maximum Members')).toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    // Mock console.error to prevent error output during test
    console.error = jest.fn();
    
    // Mock API error
    axios.get.mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(
        <AuthProvider>
          <Groups />
        </AuthProvider>
      );
    });

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to load study groups. Please try again later.')).toBeInTheDocument();
    });

    // Verify that console.error was called with the error
    expect(console.error).toHaveBeenCalledWith('Error fetching groups:', expect.any(Error));
  });

  test('allows joining a group', async () => {
    // Mock successful join response
    axios.get.mockResolvedValue({ data: [mockNonMemberGroup] });
    axios.post.mockResolvedValue({ data: { success: true } });

    await act(async () => {
      render(
        <AuthProvider>
          <Groups />
        </AuthProvider>
      );
    });

    // Wait for groups to load
    await waitFor(() => {
      expect(screen.getByText('Test Group 2')).toBeInTheDocument();
    });

    // Click join button
    await act(async () => {
      const joinButton = screen.getByText('Join Group');
      fireEvent.click(joinButton);
    });
    
    // Verify API call
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/join/'),
      {},
      expect.any(Object)
    );
  });

  test('allows leaving a group', async () => {
    // Mock successful leave response
    axios.get.mockResolvedValue({ data: [mockMemberGroup] });
    axios.post.mockResolvedValue({ data: { success: true } });

    await act(async () => {
      render(
        <AuthProvider>
          <Groups />
        </AuthProvider>
      );
    });

    // Wait for groups to load
    await waitFor(() => {
      expect(screen.getByText('Test Group 3')).toBeInTheDocument();
    });

    // Click leave button
    await act(async () => {
      const leaveButton = screen.getByText('Leave Group');
      fireEvent.click(leaveButton);
    });
    
    // Verify API call
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/leave/'),
      {},
      expect.any(Object)
    );
  });
}); 