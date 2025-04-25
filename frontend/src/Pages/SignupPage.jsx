import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './SignupPage.css';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import IconStrip from '../components/IconStrip';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    
    if (Object.keys(errors).length === 0) {
      // Form is valid, proceed with signup
      console.log('Form submitted:', formData);
      // Here you would typically call an API to register the user
    } else {
      setFormErrors(errors);
    }
  };
  
  return (
    <div className="signup-container">
      <div className="signup-content">
        <IconStrip position="top" />
        
        <div className="signup-form-container">
          <div className="form-header">
            <h2 className="form-title">Create Account</h2>
            <p className="form-subtitle">Join the revolution in stock portfolio management</p>
          </div>
          
          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-icon">
                <FaUser />
              </div>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className={formErrors.name ? 'error' : ''}
              />
              {formErrors.name && <div className="error-message">{formErrors.name}</div>}
            </div>
            
            <div className="form-group">
              <div className="input-icon">
                <FaEnvelope />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className={formErrors.email ? 'error' : ''}
              />
              {formErrors.email && <div className="error-message">{formErrors.email}</div>}
            </div>
            
            <div className="form-group">
              <div className="input-icon">
                <FaLock />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={formErrors.password ? 'error' : ''}
              />
              <div 
                className="password-toggle" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
              {formErrors.password && <div className="error-message">{formErrors.password}</div>}
            </div>
            
            <div className="form-group">
              <div className="input-icon">
                <FaLock />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={formErrors.confirmPassword ? 'error' : ''}
              />
              <div 
                className="password-toggle" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
              {formErrors.confirmPassword && <div className="error-message">{formErrors.confirmPassword}</div>}
            </div>
            
            <button type="submit" className="signup-button">
              Create Account
            </button>
          </form>
          
          <div className="form-footer">
            <p>Already have an account? <Link to="/login" className="login-link">Log In</Link></p>
          </div>
        </div>
      

        <IconStrip position="bottom" />
      </div>
    </div>
  );
};

export default SignupPage; 