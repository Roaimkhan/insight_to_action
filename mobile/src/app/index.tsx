// src/app/index.tsx — Screen 1: Home / Scenario Select
import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, Pattern, Circle as SvgCircle, Rect } from 'react-native-svg';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, radius, anim } from '../constants/spacing';
import { useAgentStore } from '../store/agentStore';
import PulsingDot from '../components/ui/PulsingDot';
import Badge from '../components/ui/Badge';
import ScanLine from '../components/ui/ScanLine';
import type { ScenarioId } from '../types/agent';

interface ScenarioData {
  id: ScenarioId;
  title: string;
  accent: string;
  sources: number;
  contradictions: number;
  types: string[];
}

const scenarios: ScenarioData[] = [
  { id: 'supply_chain', title: 'SUPPLY CHAIN CRISIS', accent: colors.accent.amber, sources: 5, contradictions: 1, types: ['PDF', 'CSV', 'WEB', 'TABLE', 'FEED'] },
  { id: 'power_grid', title: 'POWER GRID FAULT', accent: colors.accent.red, sources: 5, contradictions: 2, types: ['PDF', 'CSV', 'WEB', 'TABLE', 'FEED'] },
  { id: 'sentiment_crisis', title: 'SENTIMENT CRISIS', accent: colors.accent.violet, sources: 5, contradictions: 1, types: ['PDF', 'CSV', 'WEB', 'TABLE', 'FEED'] },
];

