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
  success: { bg: 'rgba(0,255,135,0.12)', text: colors.accent.green, border: colors.border.success },
  warning: { bg: 'rgba(255,176,32,0.12)', text: colors.accent.amber, border: colors.border.warning },
  danger:  { bg: 'rgba(255,61,90,0.12)',  text: colors.accent.red,   border: colors.border.danger },
  info:    { bg: 'rgba(0,229,255,0.12)',   text: colors.accent.cyan,  border: colors.border.active },
  default: { bg: 'rgba(61,90,122,0.12)',   text: colors.text.muted,   border: colors.border.subtle },
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
