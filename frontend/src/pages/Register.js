import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [emailForVerification, setEmailForVerification] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
  
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
  
    const userData = {
      email: formData.email,
      password: formData.password,
      password2: formData.confirmPassword,
      first_name: formData.firstName,
      last_name: formData.lastName
    };
  
    const result = await register(userData);
  
    if (result.success) {
      setEmailForVerification(formData.email); // 🔑 set email for verify API
      setShowVerification(true); // ✅ show verification input
    } else {
      setError(result.error || 'Registration failed');
    }
  };
  
  
  const handleVerify = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/users/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: emailForVerification,
          code: verificationCode
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setShowVerification(false);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Verification request failed');
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="success-message">
            ✅ Email verified successfully. <Link to="/login">Click here</Link> to login.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Register</h2>
        {error && <div className="error-message">{error}</div>}
        {!showVerification ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="auth-button">Register</button>
          </form>
        ) : (
          <div className="verification-container">
            <h3>Verify your email</h3>
            <input
              type="text"
              placeholder="Enter verification code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <button onClick={handleVerify} className="auth-button">Verify Email</button>
          </div>
        )}
        {!showVerification && (
          <p className="auth-link">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;
