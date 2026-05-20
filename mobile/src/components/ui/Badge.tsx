// src/components/ui/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';

interface BadgeProps {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'default';
  style?: ViewStyle;
}

const variantColors = {
  success: { bg: colors.accent.emeraldLight, text: colors.accent.emerald, border: colors.border.emerald },
  warning: { bg: colors.accent.amberLight, text: colors.accent.amber, border: colors.border.amber },
  danger:  { bg: colors.accent.crimsonLight, text: colors.accent.crimson, border: colors.border.crimson },
  info:    { bg: colors.accent.cyanLight, text: colors.accent.cyan, border: colors.border.cyan },
  default: { bg: colors.bg.sunken, text: colors.text.secondary, border: colors.border.subtle },
};

const Badge: React.FC<BadgeProps> = ({ label, variant, style }) => {
  const vc = variantColors[variant];

  return (
    <View style={[styles.badge, { backgroundColor: vc.bg, borderColor: vc.border }, style]}>
      <Text style={[styles.text, { color: vc.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 1,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: typography.monoSm.fontFamily,
    fontSize: typography.monoSm.fontSize,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default React.memo(Badge);
