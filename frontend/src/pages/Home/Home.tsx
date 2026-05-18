import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius, layout } from '../../constants/spacing';
import { staggerContainer, fadeUpVariant } from '../../constants/animation';
import { useAgentStore } from '../../store/agentStore';
import type { ScenarioId } from '../../types/agent';
import {
  Card,
  SectionHeader,
  MetricGauge,
  PulsingDot,
  Badge,
  CredibilityBar,
  BrainIcon,
  PdfIcon,
  CsvIcon,
  WebIcon,
  TableIcon,
  RealtimeIcon,
  ArrowRightIcon,
  BoltIcon,
  ShieldIcon,
  PlayIcon,
} from '../../components';
import './Home.css';

// ── Scenario Definitions ─────────────────────────────────────────────────
const scenarios: {
  id: ScenarioId;
  title: string;
  accent: string;
  sources: number;
  contradictions: number;
  sourceTypes: string[];
  description: string;
}[] = [
  {
    id: 'supply_chain',
    title: 'SUPPLY CHAIN CRISIS',
    accent: colors.accent.amber,
    sources: 5,
    contradictions: 1,
    sourceTypes: ['PDF', 'CSV', 'WEB', 'TABLE', 'FEED'],
    description: 'Stock discrepancy between IoT sensors and stale procurement data',
  },
  {
    id: 'power_grid',
    title: 'POWER GRID FAULT',
    accent: colors.accent.red,
    sources: 5,
    contradictions: 2,
    sourceTypes: ['PDF', 'CSV', 'WEB', 'TABLE', 'FEED'],
    description: 'Outage detection with conflicting load balance and sensor readings',
  },
  {
    id: 'sentiment_crisis',
    title: 'SENTIMENT CRISIS',
    accent: colors.accent.violet,
    sources: 5,
    contradictions: 1,
    sourceTypes: ['PDF', 'CSV', 'WEB', 'TABLE', 'FEED'],
    description: 'Brand sentiment spike with stale social data vs real-time API',
  },
];

