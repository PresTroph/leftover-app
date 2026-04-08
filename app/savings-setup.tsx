// ============================================================
// LEFTOVER - Savings Setup Screen
// ============================================================

'use client';

import { useBudget } from '@/src/context/BudgetContext';
import { useTheme } from '@/src/context/ThemeContext';
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

export default function SavingsSetupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { savings, setSavings, updateSavings, addToSavings, withdrawFromSavings, budgetState } = useBudget();

  const [targetType, setTargetType] = useState<'fixed' | 'percentage'>(savings?.targetType || 'fixed');
  const [monthlyTarget, setMonthlyTarget] = useState(savings?.monthlyTarget?.toString() || '');
  const [percentage, setPercentage] = useState(savings?.targetPercentage?.toString() || '10');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const handleSaveGoal = async () => {
    const target = targetType === 'fixed' ? parseFloat(monthlyTarget) : 0;
    const pct = targetType === 'percentage' ? parseFloat(percentage) : null;

    if (targetType === 'fixed' && (isNaN(target) || target <= 0)) {
      Alert.alert('Error', 'Please enter a valid savings target');
      return;
    }
    if (targetType === 'percentage' && (!pct || isNaN(pct) || pct <= 0 || pct > 100)) {
      Alert.alert('Error', 'Please enter a valid percentage (1-100)');
      return;
    }

    try {
      if (savings) {
        await updateSavings({
          id: 'main',
          monthlyTarget: targetType === 'fixed' ? target : 0,
          targetType,
          targetPercentage: pct,
        });
      } else {
        await setSavings({
          userId: '',
          currentAmount: 0,
          monthlyTarget: targetType === 'fixed' ? target : 0,
          targetType,
          targetPercentage: pct,
          isLocked: false,
        });
      }
      Alert.alert('Saved', 'Savings goal updated!');
    } catch (err: unknown) {
      Alert.alert('Error', (err instanceof Error ? err.message : "Something went wrong") || 'Failed to save');
    }
  };

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    try {
      await addToSavings(amt);
      setDepositAmount('');
      Alert.alert('Done', `$${amt.toFixed(2)} added to savings`);
    } catch (err: unknown) {
      Alert.alert('Error', (err instanceof Error ? err.message : "Something went wrong"));
    }
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    try {
      await withdrawFromSavings(amt);
      setWithdrawAmount('');
      Alert.alert('Done', `$${amt.toFixed(2)} withdrawn from savings`);
    } catch (err: unknown) {
      Alert.alert('Error', (err instanceof Error ? err.message : "Something went wrong"));
    }
  };

  const handleToggleLock = async () => {
    if (!savings) return;
    try {
      await updateSavings({ id: 'main', isLocked: !savings.isLocked });
    } catch (err: unknown) {
      Alert.alert('Error', (err instanceof Error ? err.message : "Something went wrong"));
    }
  };

  const currentAmount = savings?.currentAmount || 0;
  const target = budgetState?.savingsTarget || savings?.monthlyTarget || 0;
  const progressPercent = target > 0 ? Math.min((currentAmount / target) * 100, 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={colors.accent} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Savings Goal</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Current Savings Display */}
          {savings && (
            <View style={[styles.progressCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.progressLabel, { color: colors.secondaryText }]}>CURRENT SAVINGS</Text>
              <Text style={[styles.progressAmount, { color: colors.accent }]}>${currentAmount.toFixed(2)}</Text>
              {target > 0 && (
                <>
                  <Text style={[styles.progressTarget, { color: colors.secondaryText }]}>
                    of ${target.toFixed(2)} goal
                  </Text>
                  <View style={[styles.progressBarContainer, { backgroundColor: colors.surface }]}>
                    <View
                      style={[styles.progressBar, { width: `${progressPercent}%`, backgroundColor: colors.accent }]}
                    />
                  </View>
                  <Text style={[styles.progressPercent, { color: colors.secondaryText }]}>
                    {progressPercent.toFixed(0)}% complete
                  </Text>
                </>
              )}

              {/* Lock Toggle */}
              <TouchableOpacity style={styles.lockRow} onPress={handleToggleLock}>
                <Ionicons
                  name={savings.isLocked ? 'lock-closed' : 'lock-open-outline'}
                  size={20}
                  color={savings.isLocked ? colors.accent : colors.secondaryText}
                />
                <Text style={[styles.lockText, { color: colors.primaryText }]}>
                  {savings.isLocked ? 'Savings locked (tap to unlock)' : 'Savings unlocked (tap to lock)'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Deposit / Withdraw */}
          {savings && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>MANAGE SAVINGS</Text>

              {/* Deposit */}
              <View style={[styles.actionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <Text style={[styles.actionLabel, { color: colors.primaryText }]}>Add to Savings</Text>
                <View style={styles.actionRow}>
                  <View style={[styles.actionInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.actionCurrency, { color: colors.accent }]}>$</Text>
                    <TextInput
                      style={[styles.actionInput, { color: colors.primaryText }]}
                      placeholder="0.00"
                      placeholderTextColor={colors.secondaryText}
                      keyboardType="decimal-pad"
                      value={depositAmount}
                      onChangeText={setDepositAmount}
                    />
                  </View>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent }]} onPress={handleDeposit}>
                    <Text style={[styles.actionButtonText, { color: colors.background }]}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Withdraw */}
              {!savings.isLocked && (
                <View style={[styles.actionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                  <Text style={[styles.actionLabel, { color: colors.primaryText }]}>Withdraw from Savings</Text>
                  <View style={styles.actionRow}>
                    <View style={[styles.actionInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.actionCurrency, { color: colors.warning }]}>$</Text>
                      <TextInput
                        style={[styles.actionInput, { color: colors.primaryText }]}
                        placeholder="0.00"
                        placeholderTextColor={colors.secondaryText}
                        keyboardType="decimal-pad"
                        value={withdrawAmount}
                        onChangeText={setWithdrawAmount}
                      />
                    </View>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.warning }]} onPress={handleWithdraw}>
                      <Text style={[styles.actionButtonText, { color: colors.background }]}>Withdraw</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Goal Setup */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>
              {savings ? 'UPDATE GOAL' : 'SET UP SAVINGS GOAL'}
            </Text>

            <View style={[styles.formCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              {/* Target Type */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>TARGET TYPE</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      targetType === 'fixed' && { borderColor: colors.accent, backgroundColor: colors.accent + '20' },
                    ]}
                    onPress={() => setTargetType('fixed')}
                  >
                    <Text style={[styles.typeText, { color: targetType === 'fixed' ? colors.accent : colors.secondaryText }]}>
                      $ Fixed Amount
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      targetType === 'percentage' && { borderColor: colors.accent, backgroundColor: colors.accent + '20' },
                    ]}
                    onPress={() => setTargetType('percentage')}
                  >
                    <Text style={[styles.typeText, { color: targetType === 'percentage' ? colors.accent : colors.secondaryText }]}>
                      % of Income
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Amount or Percentage */}
              {targetType === 'fixed' ? (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>MONTHLY TARGET</Text>
                  <View style={[styles.amountContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.currencySymbol, { color: colors.accent }]}>$</Text>
                    <TextInput
                      style={[styles.amountInput, { color: colors.primaryText }]}
                      placeholder="500.00"
                      placeholderTextColor={colors.secondaryText}
                      keyboardType="decimal-pad"
                      value={monthlyTarget}
                      onChangeText={setMonthlyTarget}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>PERCENTAGE OF INCOME</Text>
                  <View style={[styles.amountContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.amountInput, { color: colors.primaryText }]}
                      placeholder="10"
                      placeholderTextColor={colors.secondaryText}
                      keyboardType="decimal-pad"
                      value={percentage}
                      onChangeText={setPercentage}
                    />
                    <Text style={[styles.currencySymbol, { color: colors.accent }]}>%</Text>
                  </View>
                  {budgetState && (
                    <Text style={[styles.helperText, { color: colors.secondaryText }]}>
                      = ${((budgetState.totalMonthlyIncome * (parseFloat(percentage) || 0)) / 100).toFixed(2)}/month
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={handleSaveGoal}>
                <Text style={[styles.saveButtonText, { color: colors.background }]}>
                  {savings ? 'Update Goal' : 'Set Goal'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  progressCard: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20, alignItems: 'center' },
  progressLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  progressAmount: { fontSize: 36, fontWeight: '700', marginBottom: 2 },
  progressTarget: { fontSize: 14, marginBottom: 12 },
  progressBarContainer: { height: 8, borderRadius: 4, overflow: 'hidden', width: '100%', marginBottom: 6 },
  progressBar: { height: 8, borderRadius: 4 },
  progressPercent: { fontSize: 12 },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', width: '100%' },
  lockText: { fontSize: 14 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  actionCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingLeft: 12 },
  actionCurrency: { fontSize: 18, fontWeight: '700', marginRight: 4 },
  actionInput: { flex: 1, paddingVertical: 10, fontSize: 16 },
  actionButton: { paddingHorizontal: 20, borderRadius: 10, justifyContent: 'center' },
  actionButtonText: { fontSize: 14, fontWeight: '600' },
  formCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeButton: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  typeText: { fontSize: 14, fontWeight: '600' },
  amountContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14 },
  currencySymbol: { fontSize: 20, fontWeight: '700' },
  amountInput: { flex: 1, paddingVertical: 12, fontSize: 20, fontWeight: '600' },
  helperText: { fontSize: 12, marginTop: 4 },
  saveButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  saveButtonText: { fontSize: 16, fontWeight: '600' },
});
