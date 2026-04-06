'use client';

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const [budget, setBudget] = useState('300');
  const [language, setLanguage] = useState('en');

  const handleSaveBudget = () => {
    // TODO: Save budget to context
  };

  const handleLogout = () => {
    // TODO: Implement logout
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Budget Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Budget</Text>
        <Text style={styles.sectionDescription}>Set your target spending for the week</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.budgetInput}
            placeholder="300"
            placeholderTextColor="#64748b"
            keyboardType="decimal-pad"
            value={budget}
            onChangeText={setBudget}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSaveBudget}>
          <Text style={styles.buttonText}>Save Budget</Text>
        </TouchableOpacity>
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language</Text>
        <Text style={styles.sectionDescription}>Choose your preferred language</Text>

        <View style={styles.languageOptions}>
          {[
            { code: 'en', label: 'English' },
            { code: 'es', label: 'Español' },
            { code: 'fr', label: 'Français' },
          ].map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                language === lang.code && styles.languageButtonSelected,
              ]}
              onPress={() => setLanguage(lang.code)}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  language === lang.code && styles.languageButtonTextSelected,
                ]}
              >
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>App: </Text>Leftover
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Version: </Text>1.0.0
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Purpose: </Text>The lazy budget app for Gen-Z
          </Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#0EA5E9',
    marginBottom: 16,
  },
  currencySymbol: {
    color: '#0EA5E9',
    fontSize: 20,
    fontWeight: '600',
    marginRight: 4,
  },
  budgetInput: {
    flex: 1,
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    paddingVertical: 8,
  },
  button: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  languageOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 8,
    alignItems: 'center',
  },
  languageButtonSelected: {
    borderColor: '#0EA5E9',
    backgroundColor: '#0EA5E920',
  },
  languageButtonText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  languageButtonTextSelected: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
  },
  infoText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#0EA5E9',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});