const sourceTypes = [
  { type: 'PDF', icon: PdfIcon, count: 12, label: 'Documents' },
  { type: 'CSV', icon: CsvIcon, count: 8, label: 'Datasets' },
  { type: 'WEB', icon: WebIcon, count: 23, label: 'Web Sources' },
  { type: 'TABLE', icon: TableIcon, count: 5, label: 'Tables' },
  { type: 'REALTIME', icon: RealtimeIcon, count: 3, label: 'Live Feeds' },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const startScenario = useAgentStore((s) => s.startScenario);

  const handleRunScenario = useCallback((id: ScenarioId) => {
    startScenario(id);
    navigate('/agent');
  }, [navigate, startScenario]);

  return (
    <div className="home-screen">
      {/* Background effects */}
      <div className="dot-grid-bg" />
      <div className="atmospheric-glow" />
      <div className="scan-line" />

      <div className="home-content screen-container">
        {/* ── Hero Section ──────────────────────────────────────────── */}
        <motion.section
          className="home-hero"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpVariant} custom={0} className="home-hero__top">
            <div className="home-hero__status">
              <PulsingDot color={colors.accent.cyan} />
              <span style={{
                fontFamily: typography.monoSm.fontFamily,
                fontSize: typography.monoSm.fontSize,
                color: colors.accent.cyan,
              }}>
                SYSTEM ONLINE
              </span>
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUpVariant}
            custom={100}
            style={{
              fontFamily: typography.h1.fontFamily,
              fontSize: '42px',
              fontWeight: typography.h1.fontWeight,
              letterSpacing: typography.h1.letterSpacing,
              color: colors.text.primary,
              lineHeight: 1.1,
            }}
          >
            Autonomous Content
            <br />
            <span style={{ color: colors.accent.cyan }}>Agent</span>
          </motion.h1>

          <motion.p
            variants={fadeUpVariant}
            custom={200}
            style={{
              fontFamily: typography.body.fontFamily,
              fontSize: typography.body.fontSize,
              color: colors.text.secondary,
              maxWidth: 520,
              marginTop: spacing.sm,
              lineHeight: typography.body.lineHeight,
            }}
          >
            Multi-domain · 5 input types · Real-time contradiction detection · Self-healing execution chains · Full audit trail
          </motion.p>

          <motion.div
            variants={fadeUpVariant}
            custom={250}
            style={{
              marginTop: spacing.lg,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.lg,
            }}
          >
            <span style={{
              fontFamily: typography.monoXl.fontFamily,
              fontSize: typography.monoXl.fontSize,
              fontWeight: typography.monoXl.fontWeight,
              color: colors.accent.cyan,
              lineHeight: 1,
            }}>
              5
            </span>
            <span style={{
              fontFamily: typography.label.fontFamily,
              fontSize: typography.label.fontSize,
              fontWeight: typography.label.fontWeight,
              letterSpacing: '2px',
              textTransform: typography.label.textTransform,
              color: colors.text.muted,
            }}>
              INPUT TYPES
            </span>
          </motion.div>
        </motion.section>

        {/* ── Demo Scenarios ──────────────────────────────────────── */}
        <motion.section
          className="home-scenarios"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpVariant} custom={0}>
            <SectionHeader title="Demo Scenarios" badge="3" badgeVariant="info" />
          </motion.div>
          <div className="home-scenarios__grid">
            {scenarios.map((scenario, i) => (
              <motion.div key={scenario.id} variants={fadeUpVariant} custom={300 + i * 80}>
                <Card
                  delay={300 + i * 80}
                  className="scenario-card"
                  onClick={() => handleRunScenario(scenario.id)}
                >
                  {/* Scenario Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: scenario.accent,
                      boxShadow: `0 0 8px ${scenario.accent}`,
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: typography.h3.fontFamily,
                      fontSize: typography.h3.fontSize,
                      fontWeight: 600,
                      color: colors.text.primary,
                      flex: 1,
                    }}>
                      {scenario.title}
                    </span>
                    <ArrowRightIcon size={16} color={colors.text.muted} />
                  </div>

                  {/* Description */}
                  <p style={{
                    fontFamily: typography.small.fontFamily,
                    fontSize: typography.small.fontSize,
                    lineHeight: typography.small.lineHeight,
                    color: colors.text.secondary,
                    marginBottom: spacing.md,
                  }}>
                    {scenario.description}
                  </p>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' }}>
                    <Badge label={`${scenario.sources} SOURCES`} variant="neutral" />
                    <Badge label={`${scenario.contradictions} CONTRADICTION${scenario.contradictions > 1 ? 'S' : ''}`} variant="danger" />
                  </div>

                  {/* Source type chips */}
                  <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap', marginBottom: spacing.md }}>
                    {scenario.sourceTypes.map((st) => (
                      <span key={st} style={{
                        fontFamily: typography.monoSm.fontFamily,
                        fontSize: '10px',
                        color: colors.text.muted,
                        padding: '2px 6px',
                        background: 'rgba(0, 229, 255, 0.04)',
                        borderRadius: radius.sm,
                        border: '1px solid rgba(0, 229, 255, 0.06)',
                      }}>
                        {st}
                      </span>
                    ))}
                  </div>

                  {/* Run Button */}
                  <motion.button
                    className="scenario-run-btn"
                    style={{
                      '--accent': scenario.accent,
                      borderColor: `${scenario.accent}44`,
                      color: scenario.accent,
                    } as React.CSSProperties}
                    whileHover={{
                      backgroundColor: `${scenario.accent}18`,
                      borderColor: `${scenario.accent}88`,
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <PlayIcon size={14} color={scenario.accent} />
                    <span>RUN SCENARIO</span>
                  </motion.button>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Connected Sources ──────────────────────────────────── */}
        <motion.section
          className="home-sources"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpVariant} custom={0}>
            <SectionHeader title="Input Types" badge={`${sourceTypes.reduce((a, b) => a + b.count, 0)}`} badgeVariant="neutral" />
          </motion.div>
          <div className="home-sources__grid">
            {sourceTypes.map((src, i) => {
              const IconComp = src.icon;
              return (
                <motion.div key={src.type} variants={fadeUpVariant} custom={i * 80}>
                  <Card delay={i * 80} className="source-type-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: radius.md,
                        background: 'rgba(0, 229, 255, 0.06)',
                        border: '1px solid rgba(0, 229, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <IconComp size={18} color={colors.accent.cyan} />
                      </div>
                      <div>
                        <div style={{
                          fontFamily: typography.monoBold.fontFamily,
                          fontSize: typography.monoBold.fontSize,
                          fontWeight: typography.monoBold.fontWeight,
                          color: colors.text.primary,
                        }}>
                          {src.count}
                        </div>
                        <div style={{
                          fontFamily: typography.small.fontFamily,
                          fontSize: typography.small.fontSize,
                          color: colors.text.muted,
                        }}>
                          {src.label}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* ── System Metrics ──────────────────────────────────────── */}
        <motion.section
          className="home-metrics"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpVariant} custom={0}>
            <SectionHeader title="System Metrics" badge="LIVE" badgeVariant="info" />
          </motion.div>
          <div className="home-metrics__grid">
            <motion.div variants={fadeUpVariant} custom={100}>
              <Card delay={100}>
                <MetricGauge value={87} label="Credibility Score" color={colors.accent.green} size="sm" />
              </Card>
            </motion.div>
            <motion.div variants={fadeUpVariant} custom={200}>
              <Card delay={200}>
                <MetricGauge value={94} label="Chain Success Rate" color={colors.accent.cyan} size="sm" />
              </Card>
            </motion.div>
            <motion.div variants={fadeUpVariant} custom={300}>
              <Card delay={300}>
                <MetricGauge value={12} maxValue={50} label="Active Chains" suffix="" color={colors.accent.cyan} size="sm" />
              </Card>
            </motion.div>
            <motion.div variants={fadeUpVariant} custom={400}>
              <Card delay={400}>
                <MetricGauge value={3} maxValue={20} label="Contradictions" suffix="" color={colors.accent.red} size="sm" />
              </Card>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Home;
