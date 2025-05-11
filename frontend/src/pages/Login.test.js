// src/pages/Login.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import { AuthProvider } from '../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

jest.mock('axios');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithProviders = () => {
  render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  axios.get.mockResolvedValue({ data: { email: 'mock@edu.edu' } }); // Prevent AuthContext crash
});

describe('Login Page', () => {
  it('logs in a verified user', async () => {
    axios.post.mockResolvedValueOnce({
      data: { token: 'fake-token', user: { email: 'test@university.edu' } },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@university.edu' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'StrongPass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        expect.objectContaining({
          email: 'test@university.edu',
          password: 'StrongPass123',
        })
      );
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  it('shows error for invalid credentials', async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        data: { error: 'Invalid email or password' },
      },
    });

    renderWithProviders();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'wrong@university.edu' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'WrongPass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/invalid email or password/i)
      ).toBeInTheDocument();
    });
  });
});
