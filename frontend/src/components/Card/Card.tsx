import React from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { cardHoverVariant } from '../../constants/animation';
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
  default: 'var(--border-subtle)',
  active:  'var(--border-brand)',
  danger:  'var(--danger)',
  success: 'var(--success)',
  warning: 'var(--warning)',
};

const statusBorderMap: Record<string, string> = {
  pending:     'var(--text-muted)',
  active:      'var(--brand)',
  complete:    'var(--success)',
  failed:      'var(--danger)',
  rolled_back: 'var(--warning)',
};

const glowColorMap: Record<string, string> = {
  default: `var(--shadow-sm)`,
  active:  `var(--shadow-glow-brand)`,
  danger:  `var(--shadow-glow-danger)`,
  success: `var(--shadow-glow-success)`,
  warning: `0 0 32px rgba(180, 83, 9, 0.18)`,
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
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = React.useState({ x: -1000, y: -1000 });

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

  const style: React.CSSProperties = {
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
      ref={cardRef}
      className={`ncc-card glass ${className}`}
      style={{
        ...style,
        ['--x' as any]: `${mousePos.x}px`,
        ['--y' as any]: `${mousePos.y}px`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: delay * 0.001,
        duration: 0.3,
        type: 'spring',
        damping: 20,
        stiffness: 180,
      }}
      whileHover={onClick ? cardHoverVariant.hover : undefined}
      onClick={onClick}
    >
      {/* Dynamic light accent spotlight border */}
      <div className="card-spotlight-border" />
      {children}
    </motion.div>
  );
});

Card.displayName = 'Card';
export default Card;
