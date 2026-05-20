import React from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import './CredibilityBar.css';

interface CredibilityBarProps {
  score: number;   // 0 to 1
  label?: string;
  showValue?: boolean;
  color?: string;
  height?: number;
}

const CredibilityBar = React.memo<CredibilityBarProps>(({
  score,
  label,
  showValue = true,
  color,
  height = 6,
}) => {
  // Dynamic color based on score if no override
  const barColor = color || (
    score >= 0.7 ? colors.accent.emerald :
    score >= 0.4 ? colors.accent.amber :
    colors.accent.crimson
  );

  const percentage = Math.round(score * 100);

  return (
    <div className="ncc-credibility-bar">
      {(label || showValue) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.xs,
        }}>
          {label && (
            <span style={{
              fontFamily: typography.small.fontFamily,
              fontSize: typography.small.fontSize,
              color: colors.text.secondary,
            }}>
              {label}
            </span>
          )}
          {showValue && (
            <span style={{
              fontFamily: typography.monoBold.fontFamily,
              fontSize: typography.monoBold.fontSize,
              fontWeight: typography.monoBold.fontWeight,
              color: barColor,
            }}>
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div style={{
        width: '100%',
        height,
        backgroundColor: colors.border.subtle,
        borderRadius: radius.full,
        overflow: 'hidden',
      }}>
        <motion.div
          style={{
            height: '100%',
            backgroundColor: barColor,
            borderRadius: radius.full,
            boxShadow: `0 0 8px ${barColor}44`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 100,
            delay: 0.3,
          }}
        />
      </div>
    </div>
  );
});

CredibilityBar.displayName = 'CredibilityBar';
export default CredibilityBar;
