// src/app/comparison.tsx — Screen 3: Before vs After
import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, radius, anim } from '../constants/spacing';
import { useAgentStore } from '../store/agentStore';
import BeforeAfterPanel from '../components/BeforeAfterPanel';
import ContradictionCard from '../components/ContradictionCard';
import Badge from '../components/ui/Badge';
import type { MetricRow } from '../types/agent';

export default function ComparisonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const scenarioId = useAgentStore((s) => s.scenarioId);
  const metrics = useAgentStore((s) => s.metrics);
  const beforeState = useAgentStore((s) => s.beforeState);
  const afterState = useAgentStore((s) => s.afterState);
  const contradictions = useAgentStore((s) => s.contradictions);
  const actionChain = useAgentStore((s) => s.actionChain);
  const reset = useAgentStore((s) => s.reset);

  // Build metric rows from before/after state
  const metricRows: MetricRow[] = React.useMemo(() => {
    if (!beforeState || !afterState) return [];
    return Object.keys(beforeState).map((key) => ({
      label: key,
      before: beforeState[key],
      after: afterState[key] ?? '-',
      improved: afterState[key] !== beforeState[key],
    }));
  }, [beforeState, afterState]);

  // Entrance animations
  const headerOpacity = useSharedValue(0);
  const summaryOpacity = useSharedValue(0);
  const summaryY = useSharedValue(20);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: anim.normal });
    summaryOpacity.value = withDelay(200, withTiming(1, { duration: anim.normal }));
    summaryY.value = withDelay(200, withSpring(0, anim.spring));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const summaryStyle = useAnimatedStyle(() => ({
    opacity: summaryOpacity.value,
    transform: [{ translateY: summaryY.value }],
  }));

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reset();
    router.replace('/');
  }, [reset, router]);

  const handleMetrics = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/metrics');
  }, [router]);

  const duration = metrics ? (metrics.latency_ms / 1000).toFixed(1) : '0';

  // Timeline step data
  const stepNodes = actionChain.map((a) => ({
    step: a.step,
    status: a.status,
    latency: a.latency_ms ?? 0,
    name: a.name,
  }));

  const statusColors: Record<string, string> = {
    complete: colors.accent.green,
    failed: colors.accent.red,
    rolled_back: colors.accent.amber,
    pending: colors.text.muted,
    active: colors.accent.cyan,
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Pressable onPress={handleBack}>
            <Text style={styles.backText}>{'<'} RESULTS</Text>
          </Pressable>
          <Badge label="COMPLETE" variant="success" />
        </Animated.View>

        {/* Summary */}
        <Animated.View style={[styles.summary, summaryStyle]}>
          <Text style={styles.summaryTitle}>OUTCOME SUMMARY</Text>
          <Text style={styles.summaryMeta}>
            {metrics?.scenario_name ?? 'Scenario'} · {duration}s
          </Text>
        </Animated.View>

        {/* Before / After Panel */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionLabel}>BEFORE VS AFTER</Text>
          </View>
          <BeforeAfterPanel rows={metricRows} />
        </View>

        {/* Contradictions resolved */}
        {contradictions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionAccent, { backgroundColor: colors.accent.green }]} />
              <Text style={styles.sectionLabel}>CONTRADICTIONS</Text>
            </View>
            {contradictions.map((c) => (
              <View key={c.id} style={{ marginBottom: spacing.sm }}>
                <ContradictionCard
                  contradiction={{ ...c, status: 'resolved' }}
                />
              </View>
            ))}
          </View>
        )}

        {/* Action Chain Timeline */}
        {stepNodes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionLabel}>ACTION CHAIN TIMELINE</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.timeline}>
                {stepNodes.map((node, i) => {
                  const nodeColor = statusColors[node.status] ?? colors.text.muted;
                  return (
                    <View key={node.step} style={styles.timelineNode}>
                      {i > 0 && (
                        <View style={[styles.timelineLine, { backgroundColor: statusColors[stepNodes[i - 1].status] ?? colors.text.muted }]} />
                      )}
                      <View style={[styles.timelineCircle, { borderColor: nodeColor, backgroundColor: node.status === 'complete' ? nodeColor : 'transparent' }]}>
                        <Text style={[styles.timelineStep, { color: node.status === 'complete' ? colors.text.inverse : nodeColor }]}>
                          {node.step}
                        </Text>
                      </View>
                      <Text style={[styles.timelineLabel, { color: nodeColor }]}>
                        {node.status === 'rolled_back' ? 'rollback' : node.name}
                      </Text>
                      <Text style={styles.timelineLatency}>
                        {node.latency > 0 ? `${node.latency}ms` : '-'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* View Metrics Button */}
        <Pressable
          style={styles.metricsButton}
          onPress={handleMetrics}
        >
          <Text style={styles.metricsButtonText}>VIEW METRICS {'>'}</Text>
        </Pressable>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg.primary },
  scrollContent: { paddingHorizontal: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  backText: { fontFamily: typography.mono.fontFamily, fontSize: typography.mono.fontSize, color: colors.accent.cyan },
  summary: { marginBottom: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  summaryTitle: { fontFamily: typography.h1.fontFamily, fontSize: typography.h1.fontSize, letterSpacing: typography.h1.letterSpacing, color: colors.text.primary },
  summaryMeta: { fontFamily: typography.monoSm.fontFamily, fontSize: typography.monoSm.fontSize, color: colors.text.muted, marginTop: spacing.xs },
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionAccent: { width: 3, height: 16, backgroundColor: colors.accent.cyan, borderRadius: 2, marginRight: spacing.sm },
  sectionLabel: { fontFamily: typography.label.fontFamily, fontSize: typography.label.fontSize, letterSpacing: typography.label.letterSpacing, textTransform: 'uppercase', color: colors.text.secondary },
  timeline: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.md, gap: spacing.xs },
  timelineNode: { alignItems: 'center', width: 72, position: 'relative' },
  timelineLine: { position: 'absolute', left: -36, top: 14, width: 36, height: 2 },
  timelineCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  timelineStep: { fontFamily: typography.monoBold.fontFamily, fontSize: 11 },
  timelineLabel: { fontFamily: typography.monoSm.fontFamily, fontSize: 9, textAlign: 'center', textTransform: 'uppercase' },
  timelineLatency: { fontFamily: typography.monoSm.fontFamily, fontSize: typography.monoSm.fontSize, color: colors.text.muted, marginTop: 2 },
  metricsButton: { backgroundColor: colors.accent.cyan + '18', borderWidth: 1, borderColor: colors.accent.cyan + '60', borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  metricsButtonText: { fontFamily: typography.monoBold.fontFamily, fontSize: 14, color: colors.accent.cyan, letterSpacing: 1.5 },
});
