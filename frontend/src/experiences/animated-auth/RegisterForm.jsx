import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

/**
 * RegisterForm: Account Creation Card for TripPilot
 * Smoothly switches inside the passenger window frame.
 */
const RegisterForm = ({
  onSubmit,
  onSwitchToLogin,
  loading = false,
  errorMessage = '',
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      errors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

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

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      errors.terms = 'You must accept the travel terms';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;

    if (validate()) {
      onSubmit({
        name: name.trim(),
        email: email.trim(),
        password,
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
        <h2 className="auth-title">Begin Your Journey</h2>
        <p className="auth-subtitle">Create your boarding account to explore every page</p>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="auth-alert error" role="alert">
          <AlertCircle className="alert-icon" size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Inputs */}
      <form onSubmit={handleSubmit} noValidate className="auth-form register-form-compact">
        {/* Name Field */}
        <div className="form-group">
          <label htmlFor="reg-name" className="form-label">
            Full Name
          </label>
          <div className={`input-wrapper ${fieldErrors.name ? 'has-error' : ''}`}>
            <User className="input-icon" size={18} />
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
              }}
              placeholder="Alex Johnson"
              autoComplete="name"
              disabled={loading}
              className="auth-input"
              aria-invalid={!!fieldErrors.name}
            />
          </div>
          {fieldErrors.name && <span className="field-error-msg">{fieldErrors.name}</span>}
        </div>

        {/* Email Field */}
        <div className="form-group">
          <label htmlFor="reg-email" className="form-label">
            Email Address
          </label>
          <div className={`input-wrapper ${fieldErrors.email ? 'has-error' : ''}`}>
            <Mail className="input-icon" size={18} />
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
              }}
              placeholder="alex@trippilot.com"
              autoComplete="email"
              disabled={loading}
              className="auth-input"
              aria-invalid={!!fieldErrors.email}
            />
          </div>
          {fieldErrors.email && <span className="field-error-msg">{fieldErrors.email}</span>}
        </div>

        {/* Password & Confirm Password Grid */}
        <div className="form-row-two-col">
          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">
              Password
            </label>
            <div className={`input-wrapper ${fieldErrors.password ? 'has-error' : ''}`}>
              <Lock className="input-icon" size={18} />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                }}
                placeholder="6+ chars"
                autoComplete="new-password"
                disabled={loading}
                className="auth-input"
                aria-invalid={!!fieldErrors.password}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && <span className="field-error-msg">{fieldErrors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm-password" className="form-label">
              Confirm
            </label>
            <div className={`input-wrapper ${fieldErrors.confirmPassword ? 'has-error' : ''}`}>
              <Lock className="input-icon" size={18} />
              <input
                id="reg-confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword)
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
                }}
                placeholder="Repeat"
                autoComplete="new-password"
                disabled={loading}
                className="auth-input"
                aria-invalid={!!fieldErrors.confirmPassword}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <span className="field-error-msg">{fieldErrors.confirmPassword}</span>
            )}
          </div>
        </div>

        {/* Terms Agreement */}
        <div className="form-group terms-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              disabled={loading}
              className="custom-checkbox"
            />
            <span>I agree to TripPilot Travel Terms & Privacy Policy</span>
          </label>
          {fieldErrors.terms && <span className="field-error-msg">{fieldErrors.terms}</span>}
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
              <span>Issuing Boarding Pass...</span>
            </>
          ) : (
            <>
              <span>Create Account & Board</span>
              <ArrowRight size={18} className="btn-arrow" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="auth-footer">
        <span>Already hold a ticket?</span>{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          disabled={loading}
          className="switch-auth-mode-btn"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;
