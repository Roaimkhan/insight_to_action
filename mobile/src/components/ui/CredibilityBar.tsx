// src/components/ui/CredibilityBar.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';

interface CredibilityBarProps {
  score: number;       // 0.0 – 1.0
  animate?: boolean;
  showLabel?: boolean;
}

const getBarColor = (score: number): string => {
  if (score > 0.7) return colors.accent.emerald;
  if (score >= 0.5) return colors.accent.amber;
  return colors.accent.crimson;
};

const CredibilityBar: React.FC<CredibilityBarProps> = ({
  score,
  animate = true,
  showLabel = true,
}) => {
  const width = useSharedValue(animate ? 0 : score * 100);
  const barColor = getBarColor(score);

  useEffect(() => {
    if (animate) {
      width.value = withSpring(score * 100, { damping: 20, stiffness: 100 });
    }
  }, [score, animate]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: barColor },
            barStyle,
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: barColor }]}>
          {score.toFixed(2)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
  label: {
    fontFamily: typography.monoSm.fontFamily,
    fontSize: typography.monoSm.fontSize,
    minWidth: 32,
    textAlign: 'right',
  },
});

export default React.memo(CredibilityBar);
