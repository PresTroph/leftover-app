'use client';

import { BudgetContext } from '@/src/context/BudgetContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const budgetContext = useContext(BudgetContext);
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [budgetInput, setBudgetInput] = useState(
    (budgetContext?.weeklyBudget || 300).toString()
  );

  const handleSaveBudget = () => {
    const newBudget = parseFloat(budgetInput);
    if (newBudget > 0 && budgetContext?.setBudget) {
      budgetContext.setBudget(newBudget);
      alert(t.save);
    }
  };

  const handleLanguageChange = (lang: 'en' | 'es' | 'fr') => {
    setLanguage(lang);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: useTheme().colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: useTheme().colors.primaryText }]}>{t.settings}</Text>
        </View>

        {/* Budget Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: useTheme().colors.secondaryText }]}>{t.weeklyBudget}</Text>
          <View style={[styles.card, { backgroundColor: useTheme().colors.cardBackground, borderColor: useTheme().colors.border }]}>
            <Text style={[styles.label, { color: useTheme().colors.primaryText }]}>{t.weeklyBudget}</Text>
            <View style={[styles.budgetInputContainer, { borderTopColor: useTheme().colors.border }]}>
              <Text style={[styles.currencySymbol, { color: useTheme().colors.accent }]}>$</Text>
              <TextInput
                style={[styles.budgetInput, { color: useTheme().colors.primaryText }]}
                placeholder="300.00"
                placeholderTextColor={useTheme().colors.secondaryText}
                keyboardType="decimal-pad"
                value={budgetInput}
                onChangeText={setBudgetInput}
              />
            </View>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: useTheme().colors.accent }]} onPress={handleSaveBudget}>
              <Text style={[styles.saveButtonText, { color: useTheme().colors.background }]}>{t.save}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: useTheme().colors.secondaryText }]}>{t.language}</Text>
          <View style={[styles.card, { backgroundColor: useTheme().colors.cardBackground, borderColor: useTheme().colors.border }]}>
            <View style={styles.preferenceRow}>
              <Text style={[styles.label, { color: useTheme().colors.primaryText }]}>{t.language}</Text>
              <View style={styles.languageSelector}>
                {[
                  { key: 'en', label: t.english },
                  { key: 'es', label: t.spanish },
                  { key: 'fr', label: t.french },
                ].map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.languageOption,
                      { borderColor: useTheme().colors.border, backgroundColor: useTheme().colors.cardBackground },
                      language === key && [styles.languageOptionActive, { borderColor: useTheme().colors.accent, backgroundColor: useTheme().colors.surface }],
                    ]}
                    onPress={() => handleLanguageChange(key as 'en' | 'es' | 'fr')}
                  >
                    <Text
                      style={[
                        styles.languageText,
                        { color: useTheme().colors.secondaryText },
                        language === key && [styles.languageTextActive, { color: useTheme().colors.accent }],
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.preferenceRow, styles.borderTop, { borderTopColor: useTheme().colors.border }]}>
              <Text style={[styles.label, { color: useTheme().colors.primaryText }]}>
                {isDarkMode ? t.darkMode : t.lightMode}
              </Text>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: useTheme().colors.secondaryText, true: useTheme().colors.accent }}
                thumbColor={useTheme().colors.primaryText}
              />
            </View>
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: useTheme().colors.secondaryText }]}>{t.about}</Text>
          <View style={[styles.card, { backgroundColor: useTheme().colors.cardBackground, borderColor: useTheme().colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: useTheme().colors.primaryText }]}>Leftover</Text>
              <Text style={[styles.infoValue, { color: useTheme().colors.secondaryText }]}>1.0.0</Text>
            </View>
            <View style={[styles.infoRow, styles.borderTop, { borderTopColor: useTheme().colors.border }]}>
              <Text style={[styles.infoLabel, { color: useTheme().colors.primaryText }]}>The lazy budget app</Text>
              <Text style={[styles.infoValue, { color: useTheme().colors.secondaryText }]}>for Gen-Z</Text>
            </View>
            <TouchableOpacity style={[styles.infoRow, styles.borderTop, { borderTopColor: useTheme().colors.border }]}>
              <Text style={[styles.linkText, { color: useTheme().colors.accent }]}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color={useTheme().colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: useTheme().colors.danger }]}>
            <Text style={[styles.logoutButtonText, { color: useTheme().colors.primaryText }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 4,
  },
  budgetInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  borderTop: {
    borderTopWidth: 1,
  },
  languageSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  languageOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  languageOptionActive: {
  },
  languageText: {
    fontSize: 12,
    fontWeight: '500',
  },
  languageTextActive: {
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 32,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});