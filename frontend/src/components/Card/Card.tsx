import React from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'active' | 'danger' | 'success' | 'warning';
  statusBorder?: 'pending' | 'active' | 'complete' | 'failed' | 'rolled_back';
  glow?: boolean;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

const borderColorMap: Record<string, string> = {
  default: colors.border.subtle,
  active:  colors.border.active,
  danger:  colors.border.danger,
  success: colors.border.success,
  warning: colors.border.warning,
};

const statusBorderMap: Record<string, string> = {
  pending:     colors.text.muted,
  active:      colors.accent.cyan,
  complete:    colors.accent.green,
  failed:      colors.accent.red,
  rolled_back: colors.accent.amber,
};

const glowColorMap: Record<string, string> = {
  default: `0 0 12px rgba(0, 229, 255, 0.15)`,
  active:  `0 0 16px rgba(0, 229, 255, 0.55), 0 0 6px rgba(0, 229, 255, 0.25)`,
  danger:  `0 0 16px rgba(255, 61, 90, 0.55), 0 0 6px rgba(255, 61, 90, 0.25)`,
  success: `0 0 12px rgba(0, 255, 135, 0.35), 0 0 4px rgba(0, 255, 135, 0.15)`,
  warning: `0 0 12px rgba(255, 176, 32, 0.35), 0 0 4px rgba(255, 176, 32, 0.15)`,
};

const Card = React.memo<CardProps>(({
  children,
  variant = 'default',
  statusBorder,
  glow = false,
  className = '',
  delay = 0,
  onClick,
}) => {
  const style: React.CSSProperties = {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    border: `1px solid ${borderColorMap[variant]}`,
    ...(statusBorder && {
      borderLeftWidth: 3,
      borderLeftColor: statusBorderMap[statusBorder],
    }),
    ...(glow && {
      boxShadow: glowColorMap[variant],
    }),
    ...(onClick && { cursor: 'pointer' }),
  };

  return (
    <motion.div
      className={`ncc-card ${className}`}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: delay * 0.001,
        duration: 0.3,
        type: 'spring',
        damping: 20,
        stiffness: 180,
      }}
      whileHover={onClick ? {
        borderColor: colors.border.active,
        boxShadow: glowColorMap.active,
        transition: { duration: 0.15 },
      } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
});

Card.displayName = 'Card';
export default Card;
