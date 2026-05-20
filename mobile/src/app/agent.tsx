// src/app/agent.tsx — Screen 2: Live Agent Execution (HERO SCREEN)
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, radius, anim } from '../constants/spacing';
import { useAgentStore } from '../store/agentStore';
import { startMockStream, scenarioBeforeStates, scenarioAfterStates } from '../services/mockStream';
import NodeBadge from '../components/NodeBadge';
import SourceCard from '../components/SourceCard';
import ContradictionCard from '../components/ContradictionCard';
import ActionStepper from '../components/ActionStepper';
import LLMLogStream from '../components/LLMLogStream';
import SelfHealPanel from '../components/SelfHealPanel';
import PulsingDot from '../components/ui/PulsingDot';
import Badge from '../components/ui/Badge';
import ScanLine from '../components/ui/ScanLine';
import type { ScenarioId } from '../types/agent';

export default function AgentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cleanupRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Granular store selectors
  const scenarioId = useAgentStore((s) => s.scenarioId);
  const status = useAgentStore((s) => s.status);
  const currentNode = useAgentStore((s) => s.currentNode);
  const sources = useAgentStore((s) => s.sources);
  const contradictions = useAgentStore((s) => s.contradictions);
  const actionChain = useAgentStore((s) => s.actionChain);
  const llmTokens = useAgentStore((s) => s.llmTokens);
  const healEvent = useAgentStore((s) => s.healEvent);

  const setCurrentNode = useAgentStore((s) => s.setCurrentNode);
  const addSource = useAgentStore((s) => s.addSource);
  const addContradiction = useAgentStore((s) => s.addContradiction);
  const setChain = useAgentStore((s) => s.setChain);
  const updateStep = useAgentStore((s) => s.updateStep);
  const appendToken = useAgentStore((s) => s.appendToken);
  const setHealEvent = useAgentStore((s) => s.setHealEvent);
  const setStatus = useAgentStore((s) => s.setStatus);
  const setMetrics = useAgentStore((s) => s.setMetrics);
  const setBeforeState = useAgentStore((s) => s.setBeforeState);
  const setAfterState = useAgentStore((s) => s.setAfterState);
  const addAuditEntry = useAgentStore((s) => s.addAuditEntry);
  const setElapsed = useAgentStore((s) => s.setElapsed);
  const resolveContradiction = useAgentStore((s) => s.resolveContradiction);

  const [elapsedMs, setElapsedLocal] = useState(0);

  // Banner animation
  const bannerY = useSharedValue(-100);
  const contentDim = useSharedValue(1);

  // Entrance animations for PHASE 1
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  const sourcesSectionOpacity = useSharedValue(0);
  const sourcesSectionTranslateY = useSharedValue(16);

  const actionChainSectionOpacity = useSharedValue(0);
  const actionChainSectionTranslateY = useSharedValue(16);

  const llmSectionOpacity = useSharedValue(0);
  const llmSectionTranslateY = useSharedValue(16);

  useEffect(() => {
    // Trigger entrance animations on mount
    headerOpacity.value = withTiming(1, { duration: anim.normal });
    headerTranslateY.value = withSpring(0, anim.spring);

    sourcesSectionOpacity.value = withDelay(150, withTiming(1, { duration: anim.normal }));
    sourcesSectionTranslateY.value = withDelay(150, withSpring(0, anim.spring));

    actionChainSectionOpacity.value = withDelay(300, withTiming(1, { duration: anim.normal }));
    actionChainSectionTranslateY.value = withDelay(300, withSpring(0, anim.spring));

    llmSectionOpacity.value = withDelay(450, withTiming(1, { duration: anim.normal }));
    llmSectionTranslateY.value = withDelay(450, withSpring(0, anim.spring));
  }, []);

  // Start mock stream
  useEffect(() => {
    if (!scenarioId) return;

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedLocal(Date.now() - startTimeRef.current);
    }, 100);

    // Set before state
    if (scenarioBeforeStates[scenarioId]) {
      setBeforeState(scenarioBeforeStates[scenarioId]);
    }

    const cleanup = startMockStream(scenarioId, {
      node_start: (e) => {
        setCurrentNode(e.node);
        addAuditEntry({ timestamp_ms: Date.now() - startTimeRef.current, event: 'node_start', detail: e.node, status: 'info' });
      },
      source_ingested: (e) => {
        addSource(e.source);
        addAuditEntry({ timestamp_ms: Date.now() - startTimeRef.current, event: 'source_ingested', detail: e.source.label ?? e.source.source_id, status: 'success' });
      },
      contradiction: (e) => {
        addContradiction(e.data);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        addAuditEntry({ timestamp_ms: Date.now() - startTimeRef.current, event: 'contradiction', detail: `${e.data.source_a.type} vs ${e.data.source_b.type}`, status: 'warning' });
      },
      action_chain: (e) => {
        setChain(e.chain);
        addAuditEntry({ timestamp_ms: Date.now() - startTimeRef.current, event: 'action_chain', detail: `${e.chain.length} steps planned`, status: 'info' });
      },
      step_start: (e) => {
        updateStep(e.step, 'active');
        addAuditEntry({ timestamp_ms: Date.now() - startTimeRef.current, event: `step_${e.step}_start`, detail: e.action.name, status: 'info' });
      },
      step_complete: (e) => {
        updateStep(e.step, 'complete', 200 + Math.floor(Math.random() * 400));
        addAuditEntry({ timestamp_ms: Date.now() - startTimeRef.current, event: `step_${e.step}_complete`, detail: 'Success', status: 'success' });
      },
      step_failed: (e) => {
        updateStep(e.step, 'failed');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        addAuditEntry({ timestamp_ms: Date.now() - startTimeRef.current, event: `step_${e.step}_failed`, detail: e.error, status: 'error' });
      },
      self_heal: (e) => {
        setHealEvent({ tier: e.tier, detail: e.detail, attempt: 1, maxAttempts: 3, status: 'retrying' });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        addAuditEntry({ timestamp_ms: Date.now() - startTimeRef.current, event: 'self_heal', detail: `Tier ${e.tier}: ${e.detail}`, status: 'warning' });
        
        // Auto-resolve after 1.5s
        setTimeout(() => {
          setHealEvent({ tier: e.tier, detail: 'Recovery successful', status: 'success', attempt: 2, maxAttempts: 3 });
        }, 1500);
      },
      llm_token: (e) => {
        appendToken(e.content);
      },
      complete: (e) => {
        setStatus('complete');
        setMetrics(e.metrics);
        if (scenarioAfterStates[scenarioId]) {
          setAfterState(scenarioAfterStates[scenarioId]);
        }
        
        // Resolve contradictions
        contradictions.forEach((c) => resolveContradiction(c.id));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addAuditEntry({ timestamp_ms: Date.now() - startTimeRef.current, event: 'complete', detail: `${e.metrics.steps_completed}/${e.metrics.steps_total} steps`, status: 'success' });
        
        if (timerRef.current) clearInterval(timerRef.current);
        
        // Show banner, dim content, then navigate
        contentDim.value = withTiming(0.4, { duration: 500 });
        bannerY.value = withSpring(0, { damping: 20, stiffness: 180 });
        setTimeout(() => {
          router.replace('/comparison');
        }, 2200);
      },
    });

    cleanupRef.current = cleanup;
    return () => {
      cleanup();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [scenarioId]);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerY.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentDim.value,
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const sourcesSectionStyle = useAnimatedStyle(() => ({
    opacity: sourcesSectionOpacity.value,
    transform: [{ translateY: sourcesSectionTranslateY.value }],
  }));

  const actionChainSectionStyle = useAnimatedStyle(() => ({
    opacity: actionChainSectionOpacity.value,
    transform: [{ translateY: actionChainSectionTranslateY.value }],
  }));

  const llmSectionStyle = useAnimatedStyle(() => ({
    opacity: llmSectionOpacity.value,
    transform: [{ translateY: llmSectionTranslateY.value }],
  }));

  const handleBack = useCallback(() => {
    cleanupRef.current?.();
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  }, [router]);

  const statusColor = status === 'running' ? colors.accent.cyan : status === 'complete' ? colors.accent.emerald : colors.accent.crimson;
  const sourceSlots = ['pdf', 'csv', 'web', 'table', 'realtime'];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScanLine color={colors.accent.cyan} duration={6000} />

      {/* Completion banner */}
      <Animated.View style={[styles.banner, bannerStyle]}>
        <Text style={styles.bannerText}>✓ OPERATION CHAIN COMPLETE</Text>
      </Animated.View>

      {/* Header */}
      <Animated.View style={headerStyle}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backText}>← BACK</Text>
          </Pressable>
          <Text style={styles.headerTitle}>AGENT {status === 'running' ? 'RUNNING' : status === 'complete' ? 'COMPLETE' : 'IDLE'}</Text>
          <PulsingDot color={statusColor} size={8} speed={status === 'running' ? 'fast' : 'normal'} />
        </View>
      </Animated.View>

      {/* Node Badge */}
      {currentNode && <NodeBadge node={currentNode} elapsedMs={elapsedMs} />}

      <Animated.View style={[{ flex: 1 }, contentStyle]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* Source Ingestion Section */}
          <Animated.View style={sourcesSectionStyle}>
            <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionLabel}>SOURCE INGESTION</Text>
              <Badge label={`${sources.length}/5`} variant="info" style={{ marginLeft: spacing.sm }} />
            </View>
            {sourceSlots.map((type, i) => {
              const source = sources.find((s) => s.source_type === type);
              return source ? (
                <View key={type} style={{ marginBottom: spacing.sm }}>
                  <SourceCard source={source} animationDelay={0} />
                </View>
              ) : (
                <View key={type} style={{ marginBottom: spacing.sm }}>
                  <SourceCard
                    source={{ source_id: `placeholder_${type}`, source_type: type as any, credibility_score: 0, freshness: 'fresh', domain_hints: [], ingested_at: '' }}
                    isLoading
                    animationDelay={i * 80}
                  />
                </View>
              );
            })}
            </View>
          </Animated.View>

          {/* Contradictions */}
          {contradictions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionAccent, { backgroundColor: colors.accent.crimson }]} />
                <Text style={styles.sectionLabel}>CONTRADICTIONS</Text>
                <Badge label={String(contradictions.length)} variant="danger" style={{ marginLeft: spacing.sm }} />
              </View>
              {contradictions.map((c) => (
                <View key={c.id} style={{ marginBottom: spacing.sm }}>
                  <ContradictionCard contradiction={c} />
                </View>
              ))}
            </View>
          )}

          {/* Action Chain */}
          {actionChain.length > 0 && (
            <Animated.View style={actionChainSectionStyle}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionLabel}>ACTION CHAIN PLAN</Text>
                  <Badge label={`${actionChain.filter((a) => a.status === 'complete').length}/${actionChain.length}`} variant="info" style={{ marginLeft: spacing.sm }} />
                </View>
                <ActionStepper steps={actionChain} />
              </View>
            </Animated.View>
          )}

          {/* LLM Log Stream */}
          <Animated.View style={llmSectionStyle}>
            <View style={styles.section}>
              <LLMLogStream tokens={llmTokens} />
            </View>
          </Animated.View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </Animated.View>

      {/* Self-Heal Panel */}
      {healEvent && healEvent.status !== 'success' && <SelfHealPanel event={healEvent} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg.root },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.bg.surface
  },
  backBtn: { paddingVertical: spacing.xs, paddingRight: spacing.md },
  backText: { fontFamily: typography.mono.fontFamily, fontSize: 13, color: colors.accent.cyan, fontWeight: '700' },
  headerTitle: { fontFamily: typography.label.fontFamily, fontSize: typography.label.fontSize, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.text.secondary, flex: 1, textAlign: 'center' },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionAccent: { width: 3, height: 16, backgroundColor: colors.accent.cyan, borderRadius: 2, marginRight: spacing.sm },
  sectionLabel: { fontFamily: typography.label.fontFamily, fontSize: typography.label.fontSize, letterSpacing: typography.label.letterSpacing, textTransform: 'uppercase', color: colors.text.secondary },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: colors.accent.emerald,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.accent.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  bannerText: { fontFamily: typography.monoBold.fontFamily, fontSize: 13, color: colors.text.inverse, letterSpacing: 1, fontWeight: '700' },
});
