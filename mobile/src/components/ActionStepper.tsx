// src/components/ActionStepper.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, radius, anim } from '../constants/spacing';
import type { Action, StepStatus } from '../types/agent';

interface ActionStepperProps {
  steps: Action[];
}

// ── Status Colors ────────────────────────────────────────────────────
const borderColors: Record<StepStatus, string> = {
  pending:     colors.text.muted,
  active:      colors.accent.cyan,
  complete:    colors.accent.green,
  failed:      colors.accent.red,
  rolled_back: colors.accent.amber,
};

// ── Status Icons (SVG) ───────────────────────────────────────────────
const StatusIcon: React.FC<{ status: StepStatus }> = React.memo(({ status }) => {
  const size = 20;
  const color = borderColors[status];

  switch (status) {
    case 'pending':
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20">
          <Circle cx="10" cy="10" r="7" stroke={color} strokeWidth={1.5} fill="none" />
        </Svg>
      );
    case 'active':
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20">
          <Circle cx="10" cy="10" r="7" stroke={color} strokeWidth={1.5} fill="none" />
          <Circle cx="10" cy="10" r="3" fill={color} />
        </Svg>
      );
    case 'complete':
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20">
          <Circle cx="10" cy="10" r="7" stroke={color} strokeWidth={1.5} fill="none" />
          <Path d="M6 10l3 3 5-6" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'failed':
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20">
          <Circle cx="10" cy="10" r="7" stroke={color} strokeWidth={1.5} fill="none" />
          <Path d="M7 7l6 6M13 7l-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'rolled_back':
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20">
          <Circle cx="10" cy="10" r="7" stroke={color} strokeWidth={1.5} fill="none" />
          <Path d="M12 7l-4 3 4 3" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
  }
});

// ── Step Row ─────────────────────────────────────────────────────────
const StepRow: React.FC<{ action: Action; index: number; isLast: boolean }> = React.memo(
  ({ action, index, isLast }) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);
    const pulseOpacity = useSharedValue(1);

    useEffect(() => {
      const delay = index * anim.staggerItem;
      opacity.value = withDelay(delay, withTiming(1, { duration: anim.normal }));
      translateY.value = withDelay(delay, withSpring(0, anim.spring));
    }, [index]);

    useEffect(() => {
      if (action.status === 'active') {
        pulseOpacity.value = withRepeat(
          withSequence(
            withTiming(0.4, { duration: 800 }),
            withTiming(1, { duration: 800 })
          ),
          -1,
          false
        );
      } else {
        pulseOpacity.value = withTiming(1, { duration: 200 });
      }
    }, [action.status]);

    const containerStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
      opacity: action.status === 'active' ? pulseOpacity.value : 0,
    }));

    const borderColor = borderColors[action.status];

    return (
      <Animated.View style={containerStyle}>
        <View style={styles.stepRow}>
          {/* Connector line */}
          {!isLast && (
            <View
              style={[
                styles.connector,
                {
                  backgroundColor:
                    action.status === 'complete'
                      ? colors.accent.green
                      : action.status === 'failed'
                      ? colors.accent.red
                      : colors.text.muted,
                },
              ]}
            />
          )}

          {/* Icon */}
          <View style={styles.iconCol}>
            <StatusIcon status={action.status} />
          </View>

          {/* Content */}
          <View style={[styles.stepContent, { borderLeftColor: borderColor }]}>
            {/* Active glow background */}
            <Animated.View style={[styles.activeGlow, glowStyle]} />

            <View style={styles.stepHeader}>
              <Text style={[styles.stepNumber, { color: borderColor }]}>
                {String(action.step).padStart(2, '0')}
              </Text>
              <Text style={styles.stepName}>{action.name}</Text>
            </View>
            <Text style={styles.stepDesc}>{action.description}</Text>

            {action.status === 'complete' && action.latency_ms !== undefined && (
              <Text style={styles.latency}>{action.latency_ms}ms</Text>
            )}
            {action.status === 'failed' && (
              <Text style={styles.failedText}>FAILED</Text>
            )}
          </View>
        </View>
      </Animated.View>
    );
  }
);

const ActionStepper: React.FC<ActionStepperProps> = ({ steps }) => {
  return (
    <View style={styles.container}>
      {steps.map((action, i) => (
        <StepRow
          key={action.step}
          action={action}
          index={i}
          isLast={i === steps.length - 1}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    left: 9,
    top: 24,
    width: 2,
    bottom: -4,
    opacity: 0.3,
  },
  iconCol: {
    width: 24,
    alignItems: 'center',
    paddingTop: 2,
    marginRight: spacing.sm,
  },
  stepContent: {
    flex: 1,
    borderLeftWidth: 3,
    paddingLeft: spacing.md,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    borderRadius: radius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  activeGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,229,255,0.05)',
    borderRadius: radius.sm,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumber: {
    fontFamily: typography.monoBold.fontFamily,
    fontSize: typography.monoBold.fontSize,
  },
  stepName: {
    fontFamily: typography.h3.fontFamily,
    fontSize: typography.h3.fontSize,
    color: colors.text.primary,
  },
  stepDesc: {
    fontFamily: typography.small.fontFamily,
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  latency: {
    fontFamily: typography.monoSm.fontFamily,
    fontSize: typography.monoSm.fontSize,
    color: colors.accent.green,
    marginTop: spacing.xs,
  },
  failedText: {
    fontFamily: typography.monoSm.fontFamily,
    fontSize: typography.monoSm.fontSize,
    color: colors.accent.red,
    marginTop: spacing.xs,
    letterSpacing: 1,
  },
});

export default React.memo(ActionStepper);
