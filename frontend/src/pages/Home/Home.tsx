import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { staggerContainer, fadeUpVariant, pageEntranceVariant, sectionStaggerContainer, sectionItemVariant, buttonHoverVariant, floatingVariant, pulseGlowVariant } from '../../constants/animation';
import { useAgentStore } from '../../store/agentStore';
import type { ScenarioId } from '../../types/agent';
import {
  Card,
  SectionHeader,
  MetricGauge,
  PulsingDot,
  Badge,
  BrainIcon,
  PdfIcon,
  CsvIcon,
  WebIcon,
  TableIcon,
  RealtimeIcon,
  ArrowRightIcon,
  PlayIcon,
} from '../../components';
import './Home.css';

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
    accent: colors.accent.crimson,
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
  
  // Custom upload states
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; progress: number }[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleRunScenario = useCallback((id: ScenarioId) => {
    startScenario(id);
    navigate('/agent');
  }, [navigate, startScenario]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArray = Array.from(e.dataTransfer.files).map(file => ({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        progress: 0
      }));

      setUploadedFiles(prev => [...prev, ...filesArray]);

      // Simulate liquid progress uploading
      filesArray.forEach((file) => {
        let p = 0;
        const interval = setInterval(() => {
          p += 10;
          setUploadedFiles(current =>
            current.map(f => f.name === file.name ? { ...f, progress: Math.min(p, 100) } : f)
          );
          if (p >= 100) clearInterval(interval);
        }, 120);
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const filesArray = Array.from(e.target.files).map(file => ({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        progress: 0
      }));

      setUploadedFiles(prev => [...prev, ...filesArray]);

      filesArray.forEach((file) => {
        let p = 0;
        const interval = setInterval(() => {
          p += 10;
          setUploadedFiles(current =>
            current.map(f => f.name === file.name ? { ...f, progress: Math.min(p, 100) } : f)
          );
          if (p >= 100) clearInterval(interval);
        }, 120);
      });
    }
  };

  return (
    <motion.div 
      className="home-screen"
      initial="hidden"
      animate="visible"
      variants={pageEntranceVariant}
    >
      {/* Background effects */}
      <div className="dot-grid-bg" />
      <motion.div 
        className="atmospheric-glow"
        animate="animate"
        variants={pulseGlowVariant}
      />
      <div className="scan-line scan-line--subtle" />

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
                fontWeight: 700
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
            <span style={{ color: colors.accent.cyan }}>Supply AI Agent</span>
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
            Multi-domain operations command center. Upload sources, resolve discrepancies, execute self-healing chains, and audit real-time supply flows.
          </motion.p>
        </motion.section>

        {/* ── Ingestion Dropzone ───────────────────────────────────── */}
        <motion.section
          className="home-upload"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SectionHeader title="Ingest Operational Sources" badge="NEW" badgeVariant="info" />
          
          <div className="upload-grid">
            <motion.div 
              className={`dropzone glass ${isDragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              whileHover={{ scale: 1.008 }}
              whileTap={{ scale: 0.995 }}
            >
              <input 
                type="file" 
                id="file-input" 
                multiple 
                onChange={handleFileSelect} 
                style={{ display: 'none' }}
              />
              <label htmlFor="file-input" className="dropzone-label flex-center">
                {/* Micro-kinetic meshing gears */}
                <div className="gear-system-container">
                  <svg className="dropzone-gears" width="76" height="76" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Gear 1 (Primary brand color) */}
                    <g className="gear-big" style={{ transformOrigin: '42px 42px' }}>
                      <circle cx="42" cy="42" r="22" stroke="var(--brand)" strokeWidth="1.5" strokeDasharray="8 4" />
                      <circle cx="42" cy="42" r="16" stroke="var(--brand)" strokeWidth="3" />
                      <circle cx="42" cy="42" r="8" stroke="var(--brand)" strokeWidth="1.5" />
                      <path d="M42 26v6M42 52v6M26 42h6M52 42h6" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
                    </g>
                    {/* Gear 2 (Secondary cyan color) */}
                    <g className="gear-small" style={{ transformOrigin: '72px 58px' }}>
                      <circle cx="72" cy="58" r="14" stroke="#06B6D4" strokeWidth="1.2" strokeDasharray="5 3" />
                      <circle cx="72" cy="58" r="10" stroke="#06B6D4" strokeWidth="2.5" />
                      <circle cx="72" cy="58" r="5" stroke="#06B6D4" strokeWidth="1.2" />
                      <path d="M72 48v4M72 64v4M62 58h4M78 58h4" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" />
                    </g>
                  </svg>
                  <div className="gear-laser-sweep" />
                </div>
                <span className="dropzone-title font-heading">DRAG & DROP SOURCE MATERIAL</span>
                <span className="dropzone-desc font-body">PDF logs, CSV manifests, and telemetry files. System handles parsing & integrity audits.</span>
                <span className="dropzone-btn font-mono">BROWSE LOCAL STORAGE</span>
              </label>
            </motion.div>

            {/* List of uploaded files */}
            <AnimatePresence>
              {uploadedFiles.length > 0 && (
                <motion.div 
                  className="uploaded-files-list glass"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h3 className="list-title font-heading">Ingested Queue</h3>
                  <div className="files-scroll">
                    {uploadedFiles.map((file, i) => (
                      <motion.div 
                        key={`${file.name}-${i}`}
                        className="file-row"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="file-info">
                          <span className="file-name font-body">{file.name}</span>
                          <span className="file-size font-mono">{file.size}</span>
                        </div>
                        <div className="file-progress-bar">
                          <motion.div 
                            className="file-progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${file.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="file-status font-mono">
                          {file.progress < 100 ? `${file.progress}%` : 'INGESTED'}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  <motion.button 
                    className="custom-run-btn font-mono"
                    onClick={() => handleRunScenario('supply_chain')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    RUN ANALYSIS WITH CUSTOM SOURCES
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* ── Demo Scenarios ──────────────────────────────────────── */}
        <motion.section
          className="home-scenarios"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpVariant} custom={0}>
            <SectionHeader title="Simulation Scenarios" badge="3" badgeVariant="info" />
          </motion.div>
          <div className="home-scenarios__grid">
            {scenarios.map((scenario, i) => (
              <motion.div key={scenario.id} variants={fadeUpVariant} custom={300 + i * 80}>
                <Card
                  delay={300 + i * 80}
                  className="scenario-card"
                  onClick={() => handleRunScenario(scenario.id)}
                >
                  {/* Neon laser sweep grid lines */}
                  <div className="laser-scanner" style={{ '--accent-color': scenario.accent } as React.CSSProperties} />
                  <div className="card-mesh-pattern" />
                  
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
                        background: 'rgba(24, 72, 200, 0.04)',
                        borderRadius: radius.sm,
                        border: '1px solid rgba(24, 72, 200, 0.08)',
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
                      scale: 1.02,
                      transition: { type: 'spring' as const, damping: 18, stiffness: 300, duration: 0.15 },
                    }}
                    whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
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
            <SectionHeader title="System Ingestion Limits" badge={`${sourceTypes.reduce((a, b) => a + b.count, 0)}`} badgeVariant="neutral" />
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
                        backgroundColor: colors.accent.cyanGlow,
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: colors.border.cyan,
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
            <SectionHeader title="System Dashboard Metrics" badge="LIVE" badgeVariant="info" />
          </motion.div>
          <div className="home-metrics__grid">
            <motion.div variants={fadeUpVariant} custom={100}>
              <Card delay={100}>
                <MetricGauge value={87} label="Credibility Score" color={colors.accent.emerald} size="sm" />
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
                <MetricGauge value={3} maxValue={20} label="Contradictions" suffix="" color={colors.accent.crimson} size="sm" />
              </Card>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default Home;
