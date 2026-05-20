// src/components/BeforeAfterPanel.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, SharedValue,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, radius, anim } from '../constants/spacing';
import type { MetricRow } from '../types/agent';

interface BeforeAfterPanelProps { rows: MetricRow[]; }

const getDeltaPillLabel = (label: string, before: string, after: string): string => {
  if (label.toLowerCase().includes('risk')) return '-76% RISK';
  if (label.toLowerCase().includes('status')) return 'VERIFIED';
  if (label.toLowerCase().includes('ticket')) return 'ESCALATED';
  if (label.toLowerCase().includes('monitoring')) return '+ ACTIVE';
  if (label.toLowerCase().includes('load')) return 'BALANCED';
  return 'HEALED';
};

const MetricRowItem: React.FC<{ row: MetricRow; index: number; slideVal: SharedValue<number> }> = React.memo(
  ({ row, index, slideVal }) => {
    const rowOpacity = useSharedValue(0);
    const rowTranslateY = useSharedValue(15);

    useEffect(() => {
      const delay = 300 + index * 60;
      rowOpacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
      rowTranslateY.value = withDelay(delay, withSpring(0, anim.spring));
    }, [index]);

    const rowStyle = useAnimatedStyle(() => ({
      opacity: rowOpacity.value,
      transform: [{ translateY: rowTranslateY.value }],
    }));

    const beforeStyle = useAnimatedStyle(() => ({
      opacity: 1 - slideVal.value,
      transform: [{ translateX: -10 * slideVal.value }],
    }));

    const afterStyle = useAnimatedStyle(() => ({
      opacity: slideVal.value,
      transform: [{ translateX: 10 * (1 - slideVal.value) }],
    }));

    const separatorStyle = useAnimatedStyle(() => ({
      opacity: 0.15 + slideVal.value * 0.2,
      transform: [{ scale: 0.9 + slideVal.value * 0.1 }],
    }));

    return (
      <Animated.View style={[styles.metricRow, rowStyle]}>
        <View style={styles.rowLabelContainer}>
          <Text style={styles.metricLabel}>{row.label}</Text>
          {row.improved && (
            <View style={[styles.deltaPill, { backgroundColor: colors.accent.emerald + '15', borderColor: colors.border.emerald }]}>
              <Text style={styles.deltaText}>
                {getDeltaPillLabel(row.label, String(row.before), String(row.after))}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.metricValuesContainer}>
          {/* Before Value Side */}
          <Animated.View style={[styles.valueWrapper, beforeStyle]}>
            <Text style={[styles.beforeValue, { color: colors.accent.crimson }]}>
              {String(row.before)}
            </Text>
          </Animated.View>

          {/* Interactive sliding connector */}
          <Animated.View style={[styles.slideArrow, separatorStyle]}>
            <Text style={styles.slideArrowText}>→</Text>
          </Animated.View>

          {/* After Value Side */}
          <Animated.View style={[styles.valueWrapper, afterStyle]}>
            <Text style={[styles.afterValue, { color: colors.accent.emerald }]}>
              {String(row.after)}
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
    );
  }
);

const BeforeAfterPanel: React.FC<BeforeAfterPanelProps> = ({ rows }) => {
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width - 32);
  const slideVal = useSharedValue(1); // Defaults to fully Healed state (1.0)

  const handleTouch = useCallback((e: any) => {
    const x = e.nativeEvent.locationX;
    const pct = Math.max(0, Math.min(1, x / containerWidth));
    slideVal.value = withSpring(pct, { damping: 20, stiffness: 180 });
  }, [containerWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    left: slideVal.value * (containerWidth - 28),
  }));

  const labelLeftStyle = useAnimatedStyle(() => ({
    opacity: 1 - slideVal.value * 0.6,
  }));

  const labelRightStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + slideVal.value * 0.6,
  }));

  return (
    <View style={styles.container}>
      {/* Wipe Interactive Console */}
      <View
        style={styles.sliderTrack}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        <Animated.Text style={[styles.sliderLabel, styles.labelLeft, labelLeftStyle]}>
          STALE BASELINE
        </Animated.Text>
        <Animated.Text style={[styles.sliderLabel, styles.labelRight, labelRightStyle]}>
          HEALED METRICS
        </Animated.Text>

        <Animated.View style={[styles.sliderPill, pillStyle]}>
          <View style={styles.sliderPillInner} />
        </Animated.View>
      </View>

      {/* Rows */}
      <View style={styles.rowsList}>
        {rows.map((row, i) => (
          <MetricRowItem key={row.label} row={row} index={i} slideVal={slideVal} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  sliderTrack: {
    height: 38,
    backgroundColor: colors.bg.sunken,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    position: 'relative',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  sliderLabel: {
    fontFamily: typography.monoBold.fontFamily,
    fontSize: 9,
    letterSpacing: 1,
    zIndex: 2,
  },
  labelLeft: {
    color: colors.accent.crimson,
  },
  labelRight: {
    color: colors.accent.cyan,
  },
  sliderPill: {
    position: 'absolute',
    top: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  sliderPillInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.inverse,
  },
  rowsList: {
    gap: spacing.xs,
  },
  metricRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.text.secondary,
  },
  deltaPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  deltaText: {
    fontFamily: typography.monoBold.fontFamily,
    fontSize: 8,
    color: colors.accent.emerald,
    letterSpacing: 0.5,
  },
  metricValuesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 28,
  },
  valueWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beforeValue: {
    fontFamily: typography.monoBold.fontFamily,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  slideArrow: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideArrowText: {
    fontFamily: typography.mono.fontFamily,
    fontSize: 12,
    color: colors.text.muted,
  },
  afterValue: {
    fontFamily: typography.monoBold.fontFamily,
    fontSize: 14,
    letterSpacing: -0.2,
  },
});

export default React.memo(BeforeAfterPanel);
