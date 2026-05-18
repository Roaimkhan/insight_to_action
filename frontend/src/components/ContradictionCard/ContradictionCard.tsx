import React from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import Badge from '../Badge/Badge';
import { BoltIcon, CompleteIcon } from '../Icons/Icons';
import type { Contradiction } from '../../types/agent';
import './ContradictionCard.css';

interface ContradictionCardProps {
  contradiction: Contradiction;
  animationDelay?: number;
}

const ContradictionCard = React.memo<ContradictionCardProps>(({ contradiction, animationDelay = 0 }) => {
  const isActive = contradiction.status === 'active';

  return (
    <motion.div
      className={`ncc-contradiction ${isActive ? 'ncc-contradiction--active' : 'ncc-contradiction--resolved'}`}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: animationDelay * 0.001,
        duration: 0.4,
        type: 'spring',
        damping: 20,
        stiffness: 160,
      }}
    >
      {/* Header */}
      <div className="ncc-contradiction__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          {isActive ? (
            <BoltIcon size={18} color={colors.accent.red} />
          ) : (
            <CompleteIcon size={18} color={colors.accent.green} />
          )}
          <span style={{
            fontFamily: typography.h3.fontFamily,
            fontSize: typography.h3.fontSize,
            fontWeight: typography.h3.fontWeight,
            color: isActive ? colors.accent.red : colors.accent.green,
          }}>
            {isActive ? 'Contradiction Detected' : 'Contradiction Resolved'}
          </span>
        </div>
        <Badge
          label={isActive ? 'ACTIVE' : 'RESOLVED'}
          variant={isActive ? 'danger' : 'success'}
        />
      </div>

      {/* Source comparison */}
      <div className="ncc-contradiction__sources">
        <div className="ncc-contradiction__source">
          <span style={{
            fontFamily: typography.monoSm.fontFamily,
            fontSize: typography.monoSm.fontSize,
            color: colors.text.muted,
          }}>SOURCE A</span>
          <span style={{
            fontFamily: typography.mono.fontFamily,
            fontSize: typography.mono.fontSize,
            color: colors.text.primary,
          }}>
            {contradiction.source_a.type.toUpperCase()}
          </span>
          <span style={{
            fontFamily: typography.monoBold.fontFamily,
            fontSize: typography.monoBold.fontSize,
            fontWeight: typography.monoBold.fontWeight,
            color: contradiction.source_a.credibility >= 0.7 ? colors.accent.green :
                   contradiction.source_a.credibility >= 0.4 ? colors.accent.amber :
                   colors.accent.red,
          }}>
            {contradiction.source_a.credibility.toFixed(2)}
          </span>
        </div>

        <div className="ncc-contradiction__vs">
          <span style={{
            fontFamily: typography.monoBold.fontFamily,
            fontSize: '11px',
            fontWeight: typography.monoBold.fontWeight,
            color: colors.text.muted,
            letterSpacing: '2px',
          }}>VS</span>
        </div>

        <div className="ncc-contradiction__source">
          <span style={{
            fontFamily: typography.monoSm.fontFamily,
            fontSize: typography.monoSm.fontSize,
            color: colors.text.muted,
          }}>SOURCE B</span>
          <span style={{
            fontFamily: typography.mono.fontFamily,
            fontSize: typography.mono.fontSize,
            color: colors.text.primary,
          }}>
            {contradiction.source_b.type.toUpperCase()}
          </span>
          <span style={{
            fontFamily: typography.monoBold.fontFamily,
            fontSize: typography.monoBold.fontSize,
            fontWeight: typography.monoBold.fontWeight,
            color: contradiction.source_b.credibility >= 0.7 ? colors.accent.green :
                   contradiction.source_b.credibility >= 0.4 ? colors.accent.amber :
                   colors.accent.red,
          }}>
            {contradiction.source_b.credibility.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Resolution */}
      <p style={{
        fontFamily: typography.small.fontFamily,
        fontSize: typography.small.fontSize,
        lineHeight: typography.small.lineHeight,
        color: colors.text.secondary,
        marginTop: spacing.sm,
      }}>
        {contradiction.resolution}
      </p>
    </motion.div>
  );
});

ContradictionCard.displayName = 'ContradictionCard';
export default ContradictionCard;
