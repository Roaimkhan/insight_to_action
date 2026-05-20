import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { buttonHoverVariant, inputLabelVariant, inputFocusVariant, spinnerVariant, successCheckmarkVariant, bounceInVariant } from '../../constants/animation';
import './Login.css';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigate = useNavigate();
  const controls = useAnimation();

  // Mouse spotlight state & ref
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

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

  React.useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring' as const, damping: 20, stiffness: 100 }
    });
  }, [controls]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading' || status === 'success') return;

    setStatus('loading');
    setErrorMessage('');

    // Simulate secure network handshakes
    await new Promise((resolve) => setTimeout(resolve, 1800));

    if (email === 'admin@supplyai.com' && (password === 'SupplyOS2024' || password === 'Supply123')) {
      setStatus('success');
      localStorage.setItem('supply_agent_token', 'mock-jwt-token-supply-os-2024');
      
      await new Promise((resolve) => setTimeout(resolve, 1200));
      navigate('/');
    } else {
      setStatus('error');
      setErrorMessage('Verification failed. Invalid credentials.');
      
      // Physical spring-shake animation
      await controls.start({
        x: [-8, 8, -6, 6, -3, 3, 0],
        transition: { duration: 0.4, ease: 'easeInOut' }
      });
      
      setStatus('idle');
    }
  };

  return (
    <div className="login-screen">
      {/* Visual atmospheric deck */}
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
          {/* Spotlight highlight indicator */}
          <div className="card-spotlight-border" />

          {/* Header */}
          <div className="login-header">
            <div className="login-logo-container">
              {/* Circuit traces decoration */}
              <div className="circuit-lines-glow" />
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 3 }}>
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={colors.accent.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke={colors.accent.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke={colors.accent.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="login-title font-heading">SupplyAI</h1>
            <p className="login-subtitle font-body">Autonomous Operations Command Center</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <motion.div 
                className="input-wrapper"
                animate={emailFocused ? 'focused' : 'unfocused'}
                variants={inputFocusVariant}
              >
                <input
                  type="email"
                  id="login-email"
                  className="login-input font-body"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  required
                  autoComplete="off"
                />
                <motion.label 
                  htmlFor="login-email" 
                  className="input-label font-body"
                  animate={emailFocused || email ? 'floating' : 'resting'}
                  variants={inputLabelVariant}
                >
                  EMAIL ADDRESS
                </motion.label>
                <div className="input-border-glow" />
              </motion.div>
            </div>

            <div className="input-group">
              <motion.div 
                className="input-wrapper"
                animate={passwordFocused ? 'focused' : 'unfocused'}
                variants={inputFocusVariant}
              >
                <input
                  type="password"
                  id="login-password"
                  className="login-input font-body"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                />
                <motion.label 
                  htmlFor="login-password" 
                  className="input-label font-body"
                  animate={passwordFocused || password ? 'floating' : 'resting'}
                  variants={inputLabelVariant}
                >
                  PASSWORD
                </motion.label>
                <div className="input-border-glow" />
              </motion.div>
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

            {/* Morphing Submit Button */}
            <motion.button
              type="submit"
              className={`login-submit-btn font-body ${status}`}
              variants={buttonHoverVariant}
              whileHover={status === 'idle' ? 'hover' : undefined}
              whileTap={status === 'idle' ? 'tap' : undefined}
              disabled={status === 'loading' || status === 'success'}
            >
              {status === 'idle' && (
                <span className="btn-content">
                  SIGN IN TO SUPPLYOS
                  <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              )}

              {status === 'loading' && (
                <span className="btn-content">
                  <motion.svg 
                    className="spinner" 
                    viewBox="0 0 50 50"
                    animate="animate"
                    variants={spinnerVariant}
                  >
                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                  </motion.svg>
                  ESTABLISHING SECURE PROTOCOL...
                </span>
              )}

              {status === 'success' && (
                <motion.span 
                  className="btn-content"
                  animate="animate"
                  variants={bounceInVariant}
                >
                  <motion.svg 
                    className="checkmark" 
                    viewBox="0 0 52 52"
                  >
                    <motion.circle 
                      className="checkmark-circle" 
                      cx="26" 
                      cy="26" 
                      r="25" 
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    />
                    <motion.path 
                      className="checkmark-check" 
                      fill="none" 
                      d="M14.1 27.2l7.1 7.2 16.7-16.8"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, ease: 'easeInOut', delay: 0.2 }}
                    />
                  </motion.svg>
                  ✓ SECURE LINK ACTIVE
                </motion.span>
              )}
            </motion.button>
          </form>

          {/* Footer details */}
          <div className="login-footer font-mono" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>SECURE PORT PORTAL // v3.5-DAYLIGHT_GLASS</div>
            <div>
              Don't have an account? <Link to="/register" style={{ color: colors.accent.cyan, textDecoration: 'none', fontWeight: 'bold' }}>Sign Up →</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
