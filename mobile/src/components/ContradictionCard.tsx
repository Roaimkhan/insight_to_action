// src/components/ContradictionCard.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, radius } from '../constants/spacing';
import type { Contradiction } from '../types/agent';

interface ContradictionCardProps { contradiction: Contradiction; }

const BoltIcon: React.FC<{ color: string }> = React.memo(({ color }) => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path d="M8.5 1L3 9h4.5l-1 6L13 7H8.5l1-6z" fill={color} />
  </Svg>
));

const CheckIcon: React.FC<{ color: string }> = React.memo(({ color }) => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path d="M3 8l3.5 3.5L13 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
));

const ContradictionCard: React.FC<ContradictionCardProps> = ({ contradiction }) => {
  const isActive = contradiction.status === 'active';
  const borderOpacity = useSharedValue(isActive ? 1 : 0);
  const translateX = useSharedValue(60);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 300 });
    translateX.value = withSpring(0, { damping: 20, stiffness: 180 });
    if (isActive) {
      borderOpacity.value = withRepeat(
        withSequence(withTiming(0.3, { duration: 750 }), withTiming(1, { duration: 750 })),
        -1, false
      );
    }
  }, [isActive]);

  const containerAnim = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const borderAnim = useAnimatedStyle(() => ({
    borderColor: isActive ? `rgba(255,61,90,${borderOpacity.value * 0.7})` : colors.border.success,
  }));

  const accent = isActive ? colors.accent.red : colors.accent.green;
  const bgTint = isActive ? 'rgba(255,61,90,0.06)' : 'rgba(0,255,135,0.04)';

  return (
    <Animated.View style={containerAnim}>
      <Animated.View style={[styles.card, { backgroundColor: bgTint }, borderAnim]}>
        <View style={styles.header}>
          {isActive ? <BoltIcon color={accent} /> : <CheckIcon color={accent} />}
          <Text style={[styles.headerText, { color: accent }]}>
            {isActive ? 'CONTRADICTION DETECTED' : 'RESOLVED'}
          </Text>
        </View>

        <View style={styles.sourcesRow}>
          <View style={styles.sourceBox}>
            <Text style={styles.sourceType}>{contradiction.source_a.type.toUpperCase()}</Text>
            <Text style={[styles.sourceScore, { color: contradiction.source_a.credibility < 0.5 ? colors.accent.red : colors.text.primary }]}>
              {contradiction.source_a.credibility.toFixed(2)}
            </Text>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={styles.sourceBox}>
            <Text style={styles.sourceType}>{contradiction.source_b.type.toUpperCase()}</Text>
            <Text style={[styles.sourceScore, { color: contradiction.source_b.credibility < 0.5 ? colors.accent.red : colors.text.primary }]}>
              {contradiction.source_b.credibility.toFixed(2)}
            </Text>
          </View>
        </View>

        <Text style={styles.resolution}>{contradiction.resolution}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1.5, padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  headerText: { fontFamily: typography.label.fontFamily, fontSize: typography.label.fontSize, letterSpacing: 1.2, textTransform: 'uppercase' },
  sourcesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.sm },
  sourceBox: { alignItems: 'center', backgroundColor: colors.bg.elevated, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, minWidth: 80 },
  sourceType: { fontFamily: typography.monoSm.fontFamily, fontSize: typography.monoSm.fontSize, color: colors.text.secondary, marginBottom: 2 },
  sourceScore: { fontFamily: typography.monoBold.fontFamily, fontSize: typography.monoBold.fontSize },
  vsText: { fontFamily: typography.monoBold.fontFamily, fontSize: 12, color: colors.text.muted, letterSpacing: 2 },
  resolution: { fontFamily: typography.small.fontFamily, fontSize: typography.small.fontSize, lineHeight: typography.small.lineHeight, color: colors.text.secondary },
});

export default React.memo(ContradictionCard);
