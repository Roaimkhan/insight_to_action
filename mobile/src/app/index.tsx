// src/app/index.tsx — Screen 1: Home / Scenario Select
import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, Pattern, Circle as SvgCircle, Rect, Path } from 'react-native-svg';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, radius, anim } from '../constants/spacing';
import { useAgentStore } from '../store/agentStore';
import PulsingDot from '../components/ui/PulsingDot';
import Badge from '../components/ui/Badge';
import ScanLine from '../components/ui/ScanLine';
import type { ScenarioId } from '../types/agent';
import UploadPromptPanel from '../components/UploadPromptPanel/UploadPromptPanel';
import DemoBottomSheet from '../components/Demo/DemoBottomSheet';
import { useRef } from 'react';

interface ScenarioData {
  id: ScenarioId;
  title: string;
  accent: string;
  sources: number;
  contradictions: number;
  types: string[];
  description: string;
}

const scenarios: ScenarioData[] = [
  {
    id: 'supply_chain',
    title: 'SUPPLY CHAIN CRISIS',
    accent: colors.accent.amber,
    sources: 5,
    contradictions: 1,
    types: ['PDF', 'CSV', 'WEB', 'TABLE', 'FEED'],
    description: 'Stock discrepancy between IoT sensors and stale procurement data'
  },
  {
    id: 'power_grid',
    title: 'POWER GRID FAULT',
    accent: colors.accent.crimson,
    sources: 5,
    contradictions: 2,
    types: ['PDF', 'CSV', 'WEB', 'TABLE', 'FEED'],
    description: 'Outage detection with conflicting load balance and sensor readings'
  },
  {
    id: 'sentiment_crisis',
    title: 'SENTIMENT CRISIS',
    accent: colors.accent.violet,
    sources: 5,
    contradictions: 1,
    types: ['PDF', 'CSV', 'WEB', 'TABLE', 'FEED'],
    description: 'Brand sentiment spike with stale social data vs real-time API'
  },
];

