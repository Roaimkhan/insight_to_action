// src/components/SourceCard.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, radius, anim } from '../constants/spacing';
import GlassCard from './ui/GlassCard';
import CredibilityBar from './ui/CredibilityBar';
import Badge from './ui/Badge';
import type { DataSource } from '../types/agent';

interface SourceCardProps {
  source: DataSource;
  animationDelay?: number;
  isLoading?: boolean;
}

// ── SVG Source Icons ──────────────────────────────────────────────────
const SourceIcon: React.FC<{ type: DataSource['source_type']; color: string }> = React.memo(({ type, color }) => {
  const size = 20;
  switch (type) {
    case 'pdf':
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
          <Path d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={color} strokeWidth={1.5} />
          <Path d="M12 2v4h4" stroke={color} strokeWidth={1.5} />
          <Line x1="6" y1="10" x2="14" y2="10" stroke={color} strokeWidth={1} opacity={0.5} />
          <Line x1="6" y1="13" x2="14" y2="13" stroke={color} strokeWidth={1} opacity={0.5} />
        </Svg>
      );
    case 'csv':
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
          <Rect x="2" y="2" width="16" height="16" rx="2" stroke={color} strokeWidth={1.5} />
          <Line x1="2" y1="7" x2="18" y2="7" stroke={color} strokeWidth={1} />
          <Line x1="2" y1="12" x2="18" y2="12" stroke={color} strokeWidth={1} />
          <Line x1="7" y1="2" x2="7" y2="18" stroke={color} strokeWidth={1} />
          <Line x1="13" y1="2" x2="13" y2="18" stroke={color} strokeWidth={1} />
        </Svg>
      );
    case 'web':
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
          <Circle cx="10" cy="10" r="8" stroke={color} strokeWidth={1.5} />
          <Path d="M2 10h16M10 2c2.5 2.5 3.5 5 3.5 8s-1 5.5-3.5 8c-2.5-2.5-3.5-5-3.5-8s1-5.5 3.5-8z" stroke={color} strokeWidth={1} />
        </Svg>
      );
    case 'table':
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
          <Rect x="2" y="3" width="16" height="14" rx="2" stroke={color} strokeWidth={1.5} />
          <Line x1="2" y1="7" x2="18" y2="7" stroke={color} strokeWidth={1.5} />
          <Line x1="6" y1="7" x2="6" y2="17" stroke={color} strokeWidth={1} />
          <Line x1="10" y1="3" x2="10" y2="7" stroke={color} strokeWidth={1} />
        </Svg>
      );
    case 'realtime':
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
          <Path d="M10 14a4 4 0 100-8" stroke={color} strokeWidth={1.5} />
          <Path d="M10 17a7 7 0 100-14" stroke={color} strokeWidth={1.2} opacity={0.6} />
          <Path d="M10 20a10 10 0 100-20" stroke={color} strokeWidth={1} opacity={0.3} />
          <Circle cx="10" cy="10" r="1.5" fill={color} />
        </Svg>
      );
  }
});

const freshnessVariant = (freshness: DataSource['freshness']): 'success' | 'warning' | 'danger' => {
  switch (freshness) {
    case 'fresh': return 'success';
    case 'stale': return 'warning';
    case 'expired': return 'danger';
  }
};

const SourceCard: React.FC<SourceCardProps> = ({ source, animationDelay = 0, isLoading = false }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const shimmerX = useSharedValue(-200);
  const isStale = source.freshness === 'stale' || source.freshness === 'expired';

  useEffect(() => {
    opacity.value = withDelay(animationDelay, withTiming(1, { duration: anim.normal }));
    translateY.value = withDelay(
      animationDelay,
      withSpring(0, anim.spring)
    );
  }, [animationDelay]);

  useEffect(() => {
    if (isLoading) {
      shimmerX.value = withRepeat(
        withTiming(400, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      );
    }
  }, [isLoading]);

  const cardAnim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (isLoading) {
    return (
      <Animated.View style={cardAnim}>
        <GlassCard>
          <View style={styles.shimmerContainer}>
            <LinearGradient
              colors={colors.gradient.shimmer as unknown as string[]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmerGradient}
            />
            <View style={styles.shimmerLine1} />
            <View style={styles.shimmerLine2} />
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={cardAnim}>
      <GlassCard
        style={isStale ? styles.staleCard : undefined}
        glowColor={isStale ? colors.accent.amber : undefined}
        intensity={isStale ? 'medium' : 'low'}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <SourceIcon type={source.source_type} color={isStale ? colors.accent.amber : colors.accent.cyan} />
            <View style={styles.headerText}>
              <Text style={styles.title}>
                {source.label ?? source.source_type.toUpperCase()}
              </Text>
              <Text style={styles.sourceId}>{source.source_id}</Text>
            </View>
          </View>
          <Badge
            label={source.freshness.toUpperCase()}
            variant={freshnessVariant(source.freshness)}
          />
        </View>
        <View style={styles.credRow}>
          <Text style={styles.credLabel}>CREDIBILITY</Text>
          <CredibilityBar score={source.credibility_score} />
        </View>
        <View style={styles.domainRow}>
          {source.domain_hints.map((hint) => (
            <View key={hint} style={styles.domainChip}>
              <Text style={styles.domainText}>{hint}</Text>
            </View>
          ))}
        </View>
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: typography.h3.fontFamily,
    fontSize: typography.h3.fontSize,
    color: colors.text.primary,
  },
  sourceId: {
    fontFamily: typography.monoSm.fontFamily,
    fontSize: typography.monoSm.fontSize,
    color: colors.text.muted,
    marginTop: 2,
  },
  credRow: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  credLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: typography.label.fontSize,
    letterSpacing: typography.label.letterSpacing,
    textTransform: 'uppercase',
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  domainRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  domainChip: {
    backgroundColor: colors.bg.elevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  domainText: {
    fontFamily: typography.monoSm.fontFamily,
    fontSize: typography.monoSm.fontSize,
    color: colors.text.secondary,
  },
  staleCard: {
    opacity: 0.65,
  },
  shimmerContainer: {
    height: 80,
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  shimmerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmerLine1: {
    height: 12,
    width: '60%',
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.sm,
    marginTop: spacing.md,
    marginLeft: spacing.md,
  },
  shimmerLine2: {
    height: 8,
    width: '40%',
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
    marginLeft: spacing.md,
  },
});

export default React.memo(SourceCard);
