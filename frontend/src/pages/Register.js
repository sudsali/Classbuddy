import React, { useState, useRef } from 'react';
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
  const [verificationCode, setVerificationCode] = useState(Array(6).fill(''));
  const [emailForVerification, setEmailForVerification] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState('register');
  const { register } = useAuth();
  const navigate = useNavigate();
  const inputRefs = useRef([]);

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
      setEmailForVerification(formData.email);
      setShowVerification(true);
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  const handleVerifyChange = (e, index) => {
    const value = e.target.value;
    if (!/^[0-9]*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1);
    setVerificationCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    try {
      const code = verificationCode.join('');
      const response = await fetch("http://localhost:8000/api/users/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: emailForVerification,
          code: code
        })
      });

      const data = await response.json();
      if (response.ok) {
        if (data.token) {
          sessionStorage.setItem('token', data.token);
        }
        setSuccess(true);
        setShowVerification(false);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
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
              <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
            </div>
            <button type="submit" className="auth-button">Register</button>
          </form>
        ) : (
          <div className="verification-container">
            <h3>Verify your email</h3>
            <p className="verification-email">Verification code sent to: {emailForVerification}</p>
            <div className="code-input-wrapper">
              {verificationCode.map((char, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={char}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) => handleVerifyChange(e, index)}
                  className="code-input"
                />
              ))}
            </div>
            <div className="verification-buttons">
              <button onClick={handleVerify} className="auth-button">Verify Email</button>
              <button onClick={() => { setShowVerification(false); setError(''); }} className="auth-button secondary">Back to Register</button>
            </div>
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