// ── Scenario Card ─────────────────────────────────────────────
const ScenarioCard: React.FC<{ scenario: ScenarioData; delay: number; onPress: () => void }> = React.memo(
  ({ scenario, delay, onPress }) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);
    const scale = useSharedValue(1);

    useEffect(() => {
      opacity.value = withDelay(delay, withTiming(1, { duration: anim.normal }));
      translateY.value = withDelay(delay, withSpring(0, anim.spring));
    }, [delay]);

    const cardStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
      scale.value = withTiming(0.97, { duration: 100 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);
    const handlePressOut = useCallback(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    }, []);

    return (
      <Animated.View style={cardStyle}>
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
          <View style={[styles.scenarioCard, { borderColor: scenario.accent + '30' }]}>
            <View style={styles.scenarioHeader}>
              <View style={styles.scenarioTitleRow}>
                <View style={[styles.scenarioDot, { backgroundColor: scenario.accent }]} />
                <Text style={styles.scenarioTitle}>{scenario.title}</Text>
              </View>
              <Text style={[styles.scenarioArrow, { color: scenario.accent }]}>{'>'}</Text>
            </View>
            <View style={styles.badgeRow}>
              <Badge label={`${scenario.sources} SOURCES`} variant="info" />
              <Badge label={`${scenario.contradictions} CONTRADICTION${scenario.contradictions > 1 ? 'S' : ''}`} variant="danger" />
            </View>
            <View style={styles.typesRow}>
              {scenario.types.map((t) => (
                <View key={t} style={styles.typeChip}>
                  <Text style={styles.typeText}>{t}</Text>
                </View>
              ))}
            </View>
            <Pressable
              style={[styles.runButton, { backgroundColor: scenario.accent + '18', borderColor: scenario.accent + '60' }]}
              onPress={onPress}
            >
              <Text style={[styles.runButtonText, { color: scenario.accent }]}>RUN SCENARIO</Text>
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const startScenario = useAgentStore((s) => s.startScenario);

  // Entrance animations
  const headerOpacity = useSharedValue(0);
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(20);
  const statOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: anim.normal });
    heroOpacity.value = withDelay(150, withTiming(1, { duration: anim.normal }));
    heroTranslateY.value = withDelay(150, withSpring(0, anim.spring));
    statOpacity.value = withDelay(250, withTiming(1, { duration: anim.slow }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value, transform: [{ translateY: heroTranslateY.value }],
  }));
  const statStyle = useAnimatedStyle(() => ({ opacity: statOpacity.value }));

  const handleScenario = useCallback((id: ScenarioId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startScenario(id);
    router.push('/agent');
  }, [startScenario, router]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Dot grid background */}
      <Svg style={StyleSheet.absoluteFill} opacity={0.35}>
        <Defs>
          <Pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <SvgCircle cx="1" cy="1" r="1" fill="rgba(0,229,255,0.15)" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dots)" />
      </Svg>

      <ScanLine />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>AGENT.AI</Text>
            <PulsingDot color={colors.accent.cyan} size={8} />
          </View>
        </Animated.View>

        {/* Hero */}
        <Animated.View style={[styles.hero, heroStyle]}>
          <Text style={styles.heroTitle}>AUTONOMOUS{'\n'}CONTENT AGENT</Text>
          <Text style={styles.heroSub}>MULTI-DOMAIN  ·  5 INPUT TYPES  ·  SELF-HEALING</Text>
        </Animated.View>

        {/* Stat */}
        <Animated.View style={[styles.statRow, statStyle]}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>INPUT TYPES</Text>
        </Animated.View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>DEMO SCENARIOS</Text>
        </View>

        {/* Scenario Cards */}
        {scenarios.map((s, i) => (
          <ScenarioCard
            key={s.id}
            scenario={s}
            delay={300 + i * 80}
            onPress={() => handleScenario(s.id)}
          />
        ))}

        {/* Upload placeholder */}
        <Animated.View style={[styles.uploadBox, { opacity: statOpacity }]}>
          <Text style={styles.uploadPlus}>+</Text>
          <Text style={styles.uploadText}>UPLOAD CUSTOM FILES</Text>
          <Text style={styles.uploadSub}>5 files required</Text>
        </Animated.View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg.primary },
  scrollContent: { paddingHorizontal: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoText: { fontFamily: typography.h2.fontFamily, fontSize: typography.h2.fontSize, letterSpacing: typography.h2.letterSpacing, color: colors.text.primary },
  hero: { marginTop: spacing.lg, marginBottom: spacing.md },
  heroTitle: { fontFamily: typography.h1.fontFamily, fontSize: 32, letterSpacing: -0.8, color: colors.text.primary, lineHeight: 38 },
  heroSub: { fontFamily: typography.label.fontFamily, fontSize: typography.label.fontSize, letterSpacing: 2, textTransform: 'uppercase', color: colors.text.muted, marginTop: spacing.sm },
  statRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.lg },
  statNumber: { fontFamily: typography.monoXl.fontFamily, fontSize: typography.monoXl.fontSize, color: colors.accent.cyan },
  statLabel: { fontFamily: typography.label.fontFamily, fontSize: typography.label.fontSize, letterSpacing: typography.label.letterSpacing, textTransform: 'uppercase', color: colors.text.muted },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionAccent: { width: 3, height: 16, backgroundColor: colors.accent.cyan, borderRadius: 2, marginRight: spacing.sm },
  sectionLabel: { fontFamily: typography.label.fontFamily, fontSize: typography.label.fontSize, letterSpacing: typography.label.letterSpacing, textTransform: 'uppercase', color: colors.text.secondary },
  scenarioCard: { backgroundColor: colors.bg.secondary, borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm },
  scenarioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  scenarioTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scenarioDot: { width: 8, height: 8, borderRadius: 4 },
  scenarioTitle: { fontFamily: typography.h2.fontFamily, fontSize: 16, letterSpacing: typography.h2.letterSpacing, color: colors.text.primary },
  scenarioArrow: { fontFamily: typography.monoBold.fontFamily, fontSize: 18 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  typesRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md, flexWrap: 'wrap' },
  typeChip: { backgroundColor: colors.bg.elevated, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  typeText: { fontFamily: typography.monoSm.fontFamily, fontSize: typography.monoSm.fontSize, color: colors.text.secondary },
  runButton: { borderRadius: radius.md, borderWidth: 1, paddingVertical: spacing.sm + 2, alignItems: 'center' },
  runButtonText: { fontFamily: typography.monoBold.fontFamily, fontSize: 13, letterSpacing: 1.5 },
  uploadBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border.subtle, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md },
  uploadPlus: { fontFamily: typography.monoLg.fontFamily, fontSize: 28, color: colors.text.muted, marginBottom: spacing.xs },
  uploadText: { fontFamily: typography.label.fontFamily, fontSize: typography.label.fontSize, letterSpacing: typography.label.letterSpacing, textTransform: 'uppercase', color: colors.text.secondary },
  uploadSub: { fontFamily: typography.small.fontFamily, fontSize: typography.small.fontSize, color: colors.text.muted, marginTop: spacing.xs },
});
