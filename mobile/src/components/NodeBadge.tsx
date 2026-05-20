// src/components/NodeBadge.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, radius } from '../constants/spacing';
import PulsingDot from './ui/PulsingDot';

interface NodeBadgeProps {
  node: string;
  elapsedMs: number;
}

const NodeBadge: React.FC<NodeBadgeProps> = ({ node, elapsedMs }) => {
  const formatTime = useCallback((ms: number): string => {
    const s = (ms / 1000).toFixed(1);
    return `${s}s`;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <PulsingDot color={colors.accent.cyan} size={6} speed="fast" />
        <Text style={styles.label}>NODE</Text>
        <View style={styles.nodeBadge}>
          <Text style={styles.nodeText}>{node.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.timer}>{formatTime(elapsedMs)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontFamily: typography.label.fontFamily,
    fontSize: typography.label.fontSize,
    letterSpacing: typography.label.letterSpacing,
    textTransform: 'uppercase',
    color: colors.text.muted,
  },
  nodeBadge: {
    backgroundColor: colors.accent.cyanGlow,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.cyan,
  },
  nodeText: {
    fontFamily: typography.mono.fontFamily,
    fontSize: typography.mono.fontSize,
    color: colors.accent.cyan,
    letterSpacing: 1,
  },
  timer: {
    fontFamily: typography.monoBold.fontFamily,
    fontSize: typography.monoBold.fontSize,
    color: colors.text.primary,
  },
});

export default React.memo(NodeBadge);
