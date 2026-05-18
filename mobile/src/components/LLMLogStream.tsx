// src/components/LLMLogStream.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, radius, anim } from '../constants/spacing';

interface LLMLogStreamProps {
  tokens: string[];
  maxLines?: number;
}

const LLMLogStream: React.FC<LLMLogStreamProps> = ({ tokens, maxLines = 20 }) => {
  const scrollRef = useRef<ScrollView>(null);
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    cursorOpacity.value = withRepeat(
      withSequence(withTiming(0, { duration: anim.cursorBlink }), withTiming(1, { duration: anim.cursorBlink })),
      -1, false
    );
  }, []);

  const cursorStyle = useAnimatedStyle(() => ({ opacity: cursorOpacity.value }));

  const displayText = useMemo(() => {
    const full = tokens.join('');
    return full.split('\n').filter((l) => l.length > 0).slice(-maxLines);
  }, [tokens, maxLines]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [tokens.length]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerAccent} />
        <Text style={styles.headerLabel}>AGENT REASONING</Text>
      </View>
      <ScrollView ref={scrollRef} style={styles.scrollView} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {displayText.map((line, i) => (
          <View key={i} style={styles.lineRow}>
            <Text style={styles.lineText}>{line}</Text>
            {i === displayText.length - 1 && <Animated.Text style={[styles.cursor, cursorStyle]}>{'█'}</Animated.Text>}
          </View>
        ))}
        {displayText.length === 0 && (
          <View style={styles.lineRow}>
            <Text style={styles.lineText}>{'> Initializing agent...'}</Text>
            <Animated.Text style={[styles.cursor, cursorStyle]}>{'█'}</Animated.Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.bg.primary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.subtle, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  headerAccent: { width: 3, height: 14, backgroundColor: colors.accent.violet, borderRadius: 2, marginRight: spacing.sm },
  headerLabel: { fontFamily: typography.label.fontFamily, fontSize: typography.label.fontSize, letterSpacing: typography.label.letterSpacing, textTransform: 'uppercase', color: colors.accent.violet },
  scrollView: { maxHeight: 180, padding: spacing.md },
  lineRow: { flexDirection: 'row', marginBottom: 4, flexWrap: 'wrap' },
  lineText: { fontFamily: typography.mono.fontFamily, fontSize: typography.mono.fontSize, color: colors.accent.violet, lineHeight: 20 },
  cursor: { fontFamily: typography.mono.fontFamily, fontSize: typography.mono.fontSize, color: colors.accent.violet, lineHeight: 20 },
});

export default React.memo(LLMLogStream);
