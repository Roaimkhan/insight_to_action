import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
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
  const ringRadius = (config.ring - config.stroke) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const normalizedValue = Math.min(value / maxValue, 1);

  const springValue = useSpring(0, { damping: 30, stiffness: 80 });
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

  const dashOffset = circumference * (1 - normalizedValue);

  return (
    <div className="ncc-metric-gauge" style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: config.ring, height: config.ring, margin: '0 auto' }}>
        <svg width={config.ring} height={config.ring} viewBox={`0 0 ${config.ring} ${config.ring}`}>
          {/* Background ring */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={ringRadius}
            fill="none"
            stroke={colors.border.subtle}
            strokeWidth={config.stroke}
          />
          {/* Animated fill ring */}
          <motion.circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={ringRadius}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, type: 'spring', damping: 30, stiffness: 80 }}
            strokeLinecap="round"
            transform={`rotate(-90 ${config.ring / 2} ${config.ring / 2})`}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        {/* Center value */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: config.font.fontFamily,
          fontSize: config.font.fontSize,
          fontWeight: config.font.fontWeight,
          color: colors.text.primary,
        }}>
          {displayNum}{suffix}
        </div>
      </div>
      <div style={{
        marginTop: spacing.sm,
        fontFamily: typography.label.fontFamily,
        fontSize: typography.label.fontSize,
        fontWeight: typography.label.fontWeight,
        letterSpacing: typography.label.letterSpacing,
        textTransform: typography.label.textTransform,
        color: colors.text.muted,
      }}>
        {label}
      </div>
    </div>
  );
});

MetricGauge.displayName = 'MetricGauge';
export default MetricGauge;
