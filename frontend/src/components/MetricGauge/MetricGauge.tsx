import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { numberCounterVariant, gaugeNeedleVariant } from '../../constants/animation';
import './MetricGauge.css';

interface MetricGaugeProps {
  value: number;
  maxValue?: number;
  label: string;
  suffix?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const sizeMap = {
  sm: { ring: 64,  stroke: 4,  font: typography.monoBold },
  md: { ring: 96,  stroke: 5,  font: typography.monoLg },
  lg: { ring: 140, stroke: 6,  font: typography.monoXl },
};

const MetricGauge = React.memo<MetricGaugeProps>(({
  value,
  maxValue = 100,
  label,
  suffix = '%',
  color = colors.accent.cyan,
  size = 'md',
  animate = true,
}) => {
  const config = sizeMap[size];
  
  // Dual-arc configuration: inner primary arc and outer glowing track arc
  const primaryStrokeWidth = config.stroke + 1;
  const outerStrokeWidth = 1;
  
  const ringRadius = (config.ring - primaryStrokeWidth - 8) / 2;
  const outerRadius = ringRadius + 4;
  
  const circumferenceInner = 2 * Math.PI * ringRadius;
  const circumferenceOuter = 2 * Math.PI * outerRadius;
  
  const normalizedValue = Math.min(value / maxValue, 1);

  const springValue = useSpring(0, { damping: 32, stiffness: 65 });
  const displayValue = useTransform(springValue, (v) => Math.round(v));
  const [displayNum, setDisplayNum] = useState(0);

  useEffect(() => {
    if (animate) {
      springValue.set(value);
    } else {
      springValue.jump(value);
    }
  }, [value, animate, springValue]);

  useEffect(() => {
    const unsubscribe = displayValue.on('change', (v) => {
      setDisplayNum(v);
    });
    return unsubscribe;
  }, [displayValue]);

  const dashOffsetInner = circumferenceInner * (1 - normalizedValue);
  const dashOffsetOuter = circumferenceOuter * (1 - normalizedValue);

  // Gradient ID setup
  const gradId = `gauge-grad-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const filterId = `gauge-glow-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <motion.div 
      className="ncc-metric-gauge flex-center" 
      style={{ textAlign: 'center', width: '100%' }}
      initial="initial"
      animate="animate"
      variants={numberCounterVariant}
    >
      <div style={{ position: 'relative', width: config.ring, height: config.ring, margin: '0 auto' }}>
        <svg width={config.ring} height={config.ring} viewBox={`0 0 ${config.ring} ${config.ring}`} style={{ overflow: 'visible' }}>
          <defs>
            {/* Soft linear gradient for the primary arc */}
            <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity={0.8} />
              <stop offset="100%" stopColor={color === colors.accent.cyan ? '#6D28D9' : `${color}dd`} stopOpacity={1} />
            </linearGradient>
            
            {/* Real-time neon glow filter */}
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ambient Glow Halo behind the gauge */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={ringRadius}
            fill="none"
            stroke={color}
            strokeWidth={primaryStrokeWidth + 4}
            opacity="0.04"
            style={{ filter: `blur(4px)` }}
          />

          {/* 1. Background Inner Track */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={ringRadius}
            fill="none"
            stroke="var(--border-default)"
            strokeWidth={primaryStrokeWidth}
            opacity="0.15"
          />

          {/* 2. Outer Thin Track Arc (Neon Ring) */}
          <motion.circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={outerRadius}
            fill="none"
            stroke={color}
            strokeWidth={outerStrokeWidth}
            strokeDasharray={circumferenceOuter}
            initial={{ strokeDashoffset: circumferenceOuter }}
            animate={{ strokeDashoffset: dashOffsetOuter }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            strokeLinecap="round"
            opacity="0.45"
            transform={`rotate(-90 ${config.ring / 2} ${config.ring / 2})`}
            style={{ filter: `url(#${filterId})` }}
          />

          {/* 3. Primary Inner Thicker Arc with gradient */}
          <motion.circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={ringRadius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={primaryStrokeWidth}
            strokeDasharray={circumferenceInner}
            initial={{ strokeDashoffset: circumferenceInner }}
            animate={{ strokeDashoffset: dashOffsetInner }}
            transition={{ duration: 1.5, type: 'spring', damping: 25, stiffness: 60 }}
            strokeLinecap="round"
            transform={`rotate(-90 ${config.ring / 2} ${config.ring / 2})`}
          />
        </svg>

        {/* Center glowing text value */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: config.font.fontFamily,
          fontSize: config.font.fontSize,
          fontWeight: 800,
          color: colors.text.primary,
          textShadow: `0 2px 10px rgba(0, 0, 0, 0.03)`,
          zIndex: 3
        }}>
          <span>{displayNum}{suffix}</span>
        </div>
      </div>
      
      {/* Mini indicator badge for live status */}
      <div className="gauge-label-container" style={{ marginTop: spacing.sm }}>
        <div style={{
          fontFamily: typography.label.fontFamily,
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: colors.text.secondary,
        }}>
          {label}
        </div>
      </div>
    </motion.div>
  );
});

MetricGauge.displayName = 'MetricGauge';
export default MetricGauge;
