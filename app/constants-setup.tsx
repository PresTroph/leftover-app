'use client';

import { useBudget } from '@/src/context/BudgetContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ConstantCategory, ConstantFrequency, DayOfWeek } from '@/src/types';
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

const CATEGORIES: { key: ConstantCategory; label: string; emoji: string }[] = [
  { key: 'rent', label: 'Rent', emoji: '🏠' },
  { key: 'mortgage', label: 'Mortgage', emoji: '🏡' },
  { key: 'groceries', label: 'Groceries', emoji: '🛒' },
  { key: 'utilities', label: 'Utilities', emoji: '💡' },
  { key: 'transport', label: 'Transport', emoji: '🚗' },
  { key: 'insurance', label: 'Insurance', emoji: '🛡️' },
  { key: 'subscriptions', label: 'Subscriptions', emoji: '📱' },
  { key: 'phone', label: 'Phone', emoji: '📞' },
  { key: 'internet', label: 'Internet', emoji: '🌐' },
  { key: 'childcare', label: 'Childcare', emoji: '👶' },
  { key: 'debt', label: 'Debt', emoji: '💳' },
  { key: 'other', label: 'Other', emoji: '📌' },
];

const FREQUENCIES: { key: ConstantFrequency; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'bi-weekly', label: 'Bi-Weekly' },
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

export default function ConstantsSetupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { constants, addConstant, deleteConstant } = useBudget();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<ConstantFrequency>('monthly');
  const [category, setCategory] = useState<ConstantCategory>('rent');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('monday');
  const [dueDate, setDueDate] = useState('1');

  const resetForm = () => {
    setName('');
    setAmount('');
    setFrequency('monthly');
    setCategory('rent');
    setDayOfWeek('monday');
    setDueDate('1');
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
      await addConstant({
        userId: '',
        name: name.trim(),
        amount: parsedAmount,
        frequency,
        dayOfWeek: (frequency === 'weekly' || frequency === 'bi-weekly') ? dayOfWeek : null,
        dueDate: frequency === 'monthly' ? parseInt(dueDate) : null,
        category,
        active: true,
      });
      resetForm();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add constant');
    }
  };

  const handleDelete = (id: string, constName: string) => {
    Alert.alert(
      'Delete Constant',
      `Remove "${constName}" from your recurring expenses?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteConstant(id) },
      ]
    );
  };

  const getCategoryEmoji = (cat: ConstantCategory) => {
    return CATEGORIES.find((c) => c.key === cat)?.emoji || '📌';
  };

  const totalMonthly = constants
    .filter((c) => c.active)
    .reduce((sum, c) => sum + (c.monthlyTotal || 0), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={colors.accent} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Constants & Necessities</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Monthly Total */}
          {constants.length > 0 && (
            <View style={[styles.totalCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
              <Text style={[styles.totalLabel, { color: colors.secondaryText }]}>TOTAL MONTHLY CONSTANTS</Text>
              <Text style={[styles.totalAmount, { color: colors.warning }]}>${totalMonthly.toFixed(2)}</Text>
            </View>
          )}

          {/* Existing Constants */}
          {constants.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>YOUR RECURRING EXPENSES</Text>
              {constants.map((c) => (
                <View key={c.id} style={[styles.constCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
                  <Text style={styles.constEmoji}>{getCategoryEmoji(c.category)}</Text>
                  <View style={styles.constInfo}>
                    <Text style={[styles.constName, { color: colors.primaryText }]}>{c.name}</Text>
                    <Text style={[styles.constDetail, { color: colors.secondaryText }]}> 
                      ${c.amount.toFixed(2)} · {c.frequency} → ${c.monthlyTotal.toFixed(2)}/mo
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(c.id, c.name)}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Add Button or Form */}
          {!showForm ? (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowForm(true)}
            >
              <Ionicons name="add" size={20} color={colors.background} />
              <Text style={[styles.addButtonText, { color: colors.background }]}>Add Constant</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.formCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
              <Text style={[styles.formTitle, { color: colors.primaryText }]}>New Recurring Expense</Text>

              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>NAME</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.primaryText }]}
                  placeholder='e.g., "Rent", "MetroCard"'
                  placeholderTextColor={colors.secondaryText}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>AMOUNT</Text>
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

              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>CATEGORY</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.categoryButton,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                        category === cat.key && { borderColor: colors.accent, backgroundColor: colors.accent + '20' },
                      ]}
                      onPress={() => setCategory(cat.key)}
                    >
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.categoryLabel, { color: category === cat.key ? colors.accent : colors.secondaryText }]}> 
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
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
                      <Text style={[styles.frequencyText, { color: frequency === freq.key ? colors.accent : colors.secondaryText }]}> 
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Day of Week (weekly/bi-weekly) */}
              {(frequency === 'weekly' || frequency === 'bi-weekly') && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>DAY OF WEEK</Text>
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
                        <Text style={[styles.dayText, { color: dayOfWeek === day.key ? colors.accent : colors.secondaryText }]}> 
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Due Date (monthly) */}
              {frequency === 'monthly' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>DUE DATE (DAY OF MONTH)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.primaryText }]}
                    placeholder="1-31"
                    placeholderTextColor={colors.secondaryText}
                    keyboardType="number-pad"
                    value={dueDate}
                    onChangeText={setDueDate}
                  />
                </View>
              )}

              {/* Buttons */}
              <View style={styles.formButtons}>
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={handleAdd}>
                  <Text style={[styles.saveButtonText, { color: colors.background }]}>Add Constant</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={resetForm}>
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
  totalCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20, alignItems: 'center' },
  totalLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  totalAmount: { fontSize: 28, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  constCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
  constEmoji: { fontSize: 24 },
  constInfo: { flex: 1 },
  constName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  constDetail: { fontSize: 12 },
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
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, gap: 4 },
  categoryEmoji: { fontSize: 16 },
  categoryLabel: { fontSize: 12, fontWeight: '500' },
  frequencyGrid: { flexDirection: 'row', gap: 8 },
  frequencyButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  frequencyText: { fontSize: 13, fontWeight: '600' },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  dayText: { fontSize: 13, fontWeight: '600' },
  formButtons: { gap: 8, marginTop: 4 },
  saveButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '600' },
  cancelButton: { paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelButtonText: { fontSize: 14, fontWeight: '600' },
});
