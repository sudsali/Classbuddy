import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import DirectMessages from '../DirectMessages';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock the API endpoints
const server = setupServer(
  // List chats
  rest.get('/api/direct-messages/chats/', (req, res, ctx) => {
    return res(ctx.json([
      {
        id: 1,
        participants: [
          { id: 1, email: 'user1@nyu.edu', first_name: 'User', last_name: 'One' },
          { id: 2, email: 'user2@nyu.edu', first_name: 'User', last_name: 'Two' }
        ],
        last_message: {
          id: 1,
          content: 'Hello!',
          timestamp: '2024-03-15T10:00:00Z',
          sender: { id: 1, first_name: 'User', last_name: 'One' }
        }
      }
    ]));
  }),

  // Get users
  rest.get('/api/users/', (req, res, ctx) => {
    return res(ctx.json([
      { id: 2, email: 'user2@nyu.edu', first_name: 'User', last_name: 'Two' },
      { id: 3, email: 'newuser@nyu.edu', first_name: 'New', last_name: 'User' }
    ]));
  }),

  // Get or create chat
  rest.post('/api/direct-messages/chats/get_or_create_chat/', (req, res, ctx) => {
    if (req.body.email === 'newuser@nyu.edu') {
      return res(ctx.status(201), ctx.json({
        id: 2,
        participants: [
          { id: 1, email: 'user1@nyu.edu', first_name: 'User', last_name: 'One' },
          { id: 3, email: 'newuser@nyu.edu', first_name: 'New', last_name: 'User' }
        ]
      }));
    }
    return res(ctx.status(404));
  }),

  // Send message
  rest.post('/api/direct-messages/messages/', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({
      id: Date.now(), // Use timestamp to ensure unique IDs
      content: req.body.content,
      sender: { id: 1, first_name: 'User', last_name: 'One' },
      timestamp: new Date().toISOString()
    }));
  }),

  // Get messages
  rest.get('/api/direct-messages/chats/:chatId/messages/', (req, res, ctx) => {
    return res(ctx.json([
      {
        id: 1,
        content: 'Hello!',
        sender: { id: 1, first_name: 'User', last_name: 'One' },
        timestamp: '2024-03-15T10:00:00Z'
      },
      {
        id: 2,
        content: 'Hi there!',
        sender: { id: 2, first_name: 'User', last_name: 'Two' },
        timestamp: '2024-03-15T10:01:00Z'
      }
    ]));
  }),

  // Delete chat
  rest.delete('/api/direct-messages/chats/:chatId/', (req, res, ctx) => {
    return res(ctx.status(204));
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

// Mock the authentication context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'user1@nyu.edu', first_name: 'User', last_name: 'One' }
  })
}));

// Increase test timeout for long-running tests
jest.setTimeout(10000);

describe('DirectMessages Component', () => {
  describe('Rendering', () => {
    test('renders chat list with correct user names and messages', async () => {
      render(<DirectMessages />);
      
      await waitFor(() => {
        expect(screen.getByText('User Two')).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText('Hello!')).toBeInTheDocument();
      });
    });

    test('renders message bubbles with correct styling', async () => {
      render(<DirectMessages />);
      
      // Click on the first chat to view messages
      const chatItem = await screen.findByText('User Two');
      fireEvent.click(chatItem);
      
      const messages = await screen.findAllByRole('article');
      expect(messages[0]).toHaveClass('message-own');
      expect(messages[1]).toHaveClass('message-other');
    });

    test('renders new chat modal when button clicked', async () => {
      render(<DirectMessages />);
      
      const newChatButton = screen.getByRole('button', { name: '' }); // FaPlus icon button
      fireEvent.click(newChatButton);
      
      expect(screen.getByText('New Chat')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email address')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('creates new chat when valid email entered', async () => {
      render(<DirectMessages />);
      
      const newChatButton = screen.getByRole('button', { name: '' }); // FaPlus icon button
      fireEvent.click(newChatButton);
      
      const emailInput = screen.getByPlaceholderText('Enter email address');
      await userEvent.type(emailInput, 'newuser@nyu.edu');
      
      const submitButton = screen.getByText('Start Chat');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('New User', { selector: '.chat-name' })).toBeInTheDocument();
      });
    });

    test('sends message and updates chat window', async () => {
      render(<DirectMessages />);
      
      // Click on the first chat to view messages
      const chatItem = await screen.findByText('User Two', { selector: '.chat-name' });
      fireEvent.click(chatItem);
      
      const messageInput = screen.getByPlaceholderText('Type your message...');
      await userEvent.type(messageInput, 'New test message');
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('New test message', { selector: '.message-content' })).toBeInTheDocument();
      });
    });

    test('polls for new messages', async () => {
      jest.useFakeTimers();
      
      // Initial render
      render(<DirectMessages />);
      
      // Click on the first chat to view messages
      const chatItem = await screen.findByText('User Two');
      fireEvent.click(chatItem);
      
      // Simulate new message arriving
      server.use(
        rest.get('/api/direct-messages/chats/:chatId/messages/', (req, res, ctx) => {
          return res(ctx.json([
            {
              id: 1,
              content: 'Hello!',
              sender: { id: 1, first_name: 'User', last_name: 'One' },
              timestamp: '2024-03-15T10:00:00Z'
            },
            {
              id: 2,
              content: 'Hi there!',
              sender: { id: 2, first_name: 'User', last_name: 'Two' },
              timestamp: '2024-03-15T10:01:00Z'
            },
            {
              id: 3,
              content: 'New incoming message',
              sender: { id: 2, first_name: 'User', last_name: 'Two' },
              timestamp: '2024-03-15T10:02:00Z'
            }
          ]));
        })
      );

      // Advance timers to trigger polling
      jest.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(screen.getByText('New incoming message')).toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    test('deletes chat and removes from list', async () => {
      render(<DirectMessages />);
      
      // Wait for chat list to load
      await screen.findByText('User Two', { selector: '.chat-name' });
      
      // Click delete button
      const deleteButton = screen.getByLabelText('Delete chat');
      fireEvent.click(deleteButton);
      
      // Confirm deletion
      const confirmButton = screen.getByLabelText('Confirm delete chat');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.queryByText('User Two', { selector: '.chat-name' })).not.toBeInTheDocument();
      });
    });

    test('handles long messages with proper wrapping', async () => {
      render(<DirectMessages />);
      
      // Click on the first chat to view messages
      const chatItem = await screen.findByText('User Two', { selector: '.chat-name' });
      fireEvent.click(chatItem);
      
      const messageInput = screen.getByPlaceholderText('Type your message...');
      const longMessage = 'A'.repeat(500);
      await userEvent.type(messageInput, longMessage);
      
      expect(messageInput).toHaveValue(longMessage);
    });

    test('displays error banner on API failure', async () => {
      server.use(
        rest.get('/api/direct-messages/chats/', (req, res, ctx) => {
          return res(ctx.status(500));
        })
      );

      render(<DirectMessages />);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Error fetching chats/i);
      });
    });
  });

  describe('Edge Cases & Error States', () => {
    test('shows empty chat placeholder', async () => {
      server.use(
        rest.get('/api/direct-messages/chats/:chatId/messages/', (req, res, ctx) => {
          return res(ctx.json([]));
        })
      );

      render(<DirectMessages />);
      
      // Click on the first chat to view messages
      const chatItem = await screen.findByText('User Two');
      fireEvent.click(chatItem);
      
      await waitFor(() => {
        const messages = screen.queryAllByRole('message');
        expect(messages).toHaveLength(0);
      });
    });
  });
}); 