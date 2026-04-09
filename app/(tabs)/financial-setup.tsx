'use client';

import { useBudget } from '@/src/context/BudgetContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Income, Constant, IncomeFrequency, ConstantFrequency, ConstantCategory, DayOfWeek } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

// Cross-platform confirm — Alert.alert doesn't work on web
const confirmAction = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);
  }
};
import { SafeAreaView } from 'react-native-safe-area-context';

const FREQ_OPTIONS: { key: IncomeFrequency; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'bi-weekly', label: 'Bi-Weekly' },
  { key: 'semi-monthly', label: 'Semi-Monthly' },
  { key: 'monthly', label: 'Monthly' },
];

const CONST_FREQ: { key: ConstantFrequency; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'bi-weekly', label: 'Bi-Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

const CONST_CATS: { key: ConstantCategory; emoji: string; label: string }[] = [
  { key: 'rent', emoji: '🏠', label: 'Rent' },
  { key: 'mortgage', emoji: '🏡', label: 'Mortgage' },
  { key: 'groceries', emoji: '🛒', label: 'Groceries' },
  { key: 'utilities', emoji: '💡', label: 'Utilities' },
  { key: 'transport', emoji: '🚗', label: 'Transport' },
  { key: 'insurance', emoji: '🛡️', label: 'Insurance' },
  { key: 'subscriptions', emoji: '📱', label: 'Subs' },
  { key: 'phone', emoji: '📞', label: 'Phone' },
  { key: 'internet', emoji: '🌐', label: 'Internet' },
  { key: 'debt', emoji: '💳', label: 'Debt' },
  { key: 'other', emoji: '📌', label: 'Other' },
];

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Mon' }, { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' }, { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' }, { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

export default function FinancialSetupScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    incomes, addIncome, deleteIncome,
    constants, addConstant, deleteConstant,
    savings, setSavings, updateSavings, addToSavings, withdrawFromSavings, deleteSavings,
    budgetState,
  } = useBudget();

  // Income form
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incName, setIncName] = useState('');
  const [incAmount, setIncAmount] = useState('');
  const [incFreq, setIncFreq] = useState<IncomeFrequency>('bi-weekly');
  const [incDay, setIncDay] = useState<DayOfWeek>('friday');
  const [incMonthDay, setIncMonthDay] = useState('1');
  const [incSemi1, setIncSemi1] = useState('1');
  const [incSemi2, setIncSemi2] = useState('15');

  // Constant form
  const [showConstForm, setShowConstForm] = useState(false);
  const [constName, setConstName] = useState('');
  const [constAmount, setConstAmount] = useState('');
  const [constFreq, setConstFreq] = useState<ConstantFrequency>('monthly');
  const [constCat, setConstCat] = useState<ConstantCategory>('rent');
  const [constDay, setConstDay] = useState<DayOfWeek>('monday');
  const [constDueDate, setConstDueDate] = useState('1');

  // Savings form
  const [savingsAmount, setSavingsAmount] = useState('');
  const [depositAmt, setDepositAmt] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [editTargetAmt, setEditTargetAmt] = useState('');

  const resetIncomeForm = () => {
    setIncName(''); setIncAmount(''); setIncFreq('bi-weekly');
    setIncDay('friday'); setShowIncomeForm(false);
  };

  const resetConstForm = () => {
    setConstName(''); setConstAmount(''); setConstFreq('monthly');
    setConstCat('rent'); setShowConstForm(false);
  };

  const handleAddIncome = async () => {
    if (!incName.trim() || !incAmount.trim()) return Alert.alert('', 'Fill in name and amount');
    const amt = parseFloat(incAmount);
    if (isNaN(amt) || amt <= 0) return Alert.alert('', 'Enter a valid amount');
    try {
      await addIncome({
        userId: '', name: incName.trim(), type: incFreq, amount: amt,
        semiMonthlyDates: incFreq === 'semi-monthly' ? [parseInt(incSemi1), parseInt(incSemi2)] : null,
        dayOfWeek: (incFreq === 'weekly' || incFreq === 'bi-weekly') ? incDay : null,
        monthlyDate: incFreq === 'monthly' ? parseInt(incMonthDay) : null,
        isLocked: false, lockUntilDate: null, active: true,
      });
      resetIncomeForm();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleAddConstant = async () => {
    if (!constName.trim() || !constAmount.trim()) return Alert.alert('', 'Fill in name and amount');
    const amt = parseFloat(constAmount);
    if (isNaN(amt) || amt <= 0) return Alert.alert('', 'Enter a valid amount');
    try {
      await addConstant({
        userId: '', name: constName.trim(), amount: amt, frequency: constFreq,
        dayOfWeek: (constFreq === 'weekly' || constFreq === 'bi-weekly') ? constDay : null,
        dueDate: constFreq === 'monthly' ? parseInt(constDueDate) : null,
        category: constCat, active: true,
      });
      resetConstForm();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleSetSavings = async () => {
    const amt = parseFloat(savingsAmount);
    if (isNaN(amt) || amt <= 0) return;
    try {
      if (savings) {
        await updateSavings({ id: 'main', monthlyTarget: amt });
      } else {
        await setSavings({ userId: '', currentAmount: 0, monthlyTarget: amt, targetType: 'fixed', targetPercentage: null, isLocked: false });
      }
      setSavingsAmount('');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmt);
    if (isNaN(amt) || amt <= 0) return;
    try {
      await addToSavings(amt);
      setDepositAmt('');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmt);
    if (isNaN(amt) || amt <= 0) return;
    try {
      await withdrawFromSavings(amt);
      setWithdrawAmt('');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleEditTarget = async () => {
    const amt = parseFloat(editTargetAmt);
    if (isNaN(amt) || amt <= 0) return;
    try {
      await updateSavings({ id: 'main', monthlyTarget: amt });
      setEditTargetAmt('');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDeleteSavings = () => {
    confirmAction(t.delete, `Remove your savings goal? Your saved amount will be lost.`, async () => {
      try {
        await deleteSavings();
      } catch (err: unknown) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
      }
    });
  };

  const bs = budgetState;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.pageTitle, { color: colors.primaryText }]}>{t.financialSetup}</Text>

            {/* ─── BUDGET SUMMARY ─── */}
            {bs && bs.totalMonthlyIncome > 0 && (
              <View style={[styles.summaryCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}> 
                <LinearGradient
                  colors={[`${colors.gradientStart}10`, `${colors.gradientEnd}06`, 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[styles.summaryLabel, { color: colors.tertiaryText }]}>{t.budgetSummary}</Text>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryItem, { color: colors.secondaryText }]}>{t.monthlyIncome}</Text>
                  <Text style={[styles.summaryValue, { color: colors.accent }]}>${bs.totalMonthlyIncome.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryItem, { color: colors.secondaryText }]}>{t.monthlyConstants}</Text>
                  <Text style={[styles.summaryValue, { color: colors.warning }]}>-${bs.totalMonthlyConstants.toFixed(2)}</Text>
                </View>
                {bs.savingsTarget > 0 && (
                  <>
                    <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryItem, { color: colors.secondaryText }]}>{t.savingsGoal}</Text>
                      <Text style={[styles.summaryValue, { color: colors.success }]}>-${bs.savingsTarget.toFixed(2)}</Text>
                    </View>
                  </>
                )}
                <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryItem, { color: colors.primaryText, fontWeight: '700' }]}>{t.availableBudget}</Text>
                  <Text style={[styles.summaryValue, { color: colors.primaryText, fontWeight: '700' }]}>${bs.monthlyAvailable.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryItem, { color: colors.secondaryText }]}>{t.weeklyBudget}</Text>
                  <Text style={[styles.summaryValue, { color: colors.accent }]}>${bs.weeklyBudget.toFixed(2)}/wk</Text>
                </View>
              </View>
            )}

            {/* ─── INCOME SOURCES ─── */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.accentMuted }]}>
                <Ionicons name="wallet-outline" size={18} color={colors.accent} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>{t.incomeSources}</Text>
            </View>

            {incomes.map((inc: Income) => (
              <View key={inc.id} style={[styles.itemCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}> 
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.primaryText }]}>{inc.name}</Text>
                  <Text style={[styles.itemDetail, { color: colors.secondaryText }]}>
                    ${inc.amount.toFixed(2)} · {inc.type} → ${inc.monthlyTotal.toFixed(2)}{t.perMonth}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => confirmAction(t.delete, `Remove "${inc.name}"?`, () => deleteIncome(inc.id))}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}

            {!showIncomeForm ? (
              <TouchableOpacity style={[styles.addItemButton, { borderColor: colors.glassBorderLight }]} onPress={() => setShowIncomeForm(true)}>
                <Ionicons name="add" size={18} color={colors.accent} />
                <Text style={[styles.addItemText, { color: colors.accent }]}>{t.addIncome}</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.formCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}> 
                <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.primaryText }]} placeholder={t.incomeName} placeholderTextColor={colors.tertiaryText} value={incName} onChangeText={setIncName} />
                <View style={[styles.amountRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}> 
                  <Text style={[styles.currency, { color: colors.accent }]}>$</Text>
                  <TextInput style={[styles.amountInput, { color: colors.primaryText }]} placeholder="0.00" placeholderTextColor={colors.tertiaryText} keyboardType="decimal-pad" value={incAmount} onChangeText={setIncAmount} />
                </View>
                <View style={styles.chipRow}>
                  {FREQ_OPTIONS.map((f) => (
                    <TouchableOpacity key={f.key} style={[styles.chip, { borderColor: colors.glassBorder, backgroundColor: colors.glassBg }, incFreq === f.key && { borderColor: colors.accent, backgroundColor: colors.accentMuted }]} onPress={() => setIncFreq(f.key)}>
                      <Text style={[styles.chipText, { color: incFreq === f.key ? colors.accent : colors.secondaryText }]}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {(incFreq === 'weekly' || incFreq === 'bi-weekly') && (
                  <View style={styles.chipRow}>
                    {DAYS.map((d) => (
                      <TouchableOpacity key={d.key} style={[styles.chipSm, { borderColor: colors.glassBorder, backgroundColor: colors.glassBg }, incDay === d.key && { borderColor: colors.accent, backgroundColor: colors.accentMuted }]} onPress={() => setIncDay(d.key)}>
                        <Text style={[styles.chipSmText, { color: incDay === d.key ? colors.accent : colors.secondaryText }]}>{d.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {incFreq === 'monthly' && (
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.primaryText }]} placeholder={t.dayOfMonth} placeholderTextColor={colors.tertiaryText} keyboardType="number-pad" value={incMonthDay} onChangeText={setIncMonthDay} />
                )}
                {incFreq === 'semi-monthly' && (
                  <View style={styles.semiRow}>
                    <TextInput style={[styles.semiInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.primaryText }]} placeholder="1" keyboardType="number-pad" value={incSemi1} onChangeText={setIncSemi1} />
                    <Text style={[styles.semiAnd, { color: colors.secondaryText }]}>&</Text>
                    <TextInput style={[styles.semiInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.primaryText }]} placeholder="15" keyboardType="number-pad" value={incSemi2} onChangeText={setIncSemi2} />
                  </View>
                )}
                <View style={styles.formButtons}>
                  <TouchableOpacity style={[styles.formBtn, { backgroundColor: colors.accent }]} onPress={handleAddIncome}>
                    <Text style={[styles.formBtnText, { color: colors.buttonText }]}>{t.addIncome}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={resetIncomeForm}>
                    <Text style={[styles.formCancelText, { color: colors.secondaryText }]}>{t.cancel}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ─── CONSTANTS ─── */}
            <View style={[styles.sectionHeader, { marginTop: 28 }]}> 
              <View style={[styles.sectionIcon, { backgroundColor: colors.warningMuted }]}> 
                <Ionicons name="repeat-outline" size={18} color={colors.warning} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>{t.constantsNecessities}</Text>
            </View>

            {constants.map((c: Constant) => (
              <View key={c.id} style={[styles.itemCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}> 
                <Text style={styles.itemEmoji}>{CONST_CATS.find((cat) => cat.key === c.category)?.emoji || '📌'}</Text>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.primaryText }]}>{c.name}</Text>
                  <Text style={[styles.itemDetail, { color: colors.secondaryText }]}>
                    ${c.amount.toFixed(2)} · {c.frequency} → ${c.monthlyTotal.toFixed(2)}{t.perMonth}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => confirmAction(t.delete, `Remove "${c.name}"?`, () => deleteConstant(c.id))}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}

            {!showConstForm ? (
              <TouchableOpacity style={[styles.addItemButton, { borderColor: colors.glassBorderLight }]} onPress={() => setShowConstForm(true)}>
                <Ionicons name="add" size={18} color={colors.accent} />
                <Text style={[styles.addItemText, { color: colors.accent }]}>{t.addConstant}</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.formCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}> 
                <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.primaryText }]} placeholder={t.constantName} placeholderTextColor={colors.tertiaryText} value={constName} onChangeText={setConstName} />
                <View style={[styles.amountRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}> 
                  <Text style={[styles.currency, { color: colors.accent }]}>$</Text>
                  <TextInput style={[styles.amountInput, { color: colors.primaryText }]} placeholder="0.00" placeholderTextColor={colors.tertiaryText} keyboardType="decimal-pad" value={constAmount} onChangeText={setConstAmount} />
                </View>
                <View style={styles.chipRow}>
                  {CONST_CATS.slice(0, 8).map((cat) => (
                    <TouchableOpacity key={cat.key} style={[styles.chip, { borderColor: colors.glassBorder, backgroundColor: colors.glassBg }, constCat === cat.key && { borderColor: colors.accent, backgroundColor: colors.accentMuted }]} onPress={() => setConstCat(cat.key)}>
                      <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.chipText, { color: constCat === cat.key ? colors.accent : colors.secondaryText }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.chipRow}>
                  {CONST_FREQ.map((f) => (
                    <TouchableOpacity key={f.key} style={[styles.chip, { borderColor: colors.glassBorder, backgroundColor: colors.glassBg }, constFreq === f.key && { borderColor: colors.accent, backgroundColor: colors.accentMuted }]} onPress={() => setConstFreq(f.key)}>
                      <Text style={[styles.chipText, { color: constFreq === f.key ? colors.accent : colors.secondaryText }]}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {constFreq === 'monthly' && (
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.primaryText }]} placeholder={t.dueDate} placeholderTextColor={colors.tertiaryText} keyboardType="number-pad" value={constDueDate} onChangeText={setConstDueDate} />
                )}
                <View style={styles.formButtons}>
                  <TouchableOpacity style={[styles.formBtn, { backgroundColor: colors.accent }]} onPress={handleAddConstant}>
                    <Text style={[styles.formBtnText, { color: colors.buttonText }]}>{t.addConstant}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={resetConstForm}>
                    <Text style={[styles.formCancelText, { color: colors.secondaryText }]}>{t.cancel}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ─── SAVINGS ─── */}
            <View style={[styles.sectionHeader, { marginTop: 28 }]}> 
              <View style={[styles.sectionIcon, { backgroundColor: colors.successMuted }]}> 
                <Ionicons name="trending-up-outline" size={18} color={colors.success} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>{t.savingsGoal}</Text>
            </View>

            {savings && (
              <View style={[styles.savingsDisplay, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}> 
                <Text style={[styles.savingsCurrentLabel, { color: colors.tertiaryText }]}>{t.currentSavings}</Text>
                <Text style={[styles.savingsCurrentAmount, { color: colors.accent }]}>${savings.currentAmount.toFixed(2)}</Text>
                {savings.monthlyTarget > 0 && (
                  <>
                    <Text style={[styles.savingsGoalText, { color: colors.secondaryText }]}> 
                      {t.ofGoal} ${savings.monthlyTarget.toFixed(2)} {t.monthly.toLowerCase()} {t.setGoal.toLowerCase()}
                    </Text>
                    {/* Progress bar */}
                    <View style={[styles.savingsTrack, { backgroundColor: colors.glassBgLight }]}> 
                      <View style={[styles.savingsFill, { width: `${Math.min((savings.currentAmount / savings.monthlyTarget) * 100, 100)}%`, backgroundColor: colors.success }]} />
                    </View>
                  </>
                )}

                {/* Deposit */}
                <View style={[styles.depositRow, { marginTop: 16 }]}> 
                  <View style={[styles.depositInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}> 
                    <Text style={[styles.currency, { color: colors.success }]}>$</Text>
                    <TextInput style={[styles.depositTextInput, { color: colors.primaryText }]} placeholder="0" placeholderTextColor={colors.tertiaryText} keyboardType="decimal-pad" value={depositAmt} onChangeText={setDepositAmt} />
                  </View>
                  <TouchableOpacity style={[styles.depositBtn, { backgroundColor: colors.success }]} onPress={handleDeposit}>
                    <Text style={[styles.depositBtnText, { color: '#fff' }]}>{t.add}</Text>
                  </TouchableOpacity>
                </View>

                {/* Withdraw */}
                {savings.currentAmount > 0 && (
                  <View style={[styles.depositRow, { marginTop: 8 }]}> 
                    <View style={[styles.depositInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}> 
                      <Text style={[styles.currency, { color: colors.warning }]}>$</Text>
                      <TextInput style={[styles.depositTextInput, { color: colors.primaryText }]} placeholder="0" placeholderTextColor={colors.tertiaryText} keyboardType="decimal-pad" value={withdrawAmt} onChangeText={setWithdrawAmt} />
                    </View>
                    <TouchableOpacity style={[styles.depositBtn, { backgroundColor: colors.warning }]} onPress={handleWithdraw}>
                      <Text style={[styles.depositBtnText, { color: '#fff' }]}>{t.withdraw}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Edit target */}
                <View style={[styles.editTargetRow, { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 16 }]}> 
                  <View style={[styles.depositInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, flex: 1 }]}> 
                    <Text style={[styles.currency, { color: colors.accent }]}>$</Text>
                    <TextInput style={[styles.depositTextInput, { color: colors.primaryText }]} placeholder={savings.monthlyTarget.toString()} placeholderTextColor={colors.tertiaryText} keyboardType="decimal-pad" value={editTargetAmt} onChangeText={setEditTargetAmt} />
                  </View>
                  <TouchableOpacity style={[styles.depositBtn, { backgroundColor: colors.accent }]} onPress={handleEditTarget}>
                    <Text style={[styles.depositBtnText, { color: colors.buttonText }]}>{t.updateGoal}</Text>
                  </TouchableOpacity>
                </View>

                {/* Delete savings goal */}
                <TouchableOpacity style={[styles.deleteSavingsBtn, { marginTop: 12 }]} onPress={handleDeleteSavings}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  <Text style={[styles.deleteSavingsText, { color: colors.danger }]}>{t.delete} {t.savingsGoal}</Text>
                </TouchableOpacity>
              </View>
            )}

            {!savings && (
              <View style={[styles.formCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}> 
                <Text style={[styles.formSubtitle, { color: colors.secondaryText }]}>{t.monthlyTarget}</Text>
                <View style={[styles.amountRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}> 
                  <Text style={[styles.currency, { color: colors.accent }]}>$</Text>
                  <TextInput style={[styles.amountInput, { color: colors.primaryText }]} placeholder="500" placeholderTextColor={colors.tertiaryText} keyboardType="decimal-pad" value={savingsAmount} onChangeText={setSavingsAmount} />
                </View>
                <TouchableOpacity style={[styles.formBtn, { backgroundColor: colors.accent, marginTop: 12 }]} onPress={handleSetSavings}>
                  <Text style={[styles.formBtnText, { color: colors.buttonText }]}>{t.setGoal}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  pageTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 20 },

  summaryCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 28, overflow: 'hidden' },
  summaryLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  summaryItem: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  summaryDivider: { height: 1 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },

  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8, gap: 12 },
  itemEmoji: { fontSize: 22 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  itemDetail: { fontSize: 12 },

  addItemButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', gap: 6, marginBottom: 8 },
  addItemText: { fontSize: 14, fontWeight: '600' },

  formCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 8, gap: 10 },
  formSubtitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  amountRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingLeft: 14 },
  currency: { fontSize: 18, fontWeight: '700', marginRight: 4 },
  amountInput: { flex: 1, paddingVertical: 12, fontSize: 18, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, gap: 4 },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipSm: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  chipSmText: { fontSize: 12, fontWeight: '600' },
  semiRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  semiInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, textAlign: 'center' },
  semiAnd: { fontSize: 15, fontWeight: '600' },
  formButtons: { gap: 8, marginTop: 4 },
  formBtn: { paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  formBtnText: { fontSize: 15, fontWeight: '700' },
  formCancelText: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingVertical: 8 },

  savingsDisplay: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 8, alignItems: 'center' },
  savingsCurrentLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  savingsCurrentAmount: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  savingsGoalText: { fontSize: 13, marginTop: 2, marginBottom: 8 },
  savingsTrack: { height: 6, borderRadius: 3, overflow: 'hidden', width: '100%', marginBottom: 4 },
  savingsFill: { height: 6, borderRadius: 3 },
  depositRow: { flexDirection: 'row', gap: 8, width: '100%' },
  depositInput: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingLeft: 12 },
  depositTextInput: { flex: 1, paddingVertical: 10, fontSize: 16, fontWeight: '600' },
  depositBtn: { paddingHorizontal: 20, borderRadius: 10, justifyContent: 'center' },
  depositBtnText: { fontSize: 14, fontWeight: '700' },
  editTargetRow: { flexDirection: 'row', gap: 8, width: '100%' },
  deleteSavingsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  deleteSavingsText: { fontSize: 13, fontWeight: '600' },
});
