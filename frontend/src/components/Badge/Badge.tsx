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
  info:     { bg: 'var(--brand-light)', color: 'var(--brand)', borderColor: 'var(--border-brand)' },
  success:  { bg: '#ECFDF5', color: 'var(--success)', borderColor: 'rgba(4, 120, 87, 0.2)' },
  warning:  { bg: '#FFFBEB', color: 'var(--warning)', borderColor: 'rgba(180, 83, 9, 0.2)' },
  danger:   { bg: '#FEF2F2', color: 'var(--danger)', borderColor: 'rgba(185, 28, 28, 0.2)' },
  thinking: { bg: '#F5F3FF', color: 'var(--ai-violet)', borderColor: 'rgba(109, 40, 217, 0.2)' },
  fallback: { bg: '#ECFEFF', color: 'var(--live-teal)', borderColor: 'rgba(14, 74, 144, 0.2)' },
  neutral:  { bg: 'var(--bg-sunken)', color: 'var(--text-secondary)', borderColor: 'var(--border-default)' },
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
        fontWeight: 700,
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