// ── Counter Component for Premium Dashboard Feel ──────────────────
const Counter: React.FC<{ value: number; suffix?: string; delay: number }> = ({ value, suffix = '', delay }) => {
  const [displayVal, setDisplayVal] = useState(0);
  useEffect(() => {
    let active = true;
    const t = setTimeout(() => {
      let current = 0;
      const target = value;
      if (target === 0) return;
      const step = Math.max(1, Math.ceil(target / 25));
      const interval = setInterval(() => {
        if (!active) return;
        current += step;
        if (current >= target) {
          setDisplayVal(target);
          clearInterval(interval);
        } else {
          setDisplayVal(current);
        }
      }, 20);
      return () => clearInterval(interval);
    }, delay);

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [value, delay]);

  return <Text>{displayVal}{suffix}</Text>;
};

// ── Scenario Card Component ─────────────────────────────────────
const ScenarioCard: React.FC<{ scenario: ScenarioData; delay: number; onPress: () => void }> = React.memo(
  ({ scenario, delay, onPress }) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(24);
    const scale = useSharedValue(1);
    const pressY = useSharedValue(0);

    useEffect(() => {
      opacity.value = withDelay(delay, withTiming(1, { duration: anim.normal }));
      translateY.value = withDelay(delay, withSpring(0, anim.spring));
    }, [delay]);

    const cardStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value + pressY.value },
        { scale: scale.value }
      ],
    }));

    const handlePressIn = useCallback(() => {
      scale.value = withSpring(1.02, { damping: 12, stiffness: 150 });
      pressY.value = withSpring(-6, { damping: 12, stiffness: 150 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, []);

    const handlePressOut = useCallback(() => {
      scale.value = withSpring(1, anim.spring);
      pressY.value = withSpring(0, anim.spring);
    }, []);

    return (
      <Animated.View style={cardStyle}>
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
          <View style={[styles.scenarioCard, { borderColor: colors.border.default }]}>
            <View style={styles.scenarioHeader}>
              <View style={styles.scenarioTitleRow}>
                <View style={[styles.scenarioDot, { backgroundColor: scenario.accent }]} />
                <Text style={styles.scenarioTitle}>{scenario.title}</Text>
              </View>
              <Text style={[styles.scenarioArrow, { color: scenario.accent }]}>→</Text>
            </View>
            
            <Text style={styles.scenarioDesc}>{scenario.description}</Text>

            <View style={styles.badgeRow}>
              <Badge label={`${scenario.sources} SOURCES`} variant="default" />
              <Badge label={`${scenario.contradictions} CONTRADICTIONS`} variant="danger" />
            </View>

            <View style={styles.typesRow}>
              {scenario.types.map((t) => (
                <View key={t} style={styles.typeChip}>
                  <Text style={styles.typeText}>{t}</Text>
                </View>
              ))}
            </View>

            <View
              style={[styles.runButton, { backgroundColor: scenario.accent + '12', borderColor: scenario.accent + '35' }]}
            >
              <Text style={[styles.runButtonText, { color: scenario.accent }]}>RUN SIMULATION</Text>
            </View>
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
  
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Entrance animations for premium feel
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(20);
  const heroScale = useSharedValue(0.95);

  const statBox1Opacity = useSharedValue(0);
  const statBox1Scale = useSharedValue(0.9);
  const statBox1TranslateY = useSharedValue(12);

  const statBox2Opacity = useSharedValue(0);
  const statBox2Scale = useSharedValue(0.9);
  const statBox2TranslateY = useSharedValue(12);

  const section1Opacity = useSharedValue(0);
  const section1TranslateY = useSharedValue(12);

  const section2Opacity = useSharedValue(0);
  const section2TranslateY = useSharedValue(12);

  const uploadBoxOpacity = useSharedValue(0);
  const uploadBoxTranslateY = useSharedValue(16);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: anim.normal });
    headerTranslateY.value = withSpring(0, anim.spring);

    heroOpacity.value = withDelay(100, withTiming(1, { duration: anim.normal }));
    heroTranslateY.value = withDelay(100, withSpring(0, anim.spring));
    heroScale.value = withDelay(100, withSpring(1, anim.spring));

    statBox1Opacity.value = withDelay(180, withTiming(1, { duration: anim.normal }));
    statBox1Scale.value = withDelay(180, withSpring(1, anim.spring));
    statBox1TranslateY.value = withDelay(180, withSpring(0, anim.spring));

    statBox2Opacity.value = withDelay(240, withTiming(1, { duration: anim.normal }));
    statBox2Scale.value = withDelay(240, withSpring(1, anim.spring));
    statBox2TranslateY.value = withDelay(240, withSpring(0, anim.spring));

    section1Opacity.value = withDelay(320, withTiming(1, { duration: anim.normal }));
    section1TranslateY.value = withDelay(320, withSpring(0, anim.spring));

    section2Opacity.value = withDelay(600, withTiming(1, { duration: anim.normal }));
    section2TranslateY.value = withDelay(600, withSpring(0, anim.spring));

    uploadBoxOpacity.value = withDelay(660, withTiming(1, { duration: anim.normal }));
    uploadBoxTranslateY.value = withDelay(660, withSpring(0, anim.spring));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }, { scale: heroScale.value }],
  }));

  const statBox1Style = useAnimatedStyle(() => ({
    opacity: statBox1Opacity.value,
    transform: [{ scale: statBox1Scale.value }, { translateY: statBox1TranslateY.value }],
  }));

  const statBox2Style = useAnimatedStyle(() => ({
    opacity: statBox2Opacity.value,
    transform: [{ scale: statBox2Scale.value }, { translateY: statBox2TranslateY.value }],
  }));

  const section1Style = useAnimatedStyle(() => ({
    opacity: section1Opacity.value,
    transform: [{ translateY: section1TranslateY.value }],
  }));

  const section2Style = useAnimatedStyle(() => ({
    opacity: section2Opacity.value,
    transform: [{ translateY: section2TranslateY.value }],
  }));

  const uploadBoxStyle = useAnimatedStyle(() => ({
    opacity: uploadBoxOpacity.value,
    transform: [{ translateY: uploadBoxTranslateY.value }],
  }));

  const handleScenario = useCallback((id: ScenarioId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startScenario(id);
    router.push('/agent');
  }, [startScenario, router]);

  const handleCustomUpload = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsUploading(true);

    // Simulate mobile file selection and processing
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setUploadedFiles([
      { name: 'procurement_report.pdf', size: '1.24 MB' },
      { name: 'inventory_levels.csv', size: '0.85 MB' },
    ]);
    setIsUploading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Dot grid background */}
      <Svg style={StyleSheet.absoluteFill} opacity={0.4}>
        <Defs>
          <Pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <SvgCircle cx="1" cy="1" r="1" fill="rgba(15, 23, 42, 0.10)" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dots)" />
      </Svg>

      <ScanLine />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>SUPPLYAI</Text>
            <PulsingDot color={colors.accent.cyan} size={8} />
          </View>
          <Badge label="SYSTEM ONLINE" variant="info" />
        </Animated.View>

        {/* Hero */}
        <Animated.View style={[styles.hero, heroStyle]}>
          <Text style={styles.heroTitle}>Autonomous{'\n'}Command Center</Text>
          <Text style={styles.heroSub}>crystalline intelligence engine</Text>
        </Animated.View>

        {/* Stat Panel */}
        <View style={styles.statRow}>
          <Animated.View style={[styles.statBox, statBox1Style]}>
            <Text style={styles.statNumber}>
              <Counter value={87} suffix="%" delay={250} />
            </Text>
            <Text style={styles.statLabel}>SYSTEM CREDIBILITY</Text>
          </Animated.View>
          <Animated.View style={[styles.statBox, statBox2Style]}>
            <Text style={styles.statNumber}>
              <Counter value={94} suffix="%" delay={350} />
            </Text>
            <Text style={styles.statLabel}>CHAIN HEAL RATE</Text>
          </Animated.View>
        </View>

        {/* Section Header */}
        <Animated.View style={[styles.sectionHeader, section1Style]}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>DEMO SCENARIOS</Text>
        </Animated.View>

        {/* Scenario Cards */}
        {scenarios.map((s, i) => (
          <ScenarioCard
            key={s.id}
            scenario={s}
            delay={400 + i * 80}
            onPress={() => handleScenario(s.id)}
          />
        ))}

        {/* Section Header Ingestion */}
        <Animated.View style={[styles.sectionHeader, section2Style, { marginTop: spacing.lg }]}>
          <View style={[styles.sectionAccent, { backgroundColor: colors.accent.cyan }]} />
          <Text style={styles.sectionLabel}>OPERATIONAL INGESTION</Text>
        </Animated.View>
          <View style={{ marginTop: 12 }}>
            <UploadPromptPanel />
          </View>
          <DemoBottomSheet sheetRef={useRef(null)} />

        {/* Upload Container */}
        <Animated.View style={[styles.uploadBox, uploadBoxStyle]}>
          <Pressable onPress={handleCustomUpload} style={styles.uploadPressable}>
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.accent.cyan} />
            ) : (
              <>
                <Text style={styles.uploadPlus}>+</Text>
                <Text style={styles.uploadText}>INGEST CUSTOM DATA SOURCES</Text>
                <Text style={styles.uploadSub}>Supports PDF, CSV, TXT files (Max 5)</Text>
              </>
            )}
          </Pressable>

          {uploadedFiles.length > 0 ? (
            <View style={styles.uploadedList}>
              {uploadedFiles.map((file, i) => (
                <View key={i} style={styles.fileRow}>
                  <Text style={styles.fileName}>{file.name}</Text>
                  <Text style={styles.fileSize}>{file.size}</Text>
                </View>
              ))}
              <Pressable
                onPress={() => handleScenario('supply_chain')}
                style={styles.runCustomBtn}
              >
                <Text style={styles.runCustomBtnText}>RUN ANALYSIS WITH CUSTOM SOURCES</Text>
              </Pressable>
            </View>
          ) : null}
        </Animated.View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg.root },
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoText: { fontFamily: typography.h2.fontFamily, fontSize: 18, fontWeight: '700', letterSpacing: -0.2, color: colors.text.primary },
  hero: { marginTop: spacing.md, marginBottom: spacing.md },
  heroTitle: { fontFamily: typography.h1.fontFamily, fontSize: 32, fontWeight: '700', letterSpacing: -0.8, color: colors.text.primary, lineHeight: 38 },
  heroSub: { fontFamily: typography.label.fontFamily, fontSize: typography.label.fontSize, letterSpacing: 2, textTransform: 'uppercase', color: colors.text.muted, marginTop: spacing.xs },
  statRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statBox: { flex: 1, backgroundColor: colors.bg.glass, borderRadius: radius.md, borderWidth: 1, borderColor: colors.glass.border, padding: spacing.md },
  statNumber: { fontFamily: typography.monoLg.fontFamily, fontSize: typography.monoLg.fontSize, color: colors.accent.cyan, fontWeight: '700' },
  statLabel: { fontFamily: typography.label.fontFamily, fontSize: 9, letterSpacing: 0.5, color: colors.text.muted, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionAccent: { width: 3, height: 16, backgroundColor: colors.accent.cyan, borderRadius: 2, marginRight: spacing.sm },
  sectionLabel: { fontFamily: typography.label.fontFamily, fontSize: typography.label.fontSize, letterSpacing: typography.label.letterSpacing, textTransform: 'uppercase', color: colors.text.secondary },
  scenarioCard: { backgroundColor: colors.bg.glass, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.glass.border, padding: spacing.md, marginBottom: spacing.sm },
  scenarioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  scenarioTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scenarioDot: { width: 8, height: 8, borderRadius: 4 },
  scenarioTitle: { fontFamily: typography.h2.fontFamily, fontSize: 15, fontWeight: '600', color: colors.text.primary },
  scenarioArrow: { fontFamily: typography.monoBold.fontFamily, fontSize: 16, fontWeight: '700' },
  scenarioDesc: { fontFamily: typography.body.fontFamily, fontSize: 12, color: colors.text.secondary, marginBottom: spacing.md },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  typesRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md, flexWrap: 'wrap' },
  typeChip: { backgroundColor: colors.bg.sunken, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  typeText: { fontFamily: typography.monoSm.fontFamily, fontSize: 9, color: colors.text.secondary },
  runButton: { borderRadius: radius.md, borderWidth: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  runButtonText: { fontFamily: typography.monoBold.fontFamily, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  uploadBox: { backgroundColor: colors.bg.glass, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border.strong, borderRadius: radius.lg, padding: spacing.md },
  uploadPressable: { alignItems: 'center', paddingVertical: spacing.md },
  uploadPlus: { fontFamily: typography.monoLg.fontFamily, fontSize: 24, color: colors.text.muted, marginBottom: spacing.xs },
  uploadText: { fontFamily: typography.label.fontFamily, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.text.secondary, fontWeight: '700' },
  uploadSub: { fontFamily: typography.small.fontFamily, fontSize: 10, color: colors.text.muted, marginTop: spacing.xs },
  uploadedList: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border.default, paddingTop: spacing.sm, gap: 6 },
  fileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fileName: { fontFamily: typography.body.fontFamily, fontSize: 12, color: colors.text.primary },
  fileSize: { fontFamily: typography.monoSm.fontFamily, fontSize: 10, color: colors.text.muted },
  runCustomBtn: { backgroundColor: colors.accent.cyan, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.md },
  runCustomBtnText: { fontFamily: typography.monoBold.fontFamily, fontSize: 10, color: colors.text.inverse, fontWeight: '700' }
});
