import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import type { MetricRow } from '../../types/agent';
import './BeforeAfterPanel.css';

interface BeforeAfterPanelProps {
  rows: MetricRow[];
}

const BeforeAfterPanel = React.memo<BeforeAfterPanelProps>(({ rows }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 to 100
  const [isHovered, setIsHovered] = useState(false);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleTouchStart = () => {
    isDragging.current = true;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      handleMove(e.clientX);
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="curtain-compare-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        background: '#090E1A',
        border: '1px solid rgba(6, 182, 212, 0.15)',
        borderRadius: radius.lg,
        overflow: 'hidden',
        minHeight: '280px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        userSelect: 'none',
      }}
    >
      {/* 1. BACKGROUND LAYER: HEALED ACTIVE STATE (AFTER) */}
      <div className="curtain-layer after-layer" style={{ padding: '24px 20px' }}>
        <div className="layer-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
          paddingBottom: '8px'
        }}>
          <span style={{
            fontFamily: typography.monoBold.fontFamily,
            fontSize: '11px',
            color: '#10B981',
            letterSpacing: '1px'
          }}>HEALED OPERATIONAL DATA STATE</span>
          <span className="live-status-pill after">✓ ONLINE & SYNCED</span>
        </div>

        <div className="compare-grid">
          {rows.map((row) => (
            <div key={row.label} className="compare-row after">
              <div className="compare-label font-body">{row.label.replace(/_/g, ' ').toUpperCase()}</div>
              <div className="compare-value-box">
                <span className="compare-val healed font-mono">{row.after}</span>
                {row.improved && <span className="delta-pill font-mono">RESOLVED</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. FOREGROUND LAYER: STALE DISCREPANCY STATE (BEFORE) - CLIPPED */}
      <div 
        className="curtain-layer before-layer" 
        style={{ 
          padding: '24px 20px',
          position: 'absolute',
          inset: 0,
          background: '#0F1626',
          clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
          pointerEvents: 'none',
          borderRight: '1px solid rgba(6, 182, 212, 0.3)'
        }}
      >
        <div className="layer-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
          paddingBottom: '8px'
        }}>
          <span style={{
            fontFamily: typography.monoBold.fontFamily,
            fontSize: '11px',
            color: '#EF4444',
            letterSpacing: '1px'
          }}>STALE OUT-OF-SYNC STATE</span>
          <span className="live-status-pill before">⚠ CONTRADICTION</span>
        </div>

        <div className="compare-grid">
          {rows.map((row) => (
            <div key={row.label} className="compare-row before">
              <div className="compare-label font-body">{row.label.replace(/_/g, ' ').toUpperCase()}</div>
              <div className="compare-value-box">
                <span className="compare-val stale font-mono">{row.before}</span>
                <span className="stale-pill font-mono">OUT OF SYNC</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. FLOATING COMPARISON SPLIT HANDLE */}
      <div 
        className="curtain-drag-handle" 
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${sliderPos}%`,
          width: '2px',
          background: 'linear-gradient(180deg, #06B6D4, rgba(167, 139, 250, 0.6), #10B981)',
          cursor: 'ew-resize',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 10px rgba(6, 182, 212, 0.6)'
        }}
      >
        <motion.div 
          className="handle-bullet"
          animate={{ scale: isHovered ? 1.15 : 1 }}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#090D1A',
            border: '2.5px solid #06B6D4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4), 0 0 8px rgba(6, 182, 212, 0.3)',
            transform: 'translateX(-50%)',
            pointerEvents: 'none'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8 18 2 12 8 6"></polyline>
            <polyline points="16 6 22 12 16 18"></polyline>
          </svg>
        </motion.div>
        
        {/* Floating Instruction */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 10, x: '-50%' }}
              className="drag-instruction font-mono"
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                background: 'rgba(9, 13, 26, 0.9)',
                border: '1.5px solid rgba(6, 182, 212, 0.3)',
                padding: '4px 10px',
                borderRadius: '6px',
                color: '#06B6D4',
                fontSize: '9px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
              }}
            >
              DRAG TO INSPECT DISCREPANCIES
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

BeforeAfterPanel.displayName = 'BeforeAfterPanel';
export default BeforeAfterPanel;
