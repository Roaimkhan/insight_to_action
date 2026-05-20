import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, runOnJS
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, Pattern, Circle as SvgCircle, Rect, Path } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius, anim } from '../../constants/spacing';
import ScanLine from '../../components/ui/ScanLine';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Reanimated values for visual effects
  const cardTranslateY = useSharedValue(50);
  const cardOpacity = useSharedValue(0);
  const shakeOffset = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const emailFocus = useSharedValue(0);
  const passwordFocus = useSharedValue(0);

  React.useEffect(() => {
    cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    cardOpacity.value = withTiming(1, { duration: anim.normal });
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { translateY: cardTranslateY.value },
      { translateX: shakeOffset.value }
    ],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const emailInputStyle = useAnimatedStyle(() => ({
    borderColor: emailFocus.value === 1 ? colors.accent.cyan : colors.border.default,
    borderWidth: 1,
    borderRadius: radius.md,
    transform: [{ scale: withSpring(emailFocus.value === 1 ? 1.015 : 1, { damping: 15, stiffness: 150 }) }],
    backgroundColor: emailFocus.value === 1 ? colors.bg.surface : colors.bg.sunken,
    shadowColor: colors.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: withTiming(emailFocus.value * 0.25, { duration: 150 }),
    shadowRadius: withTiming(emailFocus.value * 8, { duration: 150 }),
  }));

  const passwordInputStyle = useAnimatedStyle(() => ({
    borderColor: passwordFocus.value === 1 ? colors.accent.cyan : colors.border.default,
    borderWidth: 1,
    borderRadius: radius.md,
    transform: [{ scale: withSpring(passwordFocus.value === 1 ? 1.015 : 1, { damping: 15, stiffness: 150 }) }],
    backgroundColor: passwordFocus.value === 1 ? colors.bg.surface : colors.bg.sunken,
    shadowColor: colors.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: withTiming(passwordFocus.value * 0.25, { duration: 150 }),
    shadowRadius: withTiming(passwordFocus.value * 8, { duration: 150 }),
  }));

  const handleLogin = useCallback(async () => {
    if (status === 'loading' || status === 'success') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStatus('loading');
    setErrorMessage('');

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (email.toLowerCase() === 'admin@supplyai.com' && (password === 'SupplyOS2024' || password === 'Supply123')) {
      setStatus('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Simulated session store
      // Expo Router redirect
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace('/');
    } else {
      setStatus('error');
      setErrorMessage('Invalid credentials. Check admin@supplyai.com / SupplyOS2024');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Trigger shake animation
      shakeOffset.value = withSequence(
        withSpring(-15, { damping: 3, stiffness: 200 }),
        withSpring(15, { damping: 3, stiffness: 200 }),
        withSpring(-10, { damping: 3, stiffness: 200 }),
        withSpring(10, { damping: 3, stiffness: 200 }),
        withSpring(0, { damping: 3, stiffness: 200 })
      );

      setStatus('idle');
    }
  }, [email, password, status]);

  const handlePressIn = useCallback(() => {
    buttonScale.value = withTiming(0.96, { duration: 100 });
  }, []);

  const handlePressOut = useCallback(() => {
    buttonScale.value = withSpring(1, anim.spring);
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Dot grid background */}
      <Svg style={StyleSheet.absoluteFill} opacity={0.4}>
        <Defs>
          <Pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <SvgCircle cx="1" cy="1" r="1" fill="rgba(15, 23, 42, 0.12)" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dots)" />
      </Svg>

      <ScanLine />

      <View style={[styles.inner, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <Path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={colors.accent.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M2 17L12 22L22 17" stroke={colors.accent.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M2 12L12 17L22 12" stroke={colors.accent.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={styles.title}>SUPPLYAI</Text>
            <Text style={styles.subtitle}>Autonomous Operations Command Center</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <Animated.View style={emailInputStyle}>
                <TextInput
                  style={styles.animatedInput}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  onFocus={() => { emailFocus.value = withTiming(1, { duration: 150 }); }}
                  onBlur={() => { emailFocus.value = withTiming(0, { duration: 150 }); }}
                  placeholder="admin@supplyai.com"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Animated.View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <Animated.View style={passwordInputStyle}>
                <TextInput
                  style={styles.animatedInput}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  onFocus={() => { passwordFocus.value = withTiming(1, { duration: 150 }); }}
                  onBlur={() => { passwordFocus.value = withTiming(0, { duration: 150 }); }}
                  placeholder="••••••••"
                  placeholderTextColor={colors.text.muted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Animated.View>
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {/* CTA Button */}
            <Animated.View style={buttonStyle}>
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.button,
                  status === 'success' && styles.buttonSuccess,
                  pressed && styles.buttonPressed
                ]}
                disabled={status === 'loading' || status === 'success'}
              >
                {status === 'idle' && (
                  <Text style={styles.buttonText}>SIGN IN TO COMMAND CENTER</Text>
                )}
                {status === 'loading' && (
                  <View style={styles.buttonRow}>
                    <ActivityIndicator size="small" color={colors.text.inverse} />
                    <Text style={styles.buttonText}>ESTABLISHING CONNECTION...</Text>
                  </View>
                )}
                {status === 'success' && (
                  <Text style={styles.buttonText}>✓ ACCESS GRANTED</Text>
                )}
              </Pressable>
            </Animated.View>

            {/* Link to register */}
            <Pressable onPress={() => router.replace('/(auth)/register')} style={{ marginTop: spacing.md, alignItems: 'center' }}>
              <Text style={styles.registerLinkText}>
                Don't have an account? <Text style={{ color: colors.accent.cyan, fontWeight: '700' }}>Sign Up →</Text>
              </Text>
            </Pressable>
          </View>

          {/* Footer details */}
          <Text style={styles.footer}>
            SECURE PORT PORTAL // v3.0-DAYLIGHT_GLASS
          </Text>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.root,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.bg.glass,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glass.border,
    padding: spacing.lg,
    shadowColor: colors.glass.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.glass.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    color: colors.text.muted,
    letterSpacing: 1,
  },
  animatedInput: {
    height: 48,
    paddingHorizontal: spacing.md,
    fontFamily: typography.body.fontFamily,
    color: colors.text.primary,
    fontSize: 14,
  },
  errorText: {
    fontFamily: typography.small.fontFamily,
    color: colors.accent.crimson,
    fontSize: 12,
    textAlign: 'center',
  },
  button: {
    height: 52,
    backgroundColor: colors.accent.cyan,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonSuccess: {
    backgroundColor: colors.accent.emerald,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontFamily: typography.monoBold.fontFamily,
    fontSize: 13,
    color: colors.text.inverse,
    letterSpacing: 1,
  },
  footer: {
    fontFamily: typography.monoSm.fontFamily,
    fontSize: 9,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
    letterSpacing: 0.5,
  },
  registerLinkText: {
    fontFamily: typography.monoSm.fontFamily,
    fontSize: 11,
    color: colors.text.muted,
  },
});
