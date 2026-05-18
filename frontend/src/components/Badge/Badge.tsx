import React from 'react';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import './Badge.css';

type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'thinking' | 'fallback' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string; borderColor: string }> = {
  info:     { bg: 'rgba(0, 229, 255, 0.12)', color: colors.accent.cyan,   borderColor: 'rgba(0, 229, 255, 0.25)' },
  success:  { bg: 'rgba(0, 255, 135, 0.12)', color: colors.accent.green,  borderColor: 'rgba(0, 255, 135, 0.25)' },
  warning:  { bg: 'rgba(255, 176, 32, 0.12)', color: colors.accent.amber, borderColor: 'rgba(255, 176, 32, 0.25)' },
  danger:   { bg: 'rgba(255, 61, 90, 0.12)', color: colors.accent.red,    borderColor: 'rgba(255, 61, 90, 0.25)' },
  thinking: { bg: 'rgba(139, 92, 246, 0.12)', color: colors.accent.violet, borderColor: 'rgba(139, 92, 246, 0.25)' },
  fallback: { bg: 'rgba(255, 107, 53, 0.12)', color: colors.accent.orange, borderColor: 'rgba(255, 107, 53, 0.25)' },
  neutral:  { bg: 'rgba(61, 90, 122, 0.12)', color: colors.text.secondary, borderColor: 'rgba(61, 90, 122, 0.25)' },
};

const Badge = React.memo<BadgeProps>(({ label, variant = 'info', className = '', style }) => {
  const vs = variantStyles[variant];
  return (
    <span
      className={`ncc-badge ${className}`}
      style={{
        backgroundColor: vs.bg,
        color: vs.color,
        border: `1px solid ${vs.borderColor}`,
        borderRadius: radius.full,
        padding: `${spacing.xs - 1}px ${spacing.sm}px`,
        fontFamily: typography.monoSm.fontFamily,
        fontSize: typography.monoSm.fontSize,
        fontWeight: typography.monoSm.fontWeight,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {label}
    </span>
  );
});

Badge.displayName = 'Badge';
export default Badge;
