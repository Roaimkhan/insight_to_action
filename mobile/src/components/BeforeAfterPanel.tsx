// src/components/BeforeAfterPanel.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, radius, anim } from '../constants/spacing';
import type { MetricRow } from '../types/agent';

interface BeforeAfterPanelProps { rows: MetricRow[]; }

const MetricRowItem: React.FC<{ row: MetricRow; index: number }> = React.memo(({ row, index }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(15);

  useEffect(() => {
    const delay = 400 + index * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(delay, withSpring(0, anim.spring));
  }, [index]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value, transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.metricRow, style]}>
      <Text style={styles.metricLabel}>{row.label}</Text>
      <View style={styles.metricValues}>
        <Text style={styles.beforeValue}>{String(row.before)}</Text>
        <View style={styles.arrow}>
          <Text style={styles.arrowText}>{'>'}</Text>
        </View>
        <Text style={[styles.afterValue, { color: row.improved ? colors.accent.green : colors.accent.amber }]}>
          {String(row.after)}
        </Text>
      </View>
    </Animated.View>
  );
});

const BeforeAfterPanel: React.FC<BeforeAfterPanelProps> = ({ rows }) => {
  const beforeX = useSharedValue(-100);
  const afterX = useSharedValue(100);
  const panelOpacity = useSharedValue(0);

  useEffect(() => {
    panelOpacity.value = withTiming(1, { duration: 400 });
    beforeX.value = withSpring(0, { damping: 22, stiffness: 160 });
    afterX.value = withSpring(0, { damping: 22, stiffness: 160 });
  }, []);

  const beforeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: beforeX.value }], opacity: panelOpacity.value,
  }));
  const afterStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: afterX.value }], opacity: panelOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Animated.View style={[styles.columnHeader, beforeStyle]}>
          <Text style={styles.columnLabel}>BEFORE</Text>
        </Animated.View>
        <View style={styles.divider} />
        <Animated.View style={[styles.columnHeader, afterStyle]}>
          <Text style={[styles.columnLabel, { color: colors.accent.cyan }]}>AFTER</Text>
        </Animated.View>
      </View>
      {rows.map((row, i) => (
        <MetricRowItem key={row.label} row={row} index={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.bg.secondary, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.subtle, padding: spacing.md, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  columnHeader: { flex: 1, alignItems: 'center' },
  columnLabel: { fontFamily: typography.label.fontFamily, fontSize: typography.label.fontSize, letterSpacing: typography.label.letterSpacing, textTransform: 'uppercase', color: colors.text.muted },
  divider: { width: 1, height: 20, backgroundColor: colors.border.subtle },
  metricRow: { flexDirection: 'column', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  metricLabel: { fontFamily: typography.label.fontFamily, fontSize: typography.label.fontSize, letterSpacing: typography.label.letterSpacing, textTransform: 'uppercase', color: colors.text.muted, marginBottom: spacing.xs },
  metricValues: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  beforeValue: { fontFamily: typography.mono.fontFamily, fontSize: typography.mono.fontSize, color: colors.text.secondary, flex: 1, textAlign: 'center' },
  arrow: { width: 24, alignItems: 'center' },
  arrowText: { fontFamily: typography.mono.fontFamily, fontSize: 12, color: colors.text.muted },
  afterValue: { fontFamily: typography.monoBold.fontFamily, fontSize: typography.monoBold.fontSize, flex: 1, textAlign: 'center' },
});

export default React.memo(BeforeAfterPanel);
