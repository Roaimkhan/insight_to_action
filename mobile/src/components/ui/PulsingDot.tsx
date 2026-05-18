// src/components/ui/PulsingDot.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';

interface PulsingDotProps {
  color?: string;
  size?: number;
  speed?: 'slow' | 'normal' | 'fast';
}

const speedMap = { slow: 3000, normal: 2000, fast: 1000 };

const PulsingDot: React.FC<PulsingDotProps> = ({
  color = colors.accent.cyan,
  size = 8,
  speed = 'normal',
}) => {
  const opacity = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.6);
  const duration = speedMap[speed];

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: duration / 2 }),
        withTiming(1, { duration: duration / 2 })
      ),
      -1,
      false
    );

    ringScale.value = withRepeat(
      withSequence(
        withTiming(2.5, { duration: duration }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );

    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: duration }),
        withTiming(0.6, { duration: 0 })
      ),
      -1,
      false
    );
  }, [duration]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={[styles.container, { width: size * 3, height: size * 3 }]}>
      <Animated.View
        style={[
          styles.ring,
          ringStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          dotStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
});

export default React.memo(PulsingDot);
