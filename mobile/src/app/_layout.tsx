// src/app/_layout.tsx — Root layout: fonts, StatusBar, Stack navigator
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { Syne_500Medium, Syne_600SemiBold, Syne_700Bold } from '@expo-google-fonts/syne';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
    Syne_500Medium,
    Syne_600SemiBold,
    Syne_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent.cyan} />
        <Text style={styles.loadingText}>INITIALIZING COMMAND CENTER</Text>
        <StatusBar style="dark" translucent backgroundColor="transparent" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.root },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="agent" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="comparison" options={{ animation: 'fade' }} />
        <Stack.Screen name="metrics" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg.root,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: 'System',
    fontSize: 10,
    letterSpacing: 2,
    color: colors.text.muted,
    fontWeight: '700',
  },
});
