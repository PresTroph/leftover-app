'use client';

import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { signOut, user } = useAuth();

  const handleLogout = () => {
    const doLogout = async () => {
      await signOut();
      router.replace('/');
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`${t.logout}\n${t.logoutConfirm}`)) {
        doLogout();
      }
    } else {
      Alert.alert(t.logout, t.logoutConfirm, [
        { text: t.cancel, style: 'cancel' },
        { text: t.logout, style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.primaryText }]}>{t.settings}</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>

          {user && (
            <Text style={[styles.email, { color: colors.secondaryText }]}>{user.email}</Text>
          )}

          {/* Appearance */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.tertiaryText }]}>{t.appearance}</Text>
            <View style={[styles.card, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={colors.accent} />
                  <Text style={[styles.settingLabel, { color: colors.primaryText }]}>
                    {isDarkMode ? t.darkMode : t.lightMode}
                  </Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.tertiaryText, true: colors.accent }}
                  thumbColor={colors.primaryText}
                />
              </View>
            </View>
          </View>

          {/* Language */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.tertiaryText }]}>{t.language}</Text>
            <View style={[styles.card, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
              {(['en', 'es', 'fr'] as const).map((lang, idx: number) => {
                const labels = { en: t.english, es: t.spanish, fr: t.french };
                const flags = { en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷' };
                return (
                  <React.Fragment key={lang}>
                    {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
                    <TouchableOpacity
                      style={styles.settingRow}
                      onPress={() => setLanguage(lang)}
                    >
                      <View style={styles.settingLeft}>
                        <Text style={styles.flag}>{flags[lang]}</Text>
                        <Text style={[styles.settingLabel, { color: colors.primaryText }]}>{labels[lang]}</Text>
                      </View>
                      {language === lang && (
                        <Ionicons name="checkmark" size={20} color={colors.accent} />
                      )}
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.tertiaryText }]}>{t.about}</Text>
            <View style={[styles.card, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.primaryText }]}>Leftover</Text>
                <Text style={[styles.settingValue, { color: colors.secondaryText }]}>1.0.0</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <TouchableOpacity style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.accent }]}>{t.privacyPolicy}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.dangerMuted }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>{t.logout}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  email: { fontSize: 14, marginBottom: 28 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  settingValue: { fontSize: 14 },
  flag: { fontSize: 18 },
  divider: { height: 1, marginHorizontal: 16 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 8, marginTop: 8 },
  logoutText: { fontSize: 15, fontWeight: '600' },
});
