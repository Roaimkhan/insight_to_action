import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { staggerContainer, fadeUpVariant } from '../../constants/animation';
import { useAgentStore } from '../../store/agentStore';
import {
  Card,
  SectionHeader,
  MetricGauge,
  Badge,
  ArrowRightIcon,
} from '../../components';
import './Metrics.css';

const statusColorMap: Record<string, string> = {
  info: colors.accent.cyan,
  success: colors.accent.green,
  warning: colors.accent.amber,
  error: colors.accent.red,
};

const Metrics: React.FC = () => {
  const navigate = useNavigate();

  const metrics = useAgentStore((s) => s.metrics);
  const auditTrail = useAgentStore((s) => s.auditTrail);
  const actionChain = useAgentStore((s) => s.actionChain);

  const handleNewScenario = useCallback(() => {
    useAgentStore.getState().reset();
    navigate('/');
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate('/comparison');
  }, [navigate]);

  const handleExportAudit = useCallback(() => {
    const data = JSON.stringify(auditTrail, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_log.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [auditTrail]);

  const formatTimestamp = useCallback((ms: number) => {
    const sec = ms / 1000;
    const min = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(3);
    return `${min.toString().padStart(2, '0')}:${s.padStart(6, '0')}`;
  }, []);

  // Gauge values from metrics
  const riskDelta = metrics?.risk_delta ?? 34;
  const latencySec = metrics ? (metrics.latency_ms / 1000) : 4.2;
  const stepsCompleted = metrics?.steps_completed ?? 5;
  const stepsTotal = metrics?.steps_total ?? 5;
  const costSaved = metrics?.cost_saved ?? 0;

  // Determine gauge colors
  const riskColor = riskDelta > 20 ? colors.accent.green : colors.accent.amber;
  const latencyColor = latencySec < 15 ? colors.accent.green : colors.accent.amber;
  const stepsColor = stepsCompleted === stepsTotal ? colors.accent.green : colors.accent.amber;

  return (
    <div className="metrics-screen">
      <div className="scan-line" style={{ opacity: 0.06 }} />

      <div className="metrics-content screen-container">
        {/* Header */}
        <motion.header
          className="metrics-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button className="metrics-back-btn" onClick={handleBack}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke={colors.text.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{
              fontFamily: typography.body.fontFamily,
              fontSize: typography.body.fontSize,
              color: colors.text.secondary,
            }}>IMPACT METRICS</span>
          </button>
        </motion.header>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring' as const, damping: 20, stiffness: 180 }}
          style={{ marginBottom: spacing.xl }}
        >
          <h1 style={{
            fontFamily: typography.h1.fontFamily,
            fontSize: typography.h1.fontSize,
            fontWeight: typography.h1.fontWeight,
            letterSpacing: typography.h1.letterSpacing,
            color: colors.text.primary,
          }}>
            Impact Summary
          </h1>
        </motion.div>

        {/* Gauges */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          style={{ marginBottom: spacing.xl }}
        >
          <motion.div variants={fadeUpVariant} custom={0}>
            <SectionHeader title="Key Metrics" />
          </motion.div>
          <div className="metrics-gauges">
            <motion.div variants={fadeUpVariant} custom={0}>
              <Card delay={0}>
                <MetricGauge value={riskDelta} label="Risk Reduced" suffix="%" color={riskColor} size="md" />
              </Card>
            </motion.div>
            <motion.div variants={fadeUpVariant} custom={200}>
              <Card delay={200}>
                <MetricGauge value={parseFloat(latencySec.toFixed(1))} maxValue={30} label="Resolution Time" suffix="s" color={latencyColor} size="md" />
              </Card>
            </motion.div>
            <motion.div variants={fadeUpVariant} custom={400}>
              <Card delay={400}>
                <MetricGauge value={stepsCompleted} maxValue={stepsTotal} label="Steps Complete" suffix={`/${stepsTotal}`} color={stepsColor} size="md" />
              </Card>
            </motion.div>
            <motion.div variants={fadeUpVariant} custom={600}>
              <Card delay={600}>
                <MetricGauge value={costSaved} maxValue={100} label="Direct Cost" suffix=" PKR" color={colors.accent.green} size="md" />
              </Card>
            </motion.div>
          </div>
        </motion.section>

        {/* Execution Timeline Bar Chart */}
        {actionChain.length > 0 && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            style={{ marginBottom: spacing.xl }}
          >
            <motion.div variants={fadeUpVariant} custom={0}>
              <SectionHeader title="Execution Timeline" />
            </motion.div>
            <motion.div variants={fadeUpVariant} custom={100}>
              <Card delay={100}>
                <div className="metrics-timeline-chart">
                  {actionChain.map((step, i) => {
                    const barWidth = step.latency_ms ? Math.max((step.latency_ms / 1000) * 80, 30) : 30;
                    const barColor = step.status === 'complete' ? colors.accent.green :
                                     step.status === 'failed' ? colors.accent.red :
                                     step.status === 'rolled_back' ? colors.accent.amber :
                                     colors.text.muted;
                    return (
                      <motion.div
                        key={step.step}
                        className="metrics-timeline-row"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.08 }}
                      >
                        <span className="metrics-timeline-label" style={{
                          fontFamily: typography.monoSm.fontFamily,
                          fontSize: typography.monoSm.fontSize,
                          color: colors.text.secondary,
                        }}>
                          {step.name}
                        </span>
                        <div className="metrics-timeline-bar-track">
                          <motion.div
                            className="metrics-timeline-bar"
                            style={{ backgroundColor: barColor }}
                            initial={{ width: 0 }}
                            animate={{ width: barWidth }}
                            transition={{ delay: 0.4 + i * 0.08, type: 'spring' as const, damping: 20, stiffness: 100 }}
                          />
                        </div>
                        <span style={{
                          fontFamily: typography.monoSm.fontFamily,
                          fontSize: typography.monoSm.fontSize,
                          color: colors.text.muted,
                          minWidth: 50,
                          textAlign: 'right',
                        }}>
                          {step.latency_ms ? `${step.latency_ms}ms` : '—'}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          </motion.section>
        )}

        {/* Audit Trail */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          style={{ marginBottom: spacing.xl }}
        >
          <motion.div variants={fadeUpVariant} custom={0}>
            <SectionHeader title="Audit Trail" badge={`${auditTrail.length}`} badgeVariant="neutral" />
          </motion.div>
          <motion.div variants={fadeUpVariant} custom={100}>
            <Card delay={100}>
              <div className="metrics-audit-list">
                {auditTrail.map((entry, i) => (
                  <div
                    key={i}
                    className="metrics-audit-entry"
                    style={{
                      borderLeftColor: statusColorMap[entry.status] || colors.text.muted,
                    }}
                  >
                    <span style={{
                      fontFamily: typography.monoSm.fontFamily,
                      fontSize: typography.monoSm.fontSize,
                      color: colors.text.muted,
                      minWidth: 80,
                      flexShrink: 0,
                    }}>
                      {formatTimestamp(entry.timestamp_ms)}
                    </span>
                    <span style={{
                      fontFamily: typography.mono.fontFamily,
                      fontSize: typography.mono.fontSize,
                      color: statusColorMap[entry.status] || colors.text.primary,
                      flex: 1,
                    }}>
                      {entry.event}
                    </span>
                    <span style={{
                      fontFamily: typography.small.fontFamily,
                      fontSize: typography.small.fontSize,
                      color: colors.text.secondary,
                      flex: 2,
                    }}>
                      {entry.detail}
                    </span>
                  </div>
                ))}
                {auditTrail.length === 0 && (
                  <div style={{
                    padding: spacing.lg,
                    textAlign: 'center',
                    fontFamily: typography.mono.fontFamily,
                    fontSize: typography.mono.fontSize,
                    color: colors.text.muted,
                  }}>
                    No audit entries recorded
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.section>

        {/* Action Buttons */}
        <motion.div
          className="metrics-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, type: 'spring' as const, damping: 20, stiffness: 180 }}
        >
          <motion.button
            className="metrics-export-btn"
            onClick={handleExportAudit}
            whileHover={{ scale: 1.02, borderColor: colors.border.active }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M4 6l4 4 4-4M2 12v2h12v-2" stroke={colors.accent.cyan} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Export Audit JSON</span>
          </motion.button>

          <motion.button
            className="metrics-new-btn"
            onClick={handleNewScenario}
            whileHover={{ scale: 1.02, boxShadow: `0 0 24px rgba(0, 229, 255, 0.4)` }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4l-6 6 6 6" stroke={colors.text.inverse} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 8 8)" />
            </svg>
            <span>New Scenario</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Metrics;
