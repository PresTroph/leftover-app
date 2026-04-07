'use client';

import { useAuth } from '@/src/context/AuthContext';
import { useBudget } from '@/src/context/BudgetContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
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
  const { budgetState, incomes, constants, savings } = useBudget();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  };

  const handleLanguageChange = (lang: 'en' | 'es' | 'fr') => {
    setLanguage(lang);
  };

  // Summary stats for setup sections
  const incomeCount = incomes.length;
  const constantsCount = constants.length;
  const totalMonthlyIncome = budgetState?.totalMonthlyIncome || 0;
  const totalMonthlyConstants = budgetState?.totalMonthlyConstants || 0;
  const savingsTarget = budgetState?.savingsTarget || savings?.monthlyTarget || 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.primaryText }]}>{t.settings}</Text>
          {user && (
            <Text style={[styles.userEmail, { color: colors.secondaryText }]}>{user.email}</Text>
          )}
        </View>

        {/* ─── Financial Setup ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>FINANCIAL SETUP</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            {/* Income */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => router.push('/income-setup')}
            >
              <View style={styles.settingsRowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: colors.accent + '20' }]}> 
                  <Ionicons name="wallet-outline" size={20} color={colors.accent} />
                </View>
                <View>
                  <Text style={[styles.settingsLabel, { color: colors.primaryText }]}>Income Sources</Text>
                  <Text style={[styles.settingsValue, { color: colors.secondaryText }]}> 
                    {incomeCount > 0 ? `${incomeCount} source${incomeCount > 1 ? 's' : ''} · $${totalMonthlyIncome.toFixed(0)}/mo` : 'Not set up yet'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Constants */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => router.push('/constants-setup')}
            >
              <View style={styles.settingsRowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: colors.warning + '20' }]}> 
                  <Ionicons name="repeat-outline" size={20} color={colors.warning} />
                </View>
                <View>
                  <Text style={[styles.settingsLabel, { color: colors.primaryText }]}>Constants & Necessities</Text>
                  <Text style={[styles.settingsValue, { color: colors.secondaryText }]}> 
                    {constantsCount > 0 ? `${constantsCount} item${constantsCount > 1 ? 's' : ''} · $${totalMonthlyConstants.toFixed(0)}/mo` : 'Not set up yet'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Savings */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => router.push('/savings-setup')}
            >
              <View style={styles.settingsRowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#10b981' + '20' }]}> 
                  <Ionicons name="trending-up-outline" size={20} color="#10b981" />
                </View>
                <View>
                  <Text style={[styles.settingsLabel, { color: colors.primaryText }]}>Savings Goal</Text>
                  <Text style={[styles.settingsValue, { color: colors.secondaryText }]}> 
                    {savingsTarget > 0 ? `$${savingsTarget.toFixed(0)}/mo target` : 'Not set up yet'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Budget Overview ─── */}
        {budgetState && budgetState.monthlyAvailable > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>BUDGET SUMMARY</Text>
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Monthly Income</Text>
                <Text style={[styles.summaryValue, { color: colors.accent }]}>${budgetState.totalMonthlyIncome.toFixed(2)}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Monthly Constants</Text>
                <Text style={[styles.summaryValue, { color: colors.warning }]}>-${budgetState.totalMonthlyConstants.toFixed(2)}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.primaryText, fontWeight: '700' }]}>Available Budget</Text>
                <Text style={[styles.summaryValue, { color: colors.primaryText, fontWeight: '700' }]}>${budgetState.monthlyAvailable.toFixed(2)}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Weekly Budget</Text>
                <Text style={[styles.summaryValue, { color: colors.accent }]}>${budgetState.weeklyBudget.toFixed(2)}/wk</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── Preferences ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{t.language}</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            <View style={styles.settingsRow}>
              <Text style={[styles.settingsLabel, { color: colors.primaryText }]}>{t.language}</Text>
              <View style={styles.languageSelector}>
                {[
                  { key: 'en' as const, label: t.english },
                  { key: 'es' as const, label: t.spanish },
                  { key: 'fr' as const, label: t.french },
                ].map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.languageOption,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      language === key && { borderColor: colors.accent, backgroundColor: colors.accent + '20' },
                    ]}
                    onPress={() => handleLanguageChange(key)}
                  >
                    <Text
                      style={[
                        styles.languageText,
                        { color: colors.secondaryText },
                        language === key && { color: colors.accent },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.settingsRow}>
              <Text style={[styles.settingsLabel, { color: colors.primaryText }]}> 
                {isDarkMode ? t.darkMode : t.lightMode}
              </Text>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.secondaryText, true: colors.accent }}
                thumbColor={colors.primaryText}
              />
            </View>
          </View>
        </View>

        {/* ─── About ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{t.about}</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            <View style={styles.settingsRow}>
              <Text style={[styles.settingsLabel, { color: colors.primaryText }]}>Leftover</Text>
              <Text style={[styles.settingsValue, { color: colors.secondaryText }]}>1.0.0</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.settingsRow}>
              <Text style={[styles.settingsLabel, { color: colors.primaryText }]}>The lazy budget app</Text>
              <Text style={[styles.settingsValue, { color: colors.secondaryText }]}>for Gen-Z</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.settingsRow}>
              <Text style={[styles.settingsLabel, { color: colors.accent }]}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Logout ─── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.danger }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16 },
  header: { paddingHorizontal: 16, marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  userEmail: { fontSize: 14, marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  settingsRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  settingsLabel: { fontSize: 14, fontWeight: '600' },
  settingsValue: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  languageSelector: { flexDirection: 'row', gap: 8 },
  languageOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  languageText: { fontSize: 12, fontWeight: '500' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8, marginBottom: 32 },
  logoutButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
