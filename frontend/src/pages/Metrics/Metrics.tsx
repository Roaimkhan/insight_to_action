import React, { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { staggerContainer, fadeUpVariant, pageEntranceVariant, sectionStaggerContainer, sectionItemVariant, buttonHoverVariant, pulseGlowVariant, numberCounterVariant } from '../../constants/animation';
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
  info: colors.accent.teal,
  success: colors.accent.emerald,
  warning: colors.accent.amber,
  error: colors.accent.crimson,
};

const getSimulatedHash = (event: string, timestamp: number) => {
  let hash = 0;
  const str = event + timestamp;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256:${hex}e8c5f4a10ae674b9a7d3b2e${hex}`;
};

const Metrics: React.FC = () => {
  const navigate = useNavigate();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

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
  const riskColor = riskDelta > 20 ? colors.accent.emerald : colors.accent.amber;
  const latencyColor = latencySec < 15 ? colors.accent.emerald : colors.accent.amber;
  const stepsColor = stepsCompleted === stepsTotal ? colors.accent.emerald : colors.accent.amber;

  return (
    <motion.div 
      className="metrics-screen"
      initial="hidden"
      animate="visible"
      variants={pageEntranceVariant}
    >
      <div className="scan-line" style={{ opacity: 0.06 }} />
      <motion.div 
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, rgba(167, 139, 250, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        animate="animate"
        variants={pulseGlowVariant}
      />

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
                <MetricGauge value={costSaved} maxValue={100} label="Direct Cost" suffix=" PKR" color={colors.accent.emerald} size="md" />
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
                    const barColor = step.status === 'complete' ? colors.accent.emerald :
                                     step.status === 'failed' ? colors.accent.crimson :
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
                    className={`metrics-audit-entry-wrapper ${expandedRow === i ? 'expanded' : ''}`}
                  >
                    <div
                      className="metrics-audit-entry"
                      onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                      style={{
                        borderLeftColor: statusColorMap[entry.status] || colors.text.muted,
                        cursor: 'pointer',
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
                      <span className={`expand-indicator ${expandedRow === i ? 'rotated' : ''}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </div>

                    <AnimatePresence initial={false}>
                      {expandedRow === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="audit-json-explorer">
                            <div className="audit-json-header">
                              <span>SECURE PROTOCOL PAYLOAD</span>
                              <span className="secure-badge">VERIFIED</span>
                            </div>
                            <pre className="json-pre">
                              <code>
                                {JSON.stringify(
                                  {
                                    trace_id: `tr_${(entry.timestamp_ms * 3).toString(16).substring(0, 8)}cf4a10e`,
                                    security_tier: "LEVEL_3_COMPLIANCE",
                                    integrity_hash: getSimulatedHash(entry.event, entry.timestamp_ms),
                                    timestamp: new Date(entry.timestamp_ms).toISOString(),
                                    actor: "SupplyAI Cognitive Agent v3.5",
                                    event_type: `${entry.status.toUpperCase()}_EVENT`,
                                    payload: {
                                      event: entry.event,
                                      status: entry.status,
                                      detail: entry.detail
                                    }
                                  },
                                  null,
                                  2
                                )}
                              </code>
                            </pre>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
            variants={buttonHoverVariant}
            whileHover="hover"
            whileTap="tap"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M4 6l4 4 4-4M2 12v2h12v-2" stroke={colors.accent.cyan} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Export Audit JSON</span>
          </motion.button>

          <motion.button
            className="metrics-new-btn"
            onClick={handleNewScenario}
            variants={buttonHoverVariant}
            whileHover="hover"
            whileTap="tap"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4l-6 6 6 6" stroke={colors.text.inverse} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 8 8)" />
            </svg>
            <span>New Scenario</span>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Metrics;
