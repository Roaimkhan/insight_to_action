// src/components/ui/ScanLine.tsx
import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { anim } from '../../constants/spacing';

interface ScanLineProps {
  color?: string;
  duration?: number;
}

const ScanLine: React.FC<ScanLineProps> = ({
  color = colors.accent.cyan,
  duration = anim.scanLineCycle,
}) => {
  const { height } = useWindowDimensions();
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(height, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [height, duration]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.line,
        { backgroundColor: color },
        lineStyle,
      ]}
      pointerEvents="none"
    />
  );
};

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.15,
    zIndex: 1,
  },
});

export default React.memo(ScanLine);
