import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validatePassword = (password) => {
    // Check minimum length (8 characters)
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }

    // Check if password is not entirely numeric
    if (/^\d+$/.test(password)) {
      return 'Password cannot be entirely numeric.';
    }

    // Check for common passwords
    const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      return 'This password is too common. Please choose a stronger password.';
    }

    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
    }

    return null;
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/users/send-reset-code/`, { email });
      setStep(2);
      setMessage('');  // Clear any existing message
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send code.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Validate password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/users/reset-password/`, {
        email,
        code,
        new_password: newPassword
      });
      setMessage('Password reset successful! Redirecting to login...');
      setError('');

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Forgot Password</h2>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-button">Send Code</button>
          </form>
        )}

        {step === 2 && (
          <>
            <div className="info-message">
              <p>Verification code sent to: {email}</p>
              <p>Please enter a strong password that:</p>
              <ul>
                <li>Is at least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains numbers and special characters</li>
                <li>Is not too similar to your personal information</li>
                <li>Is not a commonly used password</li>
              </ul>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>Verification Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="auth-button">Reset Password</button>
            </form>
          </>
        )}

        <p className="auth-link">
          <button onClick={() => navigate('/login')} className="link-button">
            ← Back to Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
