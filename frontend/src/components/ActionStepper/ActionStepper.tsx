import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { fadeUpVariant } from '../../constants/animation';
import { ActiveIcon, CompleteIcon, FailedIcon, PendingIcon, RolledBackIcon } from '../Icons/Icons';
import Badge from '../Badge/Badge';
import './ActionStepper.css';

export type StepStatus = 'pending' | 'active' | 'complete' | 'failed' | 'rolled_back';

export interface ActionStep {
  id: string;
  label: string;
  description?: string;
  status: StepStatus;
  timestamp?: string;
  duration?: string;
}

interface ActionStepperProps {
  steps: ActionStep[];
  className?: string;
}

const statusBorderMap: Record<StepStatus, string> = {
  pending:     colors.text.muted,
  active:      colors.accent.cyan,
  complete:    colors.accent.green,
  failed:      colors.accent.red,
  rolled_back: colors.accent.amber,
};

const statusBadgeMap: Record<StepStatus, { label: string; variant: 'info' | 'success' | 'warning' | 'danger' | 'neutral' }> = {
  pending:     { label: 'PENDING',     variant: 'neutral' },
  active:      { label: 'RUNNING',     variant: 'info' },
  complete:    { label: 'COMPLETE',    variant: 'success' },
  failed:      { label: 'FAILED',      variant: 'danger' },
  rolled_back: { label: 'ROLLED BACK', variant: 'warning' },
};

const StatusIconComponent: Record<StepStatus, React.FC<{ size?: number }>> = {
  pending:     PendingIcon,
  active:      (props) => <ActiveIcon {...props} className="spinning-icon" />,
  complete:    CompleteIcon,
  failed:      FailedIcon,
  rolled_back: RolledBackIcon,
};

const StepItem = React.memo<{ step: ActionStep; index: number }>(({ step, index }) => {
  const IconComp = StatusIconComponent[step.status];
  const badge = statusBadgeMap[step.status];

  return (
    <motion.div
      className="ncc-step-item"
      style={{
        borderLeftWidth: 3,
        borderLeftStyle: 'solid',
        borderLeftColor: statusBorderMap[step.status],
        paddingLeft: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
        position: 'relative',
      }}
      variants={fadeUpVariant}
      custom={index * 80}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <IconComp size={16} />
        <span style={{
          fontFamily: typography.h3.fontFamily,
          fontSize: typography.h3.fontSize,
          fontWeight: typography.h3.fontWeight,
          color: colors.text.primary,
          flex: 1,
        }}>
          {step.label}
        </span>
        <Badge label={badge.label} variant={badge.variant} />
      </div>

      {step.description && (
        <p style={{
          fontFamily: typography.small.fontFamily,
          fontSize: typography.small.fontSize,
          color: colors.text.secondary,
          marginTop: spacing.xs,
          paddingLeft: 24,
          lineHeight: typography.small.lineHeight,
        }}>
          {step.description}
        </p>
      )}

      <div style={{
        display: 'flex',
        gap: spacing.md,
        paddingLeft: 24,
        marginTop: spacing.xs,
      }}>
        {step.timestamp && (
          <span style={{
            fontFamily: typography.monoSm.fontFamily,
            fontSize: typography.monoSm.fontSize,
            color: colors.text.muted,
          }}>
            {step.timestamp}
          </span>
        )}
        {step.duration && (
          <span style={{
            fontFamily: typography.monoSm.fontFamily,
            fontSize: typography.monoSm.fontSize,
            color: colors.text.muted,
          }}>
            {step.duration}
          </span>
        )}
      </div>
    </motion.div>
  );
});

StepItem.displayName = 'StepItem';

const ActionStepper = React.memo<ActionStepperProps>(({ steps, className = '' }) => {
  return (
    <motion.div
      className={`ncc-action-stepper ${className}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.08 },
        },
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs,
      }}
    >
      {steps.map((step, i) => (
        <StepItem key={step.id} step={step} index={i} />
      ))}
    </motion.div>
  );
});

ActionStepper.displayName = 'ActionStepper';
export default ActionStepper;
