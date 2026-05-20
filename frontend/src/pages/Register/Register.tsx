import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { colors } from '../../constants/colors';
import '../Login/Login.css';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const controls = useAnimation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  // Real-time validations
  const isNameValid = name.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;
  const isConfirmValid = confirmPassword === password && confirmPassword.length > 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: -1000, y: -1000 });
  };

  useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', damping: 20, stiffness: 100 }
    });
  }, [controls]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading' || status === 'success') return;

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
      setStatus('error');
      setErrorMessage('Please ensure all fields are valid.');
      controls.start({
        x: [-8, 8, -6, 6, -3, 3, 0],
        transition: { duration: 0.4, ease: 'easeInOut' }
      });
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    // Simulate secure network handshakes
    await new Promise((resolve) => setTimeout(resolve, 1800));

    setStatus('success');
    localStorage.setItem('supply_agent_token', 'mock-jwt-token-supply-os-2024');

    await new Promise((resolve) => setTimeout(resolve, 1200));
    navigate('/');
  };

  // Helper to get border status class
  const getValidationClass = (val: string, isValid: boolean) => {
    if (val.length === 0) return '';
    return isValid ? 'valid' : 'invalid';
  };

  return (
    <div className="login-screen">
      <div className="dot-grid-bg" />
      <div className="atmospheric-glow" />
      <div className="scan-line" />

      <div className="login-container flex-center">
        <motion.div
          ref={cardRef}
          animate={controls}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="login-card glass-elevated"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          style={{
            ['--x' as any]: `${mousePos.x}px`,
            ['--y' as any]: `${mousePos.y}px`,
          }}
        >
          <div className="card-spotlight-border" />

          {/* Header */}
          <div className="login-header">
            <div className="login-logo-container">
              <div className="circuit-lines-glow" />
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 3 }}>
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={colors.accent.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke={colors.accent.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke={colors.accent.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="login-title font-heading">Register</h1>
            <p className="login-subtitle font-body">Create a new Operator Account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="login-form">
            <div className="input-group">
              <div className="input-wrapper">
                <input
                  type="text"
                  id="reg-name"
                  className={`login-input font-body ${getValidationClass(name, isNameValid)}`}
                  placeholder=" "
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="off"
                />
                <label htmlFor="reg-name" className="input-label font-body">FULL NAME</label>
                <div className="input-border-glow" />
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <input
                  type="email"
                  id="reg-email"
                  className={`login-input font-body ${getValidationClass(email, isEmailValid)}`}
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
                <label htmlFor="reg-email" className="input-label font-body">EMAIL ADDRESS</label>
                <div className="input-border-glow" />
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <input
                  type="password"
                  id="reg-password"
                  className={`login-input font-body ${getValidationClass(password, isPasswordValid)}`}
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label htmlFor="reg-password" className="input-label font-body">PASSWORD (MIN 8 CHARS)</label>
                <div className="input-border-glow" />
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <input
                  type="password"
                  id="reg-confirm-password"
                  className={`login-input font-body ${getValidationClass(confirmPassword, isConfirmValid)}`}
                  placeholder=" "
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <label htmlFor="reg-confirm-password" className="input-label font-body">CONFIRM PASSWORD</label>
                <div className="input-border-glow" />
              </div>
            </div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="error-message font-body"
              >
                {errorMessage}
              </motion.div>
            )}

            {/* Register Submit Button */}
            <motion.button
              type="submit"
              className={`login-submit-btn font-body ${status}`}
              whileHover={{ scale: status === 'idle' ? 1.015 : 1 }}
              whileTap={{ scale: status === 'idle' ? 0.985 : 1 }}
              disabled={status === 'loading' || status === 'success'}
            >
              {status === 'idle' && (
                <span className="btn-content">
                  CREATE ACCOUNT
                  <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              )}

              {status === 'loading' && (
                <span className="btn-content">
                  <svg className="spinner" viewBox="0 0 50 50">
                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                  </svg>
                  INITIALIZING SECURE ARCHITECT...
                </span>
              )}

              {status === 'success' && (
                <span className="btn-content">
                  <svg className="checkmark" viewBox="0 0 52 52">
                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"></circle>
                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"></path>
                  </svg>
                  ✓ ACCOUNT CREATED
                </span>
              )}
            </motion.button>
          </form>

          {/* Footer details */}
          <div className="login-footer font-mono">
            Already have an account? <Link to="/login" style={{ color: colors.accent.cyan, textDecoration: 'none', fontWeight: 'bold' }}>Sign In</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
