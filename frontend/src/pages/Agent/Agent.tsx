import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { staggerContainer, fadeUpVariant, pageEntranceVariant, sectionStaggerContainer, sectionItemVariant, buttonHoverVariant, pulseGlowVariant } from '../../constants/animation';
import { useAgentStore } from '../../store/agentStore';
import { startMockStream, scenarioBeforeAfter } from '../../services/mockStream';
import {
  Card,
  SectionHeader,
  ActionStepper,
  TerminalBlock,
  PulsingDot,
  Badge,
  SourceCard,
  ContradictionCard,
  SelfHealPanel,
  NodeBadge,
  BrainIcon,
} from '../../components';
import type { ActionStep } from '../../components';
import './Agent.css';
import UploadPromptPanel from '../../components/UploadPromptPanel/UploadPromptPanel';

const Agent: React.FC = () => {
  const navigate = useNavigate();
  const cleanupRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Zustand selectors — granular subscriptions
  const status = useAgentStore((s) => s.status);
  const scenarioId = useAgentStore((s) => s.scenarioId);
  const currentNode = useAgentStore((s) => s.currentNode);
  const elapsedMs = useAgentStore((s) => s.elapsedMs);
  const sources = useAgentStore((s) => s.sources);
  const contradictions = useAgentStore((s) => s.contradictions);
  const actionChain = useAgentStore((s) => s.actionChain);
  const llmTokens = useAgentStore((s) => s.llmTokens);
  const healEvent = useAgentStore((s) => s.healEvent);

  // Derived — convert action chain to ActionStep[]
  const steps: ActionStep[] = useMemo(() =>
    actionChain.map((a) => ({
      id: `step-${a.step}`,
      label: a.name,
      description: a.description,
      status: a.status,
      duration: a.latency_ms ? `${a.latency_ms}ms` : undefined,
    })),
    [actionChain]
  );

  // Assembled LLM text
  const llmLines = useMemo(() => {
    const text = llmTokens.join('');
    return text.split('\n').filter(Boolean);
  }, [llmTokens]);

  // Source shimmer placeholders
  const sourceSlots = useMemo(() => {
    const filled = sources.length;
    const placeholders = Math.max(5 - filled, 0);
    return { filled, placeholders };
  }, [sources]);

  // ── Start mock stream on mount ────────────────────────────────────────
  useEffect(() => {
    const store = useAgentStore.getState();
    const sid = store.scenarioId;
    if (!sid || store.status !== 'running') return;

    startTimeRef.current = Date.now();

    // Elapsed timer — updates every 100ms
    timerRef.current = setInterval(() => {
      useAgentStore.getState().setElapsed(Date.now() - startTimeRef.current);
    }, 100);

    // Set before state
    const ba = scenarioBeforeAfter[sid];
    if (ba) {
      store.setBeforeState(ba.before);
    }

    const cleanup = startMockStream(sid, {
      node_start: (e) => {
        useAgentStore.getState().setCurrentNode(e.node);
        useAgentStore.getState().addAuditEntry({
          timestamp_ms: Date.now() - startTimeRef.current,
          event: `node_start`,
          detail: `Entering node: ${e.node}`,
          status: 'info',
        });
      },
      source_ingested: (e) => {
        useAgentStore.getState().addSource(e.source);
        useAgentStore.getState().addAuditEntry({
          timestamp_ms: Date.now() - startTimeRef.current,
          event: `${e.source.source_type}_ingested`,
          detail: e.source.label || e.source.source_id,
          status: 'success',
        });
      },
      contradiction: (e) => {
        useAgentStore.getState().addContradiction(e.data);
        useAgentStore.getState().addAuditEntry({
          timestamp_ms: Date.now() - startTimeRef.current,
          event: `contradiction`,
          detail: `${e.data.source_a.type} vs ${e.data.source_b.type}`,
          status: 'warning',
        });
      },
      llm_token: (e) => {
        useAgentStore.getState().appendToken(e.content);
      },
      action_chain: (e) => {
        useAgentStore.getState().setChain(e.chain);
        useAgentStore.getState().addAuditEntry({
          timestamp_ms: Date.now() - startTimeRef.current,
          event: `plan_generated`,
          detail: `${e.chain.length} steps planned`,
          status: 'info',
        });
      },
      step_start: (e) => {
        useAgentStore.getState().updateStep(e.step, 'active');
        useAgentStore.getState().addAuditEntry({
          timestamp_ms: Date.now() - startTimeRef.current,
          event: `step_${e.step}_start`,
          detail: e.action.name,
          status: 'info',
        });
      },
      step_complete: (e) => {
        const latency = Math.floor(200 + Math.random() * 500);
        useAgentStore.getState().updateStep(e.step, 'complete', latency);
        useAgentStore.getState().addAuditEntry({
          timestamp_ms: Date.now() - startTimeRef.current,
          event: `step_${e.step}_complete`,
          detail: `Completed in ${latency}ms`,
          status: 'success',
        });
      },
      step_failed: (e) => {
        useAgentStore.getState().updateStep(e.step, 'failed');
        useAgentStore.getState().addAuditEntry({
          timestamp_ms: Date.now() - startTimeRef.current,
          event: `step_${e.step}_failed`,
          detail: e.error,
          status: 'error',
        });
      },
      self_heal: (e) => {
        useAgentStore.getState().setHealEvent({
          tier: e.tier,
          detail: e.detail,
          status: e.tier === 1 ? 'retrying' : e.tier === 2 ? 'fallback' : 'rollback',
          attempt: e.tier,
          maxAttempts: 3,
        });
        useAgentStore.getState().addAuditEntry({
          timestamp_ms: Date.now() - startTimeRef.current,
          event: `self_heal_tier_${e.tier}`,
          detail: e.detail,
          status: 'warning',
        });
        // Clear heal event after 2 seconds
        setTimeout(() => {
          useAgentStore.getState().setHealEvent(null);
        }, 2000);
      },
      complete: (e) => {
        const store = useAgentStore.getState();
        store.setMetrics(e.metrics);
        store.setStatus('complete');

        // Set after state
        const sid = store.scenarioId;
        if (sid) {
          const ba = scenarioBeforeAfter[sid];
          if (ba) store.setAfterState(ba.after);
        }

        // Resolve all contradictions
        store.contradictions.forEach((c) => {
          store.resolveContradiction(c.id);
        });

        store.addAuditEntry({
          timestamp_ms: Date.now() - startTimeRef.current,
          event: `chain_complete`,
          detail: `${e.metrics.steps_completed}/${e.metrics.steps_total} steps completed`,
          status: 'success',
        });

        if (timerRef.current) clearInterval(timerRef.current);

        // Navigate to comparison after brief delay
        setTimeout(() => {
          navigate('/comparison', { replace: true });
        }, 2000);
      },
    });

    cleanupRef.current = cleanup;

    return () => {
      if (cleanupRef.current) cleanupRef.current();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [navigate]);

  const handleBack = useCallback(() => {
    if (cleanupRef.current) cleanupRef.current();
    if (timerRef.current) clearInterval(timerRef.current);
    useAgentStore.getState().reset();
    navigate('/');
  }, [navigate]);

  const scenarioLabel = scenarioId ? scenarioId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Agent';

  return (
    <motion.div 
      className="agent-screen"
      initial="hidden"
      animate="visible"
      variants={pageEntranceVariant}
    >
      <div className="scan-line" style={{ opacity: 0.08 }} />
      <motion.div 
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(24, 72, 200, 0.1) 0%, rgba(24, 72, 200, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        animate="animate"
        variants={pulseGlowVariant}
      />

      <div className="agent-content screen-container">
        {/* ── Header ────────────────────────────────────────────── */}
        <motion.header
          className="agent-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button className="agent-back-btn" onClick={handleBack}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke={colors.text.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="agent-header__info">
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <BrainIcon size={20} color={colors.accent.cyan} />
              <h1 style={{
                fontFamily: typography.h2.fontFamily,
                fontSize: typography.h2.fontSize,
                fontWeight: typography.h2.fontWeight,
                color: colors.text.primary,
              }}>
                {scenarioLabel}
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <PulsingDot color={status === 'complete' ? colors.accent.emerald : colors.accent.cyan} size={6} />
                <Badge
                  label={status === 'complete' ? 'COMPLETE' : 'RUNNING'}
                  variant={status === 'complete' ? 'success' : 'info'}
                />
              </div>
            </div>
          </div>
        </motion.header>

        {/* Upload + Prompt Panel */}
        <div style={{ marginBottom: spacing.md }}>
          <UploadPromptPanel />
        </div>

        {/* Node Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: spacing.md }}
        >
          <NodeBadge node={currentNode} elapsedMs={elapsedMs} />
        </motion.div>

        {/* ── Main Grid ─────────────────────────────────────────── */}
        <div className="agent-grid">
          {/* Left Column: Sources + Steps + Contradiction */}
          <motion.div
            className="agent-steps-col"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Source Ingestion */}
            <SectionHeader
              title="Source Ingestion"
              badge={`${sources.length}/5`}
              badgeVariant={sources.length >= 5 ? 'success' : 'info'}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginBottom: spacing.lg }}>
              {sources.map((src, i) => (
                <SourceCard key={src.source_id} source={src} animationDelay={i * 80} />
              ))}
              {Array.from({ length: sourceSlots.placeholders }).map((_, i) => (
                <SourceCard
                  key={`placeholder-${i}`}
                  source={{ source_id: '', source_type: 'pdf', credibility_score: 0, freshness: 'fresh', domain_hints: [], ingested_at: '' }}
                  isLoading
                  animationDelay={(sources.length + i) * 80}
                />
              ))}
            </div>

            {/* Contradictions */}
            {contradictions.length > 0 && (
              <div style={{ marginBottom: spacing.lg }}>
                <SectionHeader
                  title="Contradictions"
                  badge={`${contradictions.length}`}
                  badgeVariant="danger"
                  accentColor={colors.accent.crimson}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                  {contradictions.map((c, i) => (
                    <ContradictionCard key={c.id} contradiction={c} animationDelay={i * 100} />
                  ))}
                </div>
              </div>
            )}

            {/* Action Chain */}
            {steps.length > 0 && (
              <>
                <SectionHeader title="Action Chain" badge={`${steps.filter(s => s.status === 'complete').length}/${steps.length}`} badgeVariant="info" />
                <Card delay={100}>
                  <ActionStepper steps={steps} />
                </Card>
              </>
            )}
          </motion.div>

          {/* Right Column: LLM Log */}
          <motion.div
            className="agent-log-col"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <SectionHeader title="Agent Reasoning" badge="LIVE" badgeVariant="thinking" accentColor={colors.accent.violet} />
            <Card delay={200} className="obsidian-card-wrap">
              <TerminalBlock title="agent.reasoning.log" maxHeight={480} isActive={status === 'running'}>
                <div style={{ paddingBottom: '12px' }}>
                  {llmLines.map((line, i) => {
                    const isLast = i === llmLines.length - 1;
                    return (
                      <motion.div
                        key={i}
                        initial={isLast ? { opacity: 0.3, y: 3 } : { opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          color: line.includes('CONTRADICTION') ? '#F87171' : // brighter red for terminal
                                 line.startsWith('>') ? '#2DD4BF' : // bright teal
                                 line.includes('⚠') ? '#FBBF24' : // bright amber
                                 line.includes('→') ? '#34D399' : // bright emerald
                                 '#E9D5FF', // bright mauve/violet for text visibility in dark mode
                          textShadow: isLast && status === 'running' ? '0 0 10px rgba(167, 139, 250, 0.45)' : 'none',
                          marginBottom: 4,
                          fontWeight: isLast && status === 'running' ? 700 : 400,
                          letterSpacing: '0.4px',
                        }}
                      >
                        {line || '\u00A0'}
                      </motion.div>
                    );
                  })}
                  {status === 'running' && (
                    <span className="blinking-cursor" />
                  )}
                </div>
              </TerminalBlock>
            </Card>
          </motion.div>
        </div>

        {/* Complete Banner */}
        <AnimatePresence>
          {status === 'complete' && (
            <motion.div
              className="agent-complete-banner"
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 200 }}
            >
              <span style={{
                fontFamily: typography.monoBold.fontFamily,
                fontSize: typography.monoBold.fontSize,
                fontWeight: typography.monoBold.fontWeight,
                color: colors.accent.emerald,
              }}>
                CHAIN COMPLETE ✓
              </span>
              <span style={{
                fontFamily: typography.monoSm.fontFamily,
                fontSize: typography.monoSm.fontSize,
                color: colors.text.muted,
              }}>
                Redirecting to results...
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Self-Heal Panel */}
      <SelfHealPanel event={healEvent} />
    </motion.div>
  );
};

export default Agent;
