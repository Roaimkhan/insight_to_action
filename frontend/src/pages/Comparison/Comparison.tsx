import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { staggerContainer, fadeUpVariant } from '../../constants/animation';
import { useAgentStore } from '../../store/agentStore';
import {
  Card,
  SectionHeader,
  Badge,
  BeforeAfterPanel,
  ContradictionCard,
  CompleteIcon,
  ArrowRightIcon,
} from '../../components';
import type { MetricRow } from '../../types/agent';
import './Comparison.css';

const stepStatusColors: Record<string, string> = {
  complete: colors.accent.green,
  failed: colors.accent.red,
  rolled_back: colors.accent.amber,
  active: colors.accent.cyan,
  pending: colors.text.muted,
};

const Comparison: React.FC = () => {
  const navigate = useNavigate();

  const scenarioId = useAgentStore((s) => s.scenarioId);
  const metrics = useAgentStore((s) => s.metrics);
  const contradictions = useAgentStore((s) => s.contradictions);
  const actionChain = useAgentStore((s) => s.actionChain);
  const beforeState = useAgentStore((s) => s.beforeState);
  const afterState = useAgentStore((s) => s.afterState);

  const handleViewMetrics = useCallback(() => {
    navigate('/metrics');
  }, [navigate]);

  const handleHome = useCallback(() => {
    useAgentStore.getState().reset();
    navigate('/');
  }, [navigate]);

  // Build MetricRows from before/after state
  const metricRows: MetricRow[] = useMemo(() => {
    if (!beforeState || !afterState) return [];
    return Object.keys(beforeState).map((key) => ({
      label: key,
      before: beforeState[key],
      after: afterState[key] || '—',
      improved: (afterState[key] || '').includes('✓') || (afterState[key] || '').includes('ACTIVE') || (afterState[key] || '').includes('IDENTIFIED') || (afterState[key] || '').includes('FLAGGED') || (afterState[key] || '').includes('CONFIRMED') || (afterState[key] || '').includes('ESCALATED') || (afterState[key] || '').includes('REROUTED'),
    }));
  }, [beforeState, afterState]);

  const duration = metrics ? `${(metrics.latency_ms / 1000).toFixed(1)}s` : '—';
  const scenarioLabel = scenarioId ? scenarioId.replace(/_/g, ' ').toUpperCase() : 'SCENARIO';

  return (
    <div className="comparison-screen">
      <div className="scan-line" style={{ opacity: 0.06 }} />

      <div className="comparison-content screen-container">
        {/* Header */}
        <motion.header
          className="comparison-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button className="comparison-back-btn" onClick={handleHome}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke={colors.text.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{
              fontFamily: typography.body.fontFamily,
              fontSize: typography.body.fontSize,
              color: colors.text.secondary,
            }}>RESULTS</span>
          </button>

          <Badge label="COMPLETE ✓" variant="success" />
        </motion.header>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring' as const, damping: 20, stiffness: 180 }}
          style={{ marginBottom: spacing.lg }}
        >
          <h1 style={{
            fontFamily: typography.h1.fontFamily,
            fontSize: typography.h1.fontSize,
            fontWeight: typography.h1.fontWeight,
            letterSpacing: typography.h1.letterSpacing,
            color: colors.text.primary,
            marginBottom: spacing.xs,
          }}>
            Outcome Summary
          </h1>
          <span style={{
            fontFamily: typography.monoSm.fontFamily,
            fontSize: typography.monoSm.fontSize,
            color: colors.text.muted,
          }}>
            {scenarioLabel} · {duration}
          </span>
        </motion.div>

        {/* Before vs After */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          style={{ marginBottom: spacing.xl }}
        >
          <motion.div variants={fadeUpVariant} custom={0}>
            <SectionHeader title="Before vs After" />
          </motion.div>
          <motion.div variants={fadeUpVariant} custom={100}>
            <BeforeAfterPanel rows={metricRows} />
          </motion.div>
        </motion.section>

        {/* Contradictions */}
        {contradictions.length > 0 && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            style={{ marginBottom: spacing.xl }}
          >
            <motion.div variants={fadeUpVariant} custom={0}>
              <SectionHeader
                title="Contradictions"
                badge={`${contradictions.length}`}
                badgeVariant={contradictions.every(c => c.status === 'resolved') ? 'success' : 'danger'}
              />
            </motion.div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {contradictions.map((c, i) => (
                <ContradictionCard
                  key={c.id}
                  contradiction={{ ...c, status: 'resolved' }}
                  animationDelay={i * 100}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Action Chain Timeline */}
        {actionChain.length > 0 && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            style={{ marginBottom: spacing.xl }}
          >
            <motion.div variants={fadeUpVariant} custom={0}>
              <SectionHeader title="Action Chain Timeline" badge={`${actionChain.length} STEPS`} badgeVariant="neutral" />
            </motion.div>
            <motion.div variants={fadeUpVariant} custom={100}>
              <Card>
                <div className="comparison-timeline">
                  {actionChain.map((step, i) => {
                    const isLast = i === actionChain.length - 1;
                    const statusColor = stepStatusColors[step.status] || colors.text.muted;
                    return (
                      <div key={step.step} className="comparison-timeline__step">
                        <div className="comparison-timeline__node" style={{
                          borderColor: statusColor,
                          backgroundColor: step.status === 'complete' ? statusColor : 'transparent',
                          boxShadow: `0 0 8px ${statusColor}44`,
                        }}>
                          {step.status === 'complete' && <CompleteIcon size={12} color={colors.bg.primary} />}
                          {step.status === 'rolled_back' && (
                            <span style={{ fontSize: 10, color: statusColor }}>↩</span>
                          )}
                          {step.status === 'failed' && (
                            <span style={{ fontSize: 10, color: statusColor }}>✕</span>
                          )}
                        </div>
                        {!isLast && (
                          <div className="comparison-timeline__line" style={{ backgroundColor: statusColor }} />
                        )}
                        <div className="comparison-timeline__label">
                          <span style={{
                            fontFamily: typography.monoSm.fontFamily,
                            fontSize: '10px',
                            color: statusColor,
                          }}>
                            {step.name}
                          </span>
                          <span style={{
                            fontFamily: typography.monoSm.fontFamily,
                            fontSize: '10px',
                            color: colors.text.muted,
                          }}>
                            {step.latency_ms ? `${step.latency_ms}ms` : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          </motion.section>
        )}

        {/* View Metrics CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: 'spring' as const, damping: 20, stiffness: 180 }}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <motion.button
            className="comparison-cta"
            onClick={handleViewMetrics}
            whileHover={{ scale: 1.02, boxShadow: `0 0 24px rgba(0, 229, 255, 0.4)` }}
            whileTap={{ scale: 0.98 }}
          >
            <span>View Metrics</span>
            <ArrowRightIcon size={16} color={colors.text.inverse} />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Comparison;
