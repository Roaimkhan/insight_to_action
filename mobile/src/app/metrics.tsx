// src/app/metrics.tsx — Screen 4: Impact Metrics + Audit Trail
import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring,
  withRepeat, withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { FlashList } from '@shopify/flash-list';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, radius, anim } from '../constants/spacing';
import { useAgentStore } from '../store/agentStore';
import MetricGauge from '../components/MetricGauge';
import Badge from '../components/ui/Badge';
import type { AuditEntry } from '../types/agent';

// ── Audit Row ──────────────────────────────────────────────────
const statusBorderColors: Record<AuditEntry['status'], string> = {
  info: colors.accent.cyan,
  success: colors.accent.green,
  warning: colors.accent.amber,
  error: colors.accent.red,
};

const AuditRow: React.FC<{ entry: AuditEntry; index: number }> = React.memo(({ entry, index }) => {
  const formatTimestamp = (ms: number): string => {
    const totalSec = ms / 1000;
    const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const sec = Math.floor(totalSec % 60).toString().padStart(2, '0');
    const millis = Math.floor(ms % 1000).toString().padStart(3, '0');
    return `${min}:${sec}.${millis}`;
  };

  const borderColor = statusBorderColors[entry.status];

  return (
    <View style={[styles.auditRow, { borderLeftColor: borderColor }]}>
      <Text style={styles.auditTime}>{formatTimestamp(entry.timestamp_ms)}</Text>
      <View style={styles.auditContent}>
        <Text style={styles.auditEvent}>{entry.event}</Text>
        <Text style={styles.auditDetail}>{entry.detail}</Text>
      </View>
    </View>
  );
});

