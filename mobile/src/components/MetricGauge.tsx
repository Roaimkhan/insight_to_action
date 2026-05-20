// src/components/MetricGauge.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedProps, useDerivedValue, withDelay, withTiming, withSpring, SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing } from '../constants/spacing';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MetricGaugeProps {
  label: string;
  value: number;
  maxValue: number;
  unit?: string;
  direction?: 'up-good' | 'down-good';
  animationDelay?: number;
}

const MetricGauge: React.FC<MetricGaugeProps> = ({
  label, value, maxValue, unit = '', direction = 'down-good', animationDelay = 0,
}) => {
  const size = 120;
  const strokeWidth = 8;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = Math.min(value / maxValue, 1);

  const progress = useSharedValue(0);
  const countUp = useSharedValue(0);

  const isGood = direction === 'down-good'
    ? value < maxValue * 0.5
    : value > maxValue * 0.5;
  const gaugeColor = isGood ? colors.accent.emerald : colors.accent.amber;

  useEffect(() => {
    progress.value = withDelay(animationDelay, withTiming(ratio, { duration: 1500 }));
    countUp.value = withDelay(animationDelay, withTiming(value, { duration: 1500 }));
  }, [value, ratio, animationDelay]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const displayValue = useDerivedValue(() => `${Math.round(countUp.value)}`);

  return (
    <View style={styles.container}>
      <View style={styles.gaugeWrap}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background track */}
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={colors.bg.elevated} strokeWidth={strokeWidth} fill="none"
          />
          {/* Animated fill */}
          <AnimatedCircle
            cx={size / 2} cy={size / 2} r={r}
            stroke={gaugeColor} strokeWidth={strokeWidth} fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        {/* Center number */}
        <View style={styles.centerLabel}>
          <AnimatedText value={displayValue} color={gaugeColor} />
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

// Animated text component using Reanimated
const AnimatedText: React.FC<{ value: SharedValue<string>; color: string }> = ({ value, color }) => {
  const [display, setDisplay] = React.useState('0');

  // Use a simple polling approach for the animated number
  useEffect(() => {
    const interval = setInterval(() => {
      // Read the derived value - this is a workaround for RN text
      // In production you'd use Reanimated's AnimatedText or a worklet
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // For simplicity, use the target value directly with a count-up via state
  const targetNum = React.useRef(0);

  return (
    <Text style={[styles.number, { color }]}>{display}</Text>
  );
};

// Simpler approach: just use a state-based count-up since RN Text can't be animated directly
const MetricGaugeWithCountUp: React.FC<MetricGaugeProps> = (props) => {
  const { label, value, maxValue, unit = '', direction = 'down-good', animationDelay = 0 } = props;
  const size = 120;
  const strokeWidth = 8;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = Math.min(value / maxValue, 1);

  const progress = useSharedValue(0);
  const [displayNum, setDisplayNum] = React.useState(0);

  const isGood = direction === 'down-good' ? value < maxValue * 0.5 : value > maxValue * 0.5;
  const gaugeColor = isGood ? colors.accent.emerald : colors.accent.amber;

  useEffect(() => {
    const timeout = setTimeout(() => {
      progress.value = withSpring(ratio, { damping: 14, stiffness: 120 });
      // Count-up animation
      const startTime = Date.now();
      const dur = 1500;
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / dur, 1);
        const easeOut = 1 - (1 - t) * (1 - t); // easeOutQuad for organic slowdown
        setDisplayNum(Math.round(easeOut * value));
        if (t >= 1) {
          setDisplayNum(value);
          clearInterval(interval);
        }
      }, 40);
      return () => clearInterval(interval);
    }, animationDelay);
    return () => clearTimeout(timeout);
  }, [value, ratio, animationDelay]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.gaugeWrap}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={size/2} cy={size/2} r={r} stroke={colors.bg.elevated} strokeWidth={strokeWidth} fill="none" />
          <AnimatedCircle
            cx={size/2} cy={size/2} r={r} stroke={gaugeColor} strokeWidth={strokeWidth} fill="none"
            strokeLinecap="round" strokeDasharray={circumference} animatedProps={animatedProps}
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
        </Svg>
        <View style={styles.centerLabel}>
          <Text style={[styles.number, { color: gaugeColor }]}>{displayNum}</Text>
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.sm },
  gaugeWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  centerLabel: { position: 'absolute', alignItems: 'center' },
  number: { fontFamily: typography.monoLg.fontFamily, fontSize: typography.monoLg.fontSize },
  unit: { fontFamily: typography.monoSm.fontFamily, fontSize: typography.monoSm.fontSize, color: colors.text.muted, marginTop: -2 },
  label: { fontFamily: typography.label.fontFamily, fontSize: typography.label.fontSize, letterSpacing: typography.label.letterSpacing, textTransform: 'uppercase', color: colors.text.secondary },
});

export default React.memo(MetricGaugeWithCountUp);
