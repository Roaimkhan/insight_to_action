// src/components/LLMLogStream.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
  FadeInLeft,
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

  const highlightLine = (text: string) => {
    const regex = /(\[SUCCESS\]|\[ERROR\]|\[HEALING\]|\[RETRYING\]|\[CONTRADICTION\]|\[CRITICAL\]|RESOLVED|CRISIS|STALE|HEALED|SupplyAI|Command Center)/g;
    const parts = text.split(regex);
    return parts.map((part, index) => {
      let partStyle = {};
      if (
        part === '[SUCCESS]' ||
        part === 'RESOLVED' ||
        part === 'HEALED'
      ) {
        partStyle = { color: colors.accent.emerald, fontWeight: '700' };
      } else if (
        part === '[ERROR]' ||
        part === 'CRISIS' ||
        part === '[CRITICAL]' ||
        part === '[CONTRADICTION]'
      ) {
        partStyle = { color: colors.accent.crimson, fontWeight: '700' };
      } else if (
        part === '[HEALING]' ||
        part === '[RETRYING]' ||
        part === 'STALE'
      ) {
        partStyle = { color: colors.accent.amber, fontWeight: '700' };
      } else if (part === 'SupplyAI' || part === 'Command Center') {
        partStyle = { color: colors.accent.cyan, fontWeight: '700' };
      }
      return (
        <Text key={index} style={[styles.textBase, partStyle]}>
          {part}
        </Text>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerAccent} />
        <Text style={styles.headerLabel}>AGENT REASONING</Text>
      </View>
      <ScrollView ref={scrollRef} style={styles.scrollView} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {displayText.map((line, i) => (
          <Animated.View
            key={i}
            entering={FadeInLeft.duration(200).delay(30)}
            style={styles.lineRow}
          >
            <Text style={styles.lineText}>{highlightLine(line)}</Text>
            {i === displayText.length - 1 && (
              <Animated.Text style={[styles.cursor, cursorStyle]}>{'█'}</Animated.Text>
            )}
          </Animated.View>
        ))}
        {displayText.length === 0 && (
          <View style={styles.lineRow}>
            <Text style={styles.lineText}>{highlightLine('> Initializing agent...')}</Text>
            <Animated.Text style={[styles.cursor, cursorStyle]}>{'█'}</Animated.Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.terminal,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  headerAccent: {
    width: 3,
    height: 14,
    backgroundColor: colors.accent.violet,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  headerLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: typography.label.fontSize,
    letterSpacing: typography.label.letterSpacing,
    textTransform: 'uppercase',
    color: colors.accent.violet,
    fontWeight: '700',
  },
  scrollView: { maxHeight: 180, padding: spacing.md },
  lineRow: { flexDirection: 'row', marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' },
  lineText: {
    fontFamily: typography.mono.fontFamily,
    fontSize: typography.mono.fontSize,
    lineHeight: 20,
  },
  textBase: {
    fontFamily: typography.mono.fontFamily,
    fontSize: typography.mono.fontSize,
    color: colors.text.terminal,
  },
  cursor: {
    fontFamily: typography.mono.fontFamily,
    fontSize: typography.mono.fontSize,
    color: colors.accent.violet,
    lineHeight: 20,
    marginLeft: 2,
  },
});

export default React.memo(LLMLogStream);
