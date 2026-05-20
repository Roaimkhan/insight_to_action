import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, runOnJS, SharedValue
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, Pattern, Circle as SvgCircle, Rect, Path } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius, anim } from '../../constants/spacing';
import ScanLine from '../../components/ui/ScanLine';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Reanimated values for visual effects
  const cardTranslateY = useSharedValue(50);
  const cardOpacity = useSharedValue(0);
  const shakeOffset = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const nameFocus = useSharedValue(0);
  const emailFocus = useSharedValue(0);
  const passwordFocus = useSharedValue(0);
  const confirmFocus = useSharedValue(0);

  // Validation checks
  const isNameValid = name.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;
  const isConfirmValid = confirmPassword === password && confirmPassword.length > 0;

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

  // Style generators for inputs highlighting real-time validation status (green for valid, red for invalid, cyan on active focus)
  const getInputStyle = (focusedVal: SharedValue<number>, value: string, isValid: boolean) => {
    return useAnimatedStyle(() => {
      let borderColor: string = colors.border.default;
      let shadowColor: string = colors.accent.cyan;
      let shadowOpacity = focusedVal.value * 0.25;

      if (value.length > 0) {
        if (isValid) {
          borderColor = colors.accent.emerald;
          shadowColor = colors.accent.emerald;
          shadowOpacity = 0.25;
        } else {
          borderColor = colors.accent.crimson;
          shadowColor = colors.accent.crimson;
          shadowOpacity = 0.25;
        }
      }

      if (focusedVal.value === 1) {
        borderColor = colors.accent.cyan;
        shadowColor = colors.accent.cyan;
        shadowOpacity = 0.35;
      }

      return {
        borderColor,
        borderWidth: 1,
        borderRadius: radius.md,
        transform: [{ scale: withSpring(focusedVal.value === 1 ? 1.015 : 1, { damping: 15, stiffness: 150 }) }],
        backgroundColor: focusedVal.value === 1 ? colors.bg.surface : colors.bg.sunken,
        shadowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: withTiming(shadowOpacity, { duration: 150 }),
        shadowRadius: withTiming(focusedVal.value === 1 ? 8 : 4, { duration: 150 }),
      };
    });
  };

  const nameInputStyle = getInputStyle(nameFocus, name, isNameValid);
  const emailInputStyle = getInputStyle(emailFocus, email, isEmailValid);
  const passwordInputStyle = getInputStyle(passwordFocus, password, isPasswordValid);
  const confirmInputStyle = getInputStyle(confirmFocus, confirmPassword, isConfirmValid);

  const handleRegister = useCallback(async () => {
    if (status === 'loading' || status === 'success') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
      setStatus('error');
      setErrorMessage('Please ensure all fields are valid.');
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
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1800));

    setStatus('success');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.replace('/');
  }, [name, email, password, confirmPassword, status]);

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
            <Text style={styles.title}>Register</Text>
            <Text style={styles.subtitle}>Create a new Operator Account</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <Animated.View style={nameInputStyle}>
                <TextInput
                  style={styles.animatedInput}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  onFocus={() => { nameFocus.value = withTiming(1, { duration: 150 }); }}
                  onBlur={() => { nameFocus.value = withTiming(0, { duration: 150 }); }}
                  placeholder="Operator Name"
                  placeholderTextColor={colors.text.muted}
                  autoCorrect={false}
                />
              </Animated.View>
            </View>

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
              <Text style={styles.inputLabel}>PASSWORD (MIN 8 CHARS)</Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <Animated.View style={confirmInputStyle}>
                <TextInput
                  style={styles.animatedInput}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  onFocus={() => { confirmFocus.value = withTiming(1, { duration: 150 }); }}
                  onBlur={() => { confirmFocus.value = withTiming(0, { duration: 150 }); }}
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
                onPress={handleRegister}
                style={({ pressed }) => [
                  styles.button,
                  status === 'success' && styles.buttonSuccess,
                  pressed && styles.buttonPressed
                ]}
                disabled={status === 'loading' || status === 'success'}
              >
                {status === 'idle' && (
                  <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
                )}
                {status === 'loading' && (
                  <View style={styles.buttonRow}>
                    <ActivityIndicator size="small" color={colors.text.inverse} />
                    <Text style={styles.buttonText}>INITIALIZING COMMAND CENTER...</Text>
                  </View>
                )}
                {status === 'success' && (
                  <Text style={styles.buttonText}>✓ ACCESS GRANTED</Text>
                )}
              </Pressable>
            </Animated.View>
          </View>

          {/* Link back to login */}
          <Pressable onPress={() => router.replace('/(auth)/login')} style={{ marginTop: spacing.md, alignItems: 'center' }}>
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={{ color: colors.accent.cyan, fontWeight: '700' }}>Sign In →</Text>
            </Text>
          </Pressable>
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
    marginBottom: spacing.md,
  },
  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    shadowColor: colors.glass.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  form: {
    gap: spacing.sm,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 9,
    color: colors.text.muted,
    letterSpacing: 1,
  },
  animatedInput: {
    height: 44,
    paddingHorizontal: spacing.md,
    fontFamily: typography.body.fontFamily,
    color: colors.text.primary,
    fontSize: 13,
  },
  errorText: {
    fontFamily: typography.small.fontFamily,
    color: colors.accent.crimson,
    fontSize: 12,
    textAlign: 'center',
  },
  button: {
    height: 48,
    backgroundColor: colors.accent.cyan,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: spacing.md,
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
    fontSize: 12,
    color: colors.text.inverse,
    letterSpacing: 1,
  },
  loginLinkText: {
    fontFamily: typography.monoSm.fontFamily,
    fontSize: 11,
    color: colors.text.muted,
  },
});
