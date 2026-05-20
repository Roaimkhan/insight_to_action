// src/components/SelfHealPanel.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, radius } from '../constants/spacing';
import type { HealEvent } from '../types/agent';

interface SelfHealPanelProps { event: HealEvent; }

const tierColors: Record<1 | 2 | 3, string> = {
  1: colors.accent.amber,
  2: colors.accent.tangerine,
  3: colors.accent.crimson,
};

const statusLabels: Record<HealEvent['status'], string> = {
  retrying: 'RETRYING',
  fallback: 'EXECUTING FALLBACK',
  rollback: 'ROLLING BACK',
  success: 'RECOVERED',
  failed: 'HEAL FAILED',
};

const SelfHealPanel: React.FC<SelfHealPanelProps> = ({ event }) => {
  const translateY = useSharedValue(200);
  const borderPulse = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const tierColor = tierColors[event.tier];

  useEffect(() => {
    if (event.status === 'success') {
      translateY.value = withSpring(200, { damping: 18, stiffness: 200 });
      cardScale.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      borderPulse.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1, false
      );
      cardScale.value = withRepeat(
        withSequence(withTiming(1.02, { duration: 800 }), withTiming(1.00, { duration: 800 })),
        -1, false
      );
    }
    if (event.status === 'retrying') {
      progressWidth.value = 0;
      progressWidth.value = withTiming(100, { duration: 1500 });
    }
  }, [event.status, event.tier]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: cardScale.value }],
    shadowColor: tierColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12 + borderPulse.value * 0.12,
    shadowRadius: 16,
    elevation: 8,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: tierColor,
    borderWidth: 1.5,
    opacity: 0.5 + borderPulse.value * 0.5,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <Animated.View style={[styles.container, panelStyle]}>
      <Animated.View style={[styles.panel, borderStyle]}>
        <View style={styles.header}>
          <View style={[styles.tierBadge, { backgroundColor: tierColor + '22', borderColor: tierColor }]}>
            <Text style={[styles.tierText, { color: tierColor }]}>TIER {event.tier}</Text>
          </View>
          <Text style={styles.title}>SELF-HEAL</Text>
          <Text style={[styles.statusText, { color: tierColor }]}>{statusLabels[event.status]}</Text>
        </View>
        <Text style={styles.detail}>{event.detail}</Text>
        {event.status === 'retrying' && event.attempt && event.maxAttempts && (
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { backgroundColor: tierColor }, progressStyle]} />
            </View>
            <Text style={styles.attemptText}>Attempt {event.attempt}/{event.maxAttempts}</Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  panel: { backgroundColor: colors.bg.elevated, borderRadius: radius.lg, padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  tierBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm, borderWidth: 1 },
  tierText: { fontFamily: typography.monoBold.fontFamily, fontSize: 11 },
  title: { fontFamily: typography.monoBold.fontFamily, fontSize: typography.monoBold.fontSize, color: colors.text.primary, flex: 1 },
  statusText: { fontFamily: typography.monoSm.fontFamily, fontSize: typography.monoSm.fontSize },
  detail: { fontFamily: typography.mono.fontFamily, fontSize: typography.mono.fontSize, color: colors.text.secondary, marginBottom: spacing.sm },
  progressSection: { gap: spacing.xs },
  progressTrack: { height: 3, backgroundColor: colors.bg.sunken, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.full },
  attemptText: { fontFamily: typography.monoSm.fontFamily, fontSize: typography.monoSm.fontSize, color: colors.text.muted },
});

export default React.memo(SelfHealPanel);
