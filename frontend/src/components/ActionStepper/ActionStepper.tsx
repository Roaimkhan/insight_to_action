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
  complete:    colors.accent.emerald,
  failed:      colors.accent.crimson,
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
      className={`ncc-step-item ${step.status}`}
      style={{
        paddingLeft: '34px',
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
        position: 'relative',
      }}
      variants={fadeUpVariant}
      custom={index * 80}
    >
      {/* Fiber-optic signal track line */}
      <div className="stepper-track-container" style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 12,
        width: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1,
      }}>
        {/* Connection link line */}
        <div className="stepper-track-line" style={{
          width: '2px',
          height: '100%',
          background: step.status === 'complete' ? 'rgba(16, 185, 129, 0.22)' :
                      step.status === 'active' ? 'rgba(6, 182, 212, 0.22)' :
                      'rgba(0, 0, 0, 0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {step.status === 'active' && (
            <div className="stepper-signal-pulse active" />
          )}
          {step.status === 'complete' && (
            <div className="stepper-signal-pulse complete" />
          )}
        </div>

        {/* Tactical target node indicator dot */}
        <div className={`stepper-node-dot ${step.status}`} style={{
          width: '9px',
          height: '9px',
          borderRadius: '50%',
          background: statusBorderMap[step.status],
          position: 'absolute',
          top: '18px',
          boxShadow: step.status === 'active' ? `0 0 10px ${colors.accent.cyan}` :
                     step.status === 'complete' ? `0 0 8px ${colors.accent.emerald}` :
                     'none',
          border: '1.5px solid var(--bg-surface)',
          zIndex: 4,
        }}>
          {step.status === 'active' && (
            <>
              <div className="ripple-ring ring1" />
              <div className="ripple-ring ring2" />
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, position: 'relative', zIndex: 2 }}>
        <IconComp size={15} />
        <span style={{
          fontFamily: typography.h3.fontFamily,
          fontSize: typography.h3.fontSize,
          fontWeight: 700,
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
          paddingLeft: 20,
          lineHeight: typography.small.lineHeight,
          position: 'relative',
          zIndex: 2,
        }}>
          {step.description}
        </p>
      )}

      <div style={{
        display: 'flex',
        gap: spacing.md,
        paddingLeft: 20,
        marginTop: spacing.xs,
        position: 'relative',
        zIndex: 2,
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
