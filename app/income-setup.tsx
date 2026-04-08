// ============================================================
// LEFTOVER - Income Setup Screen
// Add, edit, delete income sources
// ============================================================

'use client';

import { useBudget } from '@/src/context/BudgetContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { DayOfWeek, Income, IncomeFrequency } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
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

const FREQUENCIES: { key: IncomeFrequency; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'bi-weekly', label: 'Bi-Weekly' },
  { key: 'semi-monthly', label: 'Semi-Monthly' },
  { key: 'monthly', label: 'Monthly' },
];

const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

export default function IncomeSetupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { incomes, addIncome, deleteIncome } = useBudget();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<IncomeFrequency>('bi-weekly');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('friday');
  const [monthlyDate, setMonthlyDate] = useState('1');
  const [semiDate1, setSemiDate1] = useState('1');
  const [semiDate2, setSemiDate2] = useState('15');
  const [isLocked, setIsLocked] = useState(false);

  const resetForm = () => {
    setName('');
    setAmount('');
    setFrequency('bi-weekly');
    setDayOfWeek('friday');
    setMonthlyDate('1');
    setSemiDate1('1');
    setSemiDate2('15');
    setIsLocked(false);
    setShowForm(false);
  };

  const handleAdd = async () => {
    if (!name.trim() || !amount.trim()) {
      Alert.alert('Error', 'Please fill in name and amount');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await addIncome({
        userId: '',
        name: name.trim(),
        type: frequency,
        amount: parsedAmount,
        semiMonthlyDates: frequency === 'semi-monthly' ? [parseInt(semiDate1), parseInt(semiDate2)] : null,
        dayOfWeek: (frequency === 'weekly' || frequency === 'bi-weekly') ? dayOfWeek : null,
        monthlyDate: frequency === 'monthly' ? parseInt(monthlyDate) : null,
        isLocked,
        lockUntilDate: null,
        active: true,
      });
      resetForm();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add income');
    }
  };

  const handleDelete = (incomeId: string, incomeName: string) => {
    Alert.alert(
      'Delete Income',
      `Remove "${incomeName}" from your income sources?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteIncome(incomeId),
        },
      ]
    );
  };

  const getFrequencyLabel = (freq: IncomeFrequency) => {
    return FREQUENCIES.find((f) => f.key === freq)?.label || freq;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={colors.accent} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Income Sources</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Existing Income Sources */}
          {incomes.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>YOUR INCOME</Text>
              {incomes.map((income: Income) => (
                <View
                  key={income.id}
                  style={[styles.incomeCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                >
                  <View style={styles.incomeInfo}>
                    <Text style={[styles.incomeName, { color: colors.primaryText }]}>{income.name}</Text>
                    <Text style={[styles.incomeDetail, { color: colors.secondaryText }]}>
                      ${income.amount.toFixed(2)} · {getFrequencyLabel(income.type)}
                    </Text>
                    <Text style={[styles.incomeMonthly, { color: colors.accent }]}>
                      ${income.monthlyTotal.toFixed(2)}/month
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(income.id, income.name)}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Add Income Button or Form */}
          {!showForm ? (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowForm(true)}
            >
              <Ionicons name="add" size={20} color={colors.background} />
              <Text style={[styles.addButtonText, { color: colors.background }]}>Add Income Source</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.formCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.primaryText }]}>New Income Source</Text>

              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>NAME</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.primaryText }]}
                  placeholder='e.g., "Main Job", "Freelance"'
                  placeholderTextColor={colors.secondaryText}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>AMOUNT (PER PERIOD)</Text>
                <View style={[styles.amountContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.currencySymbol, { color: colors.accent }]}>$</Text>
                  <TextInput
                    style={[styles.amountInput, { color: colors.primaryText }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.secondaryText}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>
              </View>

              {/* Frequency */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>FREQUENCY</Text>
                <View style={styles.frequencyGrid}>
                  {FREQUENCIES.map((freq) => (
                    <TouchableOpacity
                      key={freq.key}
                      style={[
                        styles.frequencyButton,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                        frequency === freq.key && { borderColor: colors.accent, backgroundColor: colors.accent + '20' },
                      ]}
                      onPress={() => setFrequency(freq.key)}
                    >
                      <Text
                        style={[
                          styles.frequencyText,
                          { color: colors.secondaryText },
                          frequency === freq.key && { color: colors.accent },
                        ]}
                      >
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Day of Week (for weekly / bi-weekly) */}
              {(frequency === 'weekly' || frequency === 'bi-weekly') && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>PAYDAY</Text>
                  <View style={styles.dayGrid}>
                    {DAYS_OF_WEEK.map((day) => (
                      <TouchableOpacity
                        key={day.key}
                        style={[
                          styles.dayButton,
                          { borderColor: colors.border, backgroundColor: colors.surface },
                          dayOfWeek === day.key && { borderColor: colors.accent, backgroundColor: colors.accent + '20' },
                        ]}
                        onPress={() => setDayOfWeek(day.key)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            { color: colors.secondaryText },
                            dayOfWeek === day.key && { color: colors.accent },
                          ]}
                        >
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Monthly Date */}
              {frequency === 'monthly' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>DAY OF MONTH</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.primaryText }]}
                    placeholder="1-31"
                    placeholderTextColor={colors.secondaryText}
                    keyboardType="number-pad"
                    value={monthlyDate}
                    onChangeText={setMonthlyDate}
                  />
                </View>
              )}

              {/* Semi-monthly Dates */}
              {frequency === 'semi-monthly' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>PAY DATES (TWO DAYS PER MONTH)</Text>
                  <View style={styles.semiRow}>
                    <TextInput
                      style={[styles.semiInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.primaryText }]}
                      placeholder="1st date"
                      placeholderTextColor={colors.secondaryText}
                      keyboardType="number-pad"
                      value={semiDate1}
                      onChangeText={setSemiDate1}
                    />
                    <Text style={[styles.semiAnd, { color: colors.secondaryText }]}>&</Text>
                    <TextInput
                      style={[styles.semiInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.primaryText }]}
                      placeholder="2nd date"
                      placeholderTextColor={colors.secondaryText}
                      keyboardType="number-pad"
                      value={semiDate2}
                      onChangeText={setSemiDate2}
                    />
                  </View>
                </View>
              )}

              {/* Lock Toggle */}
              <TouchableOpacity
                style={styles.lockRow}
                onPress={() => setIsLocked(!isLocked)}
              >
                <Ionicons
                  name={isLocked ? 'lock-closed' : 'lock-open-outline'}
                  size={20}
                  color={isLocked ? colors.accent : colors.secondaryText}
                />
                <Text style={[styles.lockText, { color: colors.primaryText }]}>
                  Lock income (prevent changes)
                </Text>
              </TouchableOpacity>

              {/* Form Buttons */}
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.accent }]}
                  onPress={handleAdd}
                >
                  <Text style={[styles.saveButtonText, { color: colors.background }]}>Add Income</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={resetForm}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.secondaryText }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  incomeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  incomeInfo: { flex: 1 },
  incomeName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  incomeDetail: { fontSize: 13, marginBottom: 2 },
  incomeMonthly: { fontSize: 14, fontWeight: '600' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8, marginBottom: 24 },
  addButtonText: { fontSize: 16, fontWeight: '600' },
  formCard: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  formTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  amountContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingLeft: 14 },
  currencySymbol: { fontSize: 20, fontWeight: '700', marginRight: 4 },
  amountInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 4, fontSize: 20, fontWeight: '600' },
  frequencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  frequencyButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  frequencyText: { fontSize: 13, fontWeight: '600' },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  dayText: { fontSize: 13, fontWeight: '600' },
  semiRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  semiInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, textAlign: 'center' },
  semiAnd: { fontSize: 16, fontWeight: '600' },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, paddingVertical: 8 },
  lockText: { fontSize: 14 },
  formButtons: { gap: 8 },
  saveButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '600' },
  cancelButton: { paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelButtonText: { fontSize: 14, fontWeight: '600' },
});
