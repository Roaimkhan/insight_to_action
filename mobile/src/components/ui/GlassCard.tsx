// src/components/ui/GlassCard.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  intensity?: 'low' | 'medium' | 'high';
}

const intensityMap = {
  low:    { shadowOpacity: 0.15, shadowRadius: 4,  borderOpacity: 0.08 },
  medium: { shadowOpacity: 0.35, shadowRadius: 8,  borderOpacity: 0.18 },
  high:   { shadowOpacity: 0.55, shadowRadius: 12, borderOpacity: 0.45 },
};

const GlassCard: React.FC<GlassCardProps> = ({ children, style, glowColor, intensity = 'low' }) => {
  const { shadowOpacity, shadowRadius, borderOpacity } = intensityMap[intensity];
  const glow = glowColor ?? colors.accent.cyan;

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: glow.replace(/[\d.]+\)$/, `${borderOpacity})`).includes('rgba')
            ? glow
            : `${glow}${Math.round(borderOpacity * 255).toString(16).padStart(2, '0')}`,
          elevation: intensity === 'high' ? 8 : 4,
          shadowColor: glow,
          shadowOpacity,
          shadowRadius,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.glass,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    shadowOffset: { width: 0, height: 2 },
  },
});

export default React.memo(GlassCard);
