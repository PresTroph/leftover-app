'use client';

import { useBudget } from '@/src/context/BudgetContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { formatMonthKey, getCurrentWeekNumber, getToday } from '@/src/engine/calculations';
import { ExpenseCategory } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
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

const CATEGORIES: { key: ExpenseCategory; emoji: string }[] = [
  { key: 'Food', emoji: '🍔' },
  { key: 'Transport', emoji: '🚗' },
  { key: 'Entertainment', emoji: '🎬' },
  { key: 'Utilities', emoji: '💡' },
  { key: 'Shopping', emoji: '🛍️' },
  { key: 'Other', emoji: '📌' },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { addTransaction, addExpenseToFirestore, budgetState } = useBudget();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('Food');

  const handleAddExpense = async () => {
    if (!amount || !description) {
      Alert.alert('', t.selectCategory);
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('', t.enterAmount);
      return;
    }

    const now = new Date().toISOString();
    const currentMonth = formatMonthKey(getToday());
    const resetDay = budgetState?.resetDay || 1;
    const weekNumber = getCurrentWeekNumber(resetDay);

    addTransaction({ amount: parsedAmount, description, category: selectedCategory, date: now });

    addExpenseToFirestore({
      userId: '', amount: parsedAmount, description,
      category: selectedCategory, date: now, weekNumber, month: currentMonth,
    }).catch((err: unknown) => console.error('Firestore write failed:', err));

    setAmount('');
    setDescription('');
    setSelectedCategory('Food');
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color={colors.accent} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.primaryText }]}>{t.addExpense}</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Amount */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>{t.expenseAmount}</Text>
              <View style={[styles.amountContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Text style={[styles.currencySymbol, { color: colors.accent }]}>$</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.primaryText }]}
                  placeholder={t.enterAmount}
                  placeholderTextColor={colors.tertiaryText}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>{t.description}</Text>
              <TextInput
                style={[styles.descriptionInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.primaryText }]}
                placeholder={t.enterDescription}
                placeholderTextColor={colors.tertiaryText}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>{t.category}</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(({ key, emoji }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryButton,
                      { backgroundColor: colors.glassBg, borderColor: colors.glassBorder },
                      selectedCategory === key && { borderColor: colors.accent, backgroundColor: colors.accentMuted },
                    ]}
                    onPress={() => setSelectedCategory(key)}
                  >
                    <Text style={styles.categoryEmoji}>{emoji}</Text>
                    <Text style={[styles.categoryLabel, { color: selectedCategory === key ? colors.accent : colors.secondaryText }]}>
                      {t[key.toLowerCase() as keyof typeof t] || key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Week Info */}
            {budgetState && (
              <View style={[styles.weekInfo, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}> 
                <Text style={[styles.weekInfoText, { color: colors.secondaryText }]}> 
                  Wk {budgetState.currentWeekNumber} · ${budgetState.currentWeekRemaining.toFixed(2)} {t.weekRemaining}
                </Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity style={styles.submitButton} onPress={handleAddExpense} activeOpacity={0.85}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <Ionicons name="add" size={20} color={colors.buttonText} />
                <Text style={[styles.submitText, { color: colors.buttonText }]}>{t.addExpense}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.glassBorder }]} onPress={() => router.back()}>
              <Text style={[styles.cancelText, { color: colors.secondaryText }]}>{t.cancel}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  section: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  amountContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingLeft: 16 },
  currencySymbol: { fontSize: 24, fontWeight: '700', marginRight: 4 },
  amountInput: { flex: 1, paddingVertical: 16, paddingHorizontal: 4, fontSize: 24, fontWeight: '600' },
  descriptionInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryButton: { width: '31%', aspectRatio: 1.1, borderWidth: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', gap: 6 },
  categoryEmoji: { fontSize: 26 },
  categoryLabel: { fontSize: 12, fontWeight: '600' },
  weekInfo: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 24, alignItems: 'center' },
  weekInfoText: { fontSize: 13, fontWeight: '500' },
  submitButton: { borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  submitText: { fontSize: 16, fontWeight: '700' },
  cancelButton: { paddingVertical: 14, borderWidth: 1, borderRadius: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600' },
});