export default function MetricsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [exporting, setExporting] = useState(false);

  const metrics = useAgentStore((s) => s.metrics);
  const auditTrail = useAgentStore((s) => s.auditTrail);
  const actionChain = useAgentStore((s) => s.actionChain);
  const reset = useAgentStore((s) => s.reset);

  // Entrance
  const headerOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);

  // Export button pulse
  const exportPulse = useSharedValue(1);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: anim.normal });
    titleOpacity.value = withDelay(150, withTiming(1, { duration: anim.normal }));
    titleY.value = withDelay(150, withSpring(0, anim.spring));
    exportPulse.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1, false
    );
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value, transform: [{ translateY: titleY.value }],
  }));
  const exportPulseStyle = useAnimatedStyle(() => ({
    opacity: exportPulse.value,
  }));

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleNewScenario = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    reset();
    router.replace('/');
  }, [reset, router]);

  const handleExport = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);
    try {
      const data = JSON.stringify({ metrics, auditTrail, actionChain }, null, 2);
      const fileUri = FileSystem.documentDirectory + 'audit_log.json';
      await FileSystem.writeAsStringAsync(fileUri, data);
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Audit Log',
      });
    } catch (e) {
      Alert.alert('Export failed', 'Could not export audit log.');
    } finally {
      setExporting(false);
    }
  }, [metrics, auditTrail, actionChain]);

  const riskDelta = metrics?.risk_delta ?? 34;
  const latencySec = metrics ? metrics.latency_ms / 1000 : 0;
  const stepsCompleted = metrics?.steps_completed ?? 0;
  const stepsTotal = metrics?.steps_total ?? 5;

  // Execution timeline bar data
  const stepBars = actionChain.map((a) => ({
    name: a.name,
    latency: a.latency_ms ?? 0,
    status: a.status,
  }));
  const maxLatency = Math.max(...stepBars.map((s) => s.latency), 1);

  const renderAuditItem = useCallback(({ item, index }: { item: AuditEntry; index: number }) => (
    <AuditRow entry={item} index={index} />
  ), []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Pressable onPress={handleBack}>
            <Text style={styles.backText}>{'<'} IMPACT METRICS</Text>
          </Pressable>
        </Animated.View>

        {/* Title */}
        <Animated.View style={[styles.titleSection, titleStyle]}>
          <Text style={styles.title}>IMPACT SUMMARY</Text>
        </Animated.View>

        {/* Metric Gauges — 2x2 grid */}
        <View style={styles.gaugeGrid}>
          <MetricGauge label="RISK REDUCED" value={riskDelta} maxValue={100} unit="%" direction="down-good" animationDelay={0} />
          <MetricGauge label="RESOLUTION TIME" value={Math.round(latencySec)} maxValue={30} unit="s" direction="down-good" animationDelay={200} />
          <MetricGauge label="STEPS COMPLETE" value={stepsCompleted} maxValue={stepsTotal} unit="" direction="up-good" animationDelay={400} />
          <MetricGauge label="DIRECT COST" value={0} maxValue={100} unit="PKR" direction="down-good" animationDelay={600} />
        </View>

        {/* Execution Timeline */}
        {stepBars.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionLabel}>EXECUTION TIMELINE</Text>
            </View>
            {stepBars.map((bar, i) => {
              const barColor = bar.status === 'complete' ? colors.accent.green
                : bar.status === 'failed' ? colors.accent.red
                : bar.status === 'rolled_back' ? colors.accent.amber
                : colors.text.muted;
              const widthPct = Math.max((bar.latency / maxLatency) * 100, 8);
              return (
                <View key={i} style={styles.barRow}>
                  <Text style={styles.barLabel} numberOfLines={1}>{bar.name}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${widthPct}%`, backgroundColor: barColor }]} />
                  </View>
                  <Text style={styles.barTime}>{bar.latency}ms</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Audit Trail */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionLabel}>AUDIT TRAIL</Text>
            <Badge label={String(auditTrail.length)} variant="info" style={{ marginLeft: spacing.sm }} />
          </View>
          <View style={styles.auditList}>
            <FlashList
              data={auditTrail}
              renderItem={renderAuditItem}
              estimatedItemSize={52}
              scrollEnabled={false}
            />
          </View>
        </View>

        {/* Export Button */}
        <Animated.View style={exportPulseStyle}>
          <Pressable style={styles.exportButton} onPress={handleExport} disabled={exporting}>
            <Text style={styles.exportButtonText}>
              {exporting ? 'EXPORTING...' : 'EXPORT AUDIT JSON'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* New Scenario Button */}
        <Pressable style={styles.newButton} onPress={handleNewScenario}>
          <Text style={styles.newButtonText}>{'<'} NEW SCENARIO</Text>
        </Pressable>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg.primary },
  scrollContent: { paddingHorizontal: spacing.md },
  header: { paddingVertical: spacing.md },
  backText: { fontFamily: typography.mono.fontFamily, fontSize: typography.mono.fontSize, color: colors.accent.cyan },
  titleSection: { marginBottom: spacing.lg },
  title: { fontFamily: typography.h1.fontFamily, fontSize: typography.h1.fontSize, letterSpacing: typography.h1.letterSpacing, color: colors.text.primary },
  gaugeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: spacing.lg, marginBottom: spacing.xl },
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionAccent: { width: 3, height: 16, backgroundColor: colors.accent.cyan, borderRadius: 2, marginRight: spacing.sm },
  sectionLabel: { fontFamily: typography.label.fontFamily, fontSize: typography.label.fontSize, letterSpacing: typography.label.letterSpacing, textTransform: 'uppercase', color: colors.text.secondary },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  barLabel: { fontFamily: typography.monoSm.fontFamily, fontSize: typography.monoSm.fontSize, color: colors.text.secondary, width: 90 },
  barTrack: { flex: 1, height: 8, backgroundColor: colors.bg.elevated, borderRadius: radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.full },
  barTime: { fontFamily: typography.monoSm.fontFamily, fontSize: typography.monoSm.fontSize, color: colors.text.muted, width: 48, textAlign: 'right' },
  auditList: { minHeight: 200, backgroundColor: colors.bg.secondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.subtle, overflow: 'hidden' },
  auditRow: { flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderLeftWidth: 3, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  auditTime: { fontFamily: typography.monoSm.fontFamily, fontSize: typography.monoSm.fontSize, color: colors.text.muted, width: 72, marginRight: spacing.sm },
  auditContent: { flex: 1 },
  auditEvent: { fontFamily: typography.mono.fontFamily, fontSize: typography.mono.fontSize, color: colors.text.primary },
  auditDetail: { fontFamily: typography.small.fontFamily, fontSize: typography.small.fontSize, color: colors.text.secondary, marginTop: 2 },
  exportButton: { backgroundColor: colors.accent.cyan + '18', borderWidth: 1, borderColor: colors.accent.cyan + '60', borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  exportButtonText: { fontFamily: typography.monoBold.fontFamily, fontSize: 13, color: colors.accent.cyan, letterSpacing: 1.5 },
  newButton: { backgroundColor: colors.bg.secondary, borderWidth: 1, borderColor: colors.border.subtle, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  newButtonText: { fontFamily: typography.mono.fontFamily, fontSize: 13, color: colors.text.secondary, letterSpacing: 1 },
});
