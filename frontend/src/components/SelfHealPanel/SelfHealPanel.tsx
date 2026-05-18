import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import Badge from '../Badge/Badge';
import type { HealEvent } from '../../types/agent';
import './SelfHealPanel.css';

interface SelfHealPanelProps {
  event: HealEvent | null;
}

const tierColors: Record<number, string> = {
  1: colors.accent.amber,
  2: colors.accent.orange,
  3: colors.accent.red,
};

const tierVariants: Record<number, 'warning' | 'fallback' | 'danger'> = {
  1: 'warning',
  2: 'fallback',
  3: 'danger',
};

const statusLabels: Record<string, string> = {
  retrying: 'RETRYING',
  fallback: 'FALLBACK ACTIVE',
  rollback: 'ROLLING BACK',
  success: 'RECOVERED',
  failed: 'FAILED',
};

const SelfHealPanel = React.memo<SelfHealPanelProps>(({ event }) => {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          className={`ncc-self-heal ${event.status === 'success' ? 'ncc-self-heal--success' : ''}`}
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 200 }}
        >
          <div className="ncc-self-heal__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <div
                className="ncc-self-heal__indicator"
                style={{ backgroundColor: tierColors[event.tier] }}
              />
              <span style={{
                fontFamily: typography.monoBold.fontFamily,
                fontSize: typography.monoBold.fontSize,
                fontWeight: typography.monoBold.fontWeight,
                color: tierColors[event.tier],
              }}>
                SELF HEAL — TIER {event.tier}
              </span>
            </div>
            <Badge
              label={statusLabels[event.status] || event.status.toUpperCase()}
              variant={event.status === 'success' ? 'success' : tierVariants[event.tier]}
            />
          </div>

          <p style={{
            fontFamily: typography.mono.fontFamily,
            fontSize: typography.mono.fontSize,
            color: colors.text.secondary,
            marginTop: spacing.sm,
            lineHeight: 1.6,
          }}>
            {event.detail}
          </p>

          {event.attempt !== undefined && event.maxAttempts !== undefined && (
            <div className="ncc-self-heal__progress">
              <div style={{
                fontFamily: typography.monoSm.fontFamily,
                fontSize: typography.monoSm.fontSize,
                color: colors.text.muted,
                marginBottom: spacing.xs,
              }}>
                Attempt {event.attempt}/{event.maxAttempts}
              </div>
              <div className="ncc-self-heal__bar-track">
                <motion.div
                  className="ncc-self-heal__bar-fill"
                  style={{ backgroundColor: tierColors[event.tier] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(event.attempt / event.maxAttempts) * 100}%` }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

SelfHealPanel.displayName = 'SelfHealPanel';
export default SelfHealPanel;
