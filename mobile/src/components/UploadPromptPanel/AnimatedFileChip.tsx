import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

const AnimatedFileChip: React.FC<{ name: string; onRemove: () => void }> = ({ name, onRemove }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 200 });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ padding: 8, backgroundColor: '#fff', borderRadius: 8, marginRight: 8, flexDirection: 'row', alignItems: 'center' }, style] as any}>
      <Text numberOfLines={1} style={{ maxWidth: 140 }}>{name}</Text>
      <Pressable onPress={onRemove} style={{ marginLeft: 8 }} accessibilityRole="button" accessibilityLabel={`Remove ${name}`}>
        <Text style={{ color: '#c00' }} accessible>✕</Text>
      </Pressable>
    </Animated.View>
  );
};

export default AnimatedFileChip;
