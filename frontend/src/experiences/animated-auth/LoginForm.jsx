import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

/**
 * LoginForm: Premium Glassmorphic Authentication Card
 * Positioned inside the passenger window viewport of the TripPilot coach.
 */
const LoginForm = ({
  onSubmit,
  onSwitchToRegister,
  loading = false,
  errorMessage = '',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;

    if (validate()) {
      onSubmit({
        email: email.trim(),
        password,
        rememberMe,
      });
    }
  };

  return (
    <div className="auth-card-inner">
      {/* Brand Header */}
      <div className="auth-header">
        <div className="auth-brand-badge">
          <svg className="auth-logo-svg" viewBox="0 0 36 22" fill="none">
            <path d="M3 19L13 5L21 14L27 8L34 19H3Z" fill="#b91c1c" />
            <path d="M10 19L16 11L22 17L28 10L33 19" stroke="#ffffff" strokeWidth="1.5" />
          </svg>
          <span className="auth-brand-name">TripPilot</span>
        </div>
        <h2 className="auth-title">Welcome Aboard</h2>
        <p className="auth-subtitle">Sign in to board your smart travel itinerary</p>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="auth-alert error" role="alert">
          <AlertCircle className="alert-icon" size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Inputs */}
      <form onSubmit={handleSubmit} noValidate className="auth-form">
        {/* Email Field */}
        <div className="form-group">
          <label htmlFor="auth-email" className="form-label">
            Email Address
          </label>
          <div className={`input-wrapper ${fieldErrors.email ? 'has-error' : ''}`}>
            <Mail className="input-icon" size={18} />
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
              }}
              placeholder="explorer@trippilot.com"
              autoComplete="email"
              disabled={loading}
              className="auth-input"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
          </div>
          {fieldErrors.email && (
            <span id="email-error" className="field-error-msg">
              {fieldErrors.email}
            </span>
          )}
        </div>

        {/* Password Field */}
        <div className="form-group">
          <div className="label-with-link">
            <label htmlFor="auth-password" className="form-label">
              Password
            </label>
          </div>
          <div className={`input-wrapper ${fieldErrors.password ? 'has-error' : ''}`}>
            <Lock className="input-icon" size={18} />
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
              className="auth-input"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.password && (
            <span id="password-error" className="field-error-msg">
              {fieldErrors.password}
            </span>
          )}
        </div>

        {/* Options Row: Remember Me & Forgot Password */}
        <div className="form-options-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
              className="custom-checkbox"
            />
            <span>Remember session</span>
          </label>
          <button
            type="button"
            className="text-link forgot-btn"
            onClick={() => alert('Please contact support@trippilot.com or register a new journey.')}
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`auth-submit-btn ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <>
              <Loader2 className="btn-spinner animate-spin" size={18} />
              <span>Verifying Pass...</span>
            </>
          ) : (
            <>
              <span>Sign In & Board</span>
              <ArrowRight size={18} className="btn-arrow" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="auth-footer">
        <span>Don't have a boarding pass?</span>{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          disabled={loading}
          className="switch-auth-mode-btn"
        >
          Create TripPilot Account
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
