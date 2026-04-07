'use client';

import { BudgetContext } from '@/src/context/BudgetContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = {
  Food: '🍔',
  Transport: '🚗',
  Entertainment: '🎬',
  Utilities: '💡',
  Shopping: '🛍️',
  Other: '📌',
};

export default function AddExpenseScreen() {
  const router = useRouter();
  const budgetContext = useContext(BudgetContext);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');

  const handleAddExpense = () => {
    if (!amount || !description) {
      alert(t.selectCategory); // Placeholder for validation message
      return;
    }

    if (budgetContext?.addTransaction) {
      budgetContext.addTransaction({
        amount: parseFloat(amount),
        description,
        category: selectedCategory,
        date: new Date().toISOString(),
      });

      // Reset form and go back
      setAmount('');
      setDescription('');
      setSelectedCategory('Food');
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={colors.accent} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.primaryText }]}>{t.addExpense}</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.primaryText }]}>{t.expenseAmount}</Text>
            <View style={[styles.amountInputContainer, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.currencySymbol, { color: colors.accent }]}>$</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.primaryText }]}
                placeholder={t.enterAmount}
                placeholderTextColor={colors.secondaryText}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.primaryText }]}>{t.description}</Text>
            <TextInput
              style={[styles.descriptionInput, { borderColor: colors.border, backgroundColor: colors.cardBackground, color: colors.primaryText }]}
              placeholder={t.enterDescription}
              placeholderTextColor={colors.secondaryText}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Category Selector */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.primaryText }]}>{t.category}</Text>
            <View style={styles.categoryGrid}>
              {Object.entries(CATEGORIES).map(([category, emoji]) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    { borderColor: colors.border, backgroundColor: colors.cardBackground },
                    selectedCategory === category && [styles.categoryButtonActive, { borderColor: colors.accent, backgroundColor: colors.surface }],
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={styles.categoryEmoji}>{emoji}</Text>
                  <Text style={[styles.categoryLabel, { color: colors.secondaryText }]}>
                    {t[category.toLowerCase() as keyof typeof t] || category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Buttons */}
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={handleAddExpense}>
            <Text style={[styles.addButtonText, { color: colors.background }]}>{t.addExpense}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => router.back()}>
            <Text style={[styles.cancelButtonText, { color: colors.secondaryText }]}>{t.cancel}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 20,
    fontWeight: '600',
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: '30%',
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  categoryButtonActive: {
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  addButton: {
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});