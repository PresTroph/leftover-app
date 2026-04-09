'use client';

import { BudgetContext, Transaction } from '@/src/context/BudgetContext';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { EXPENSE_CATEGORY_EMOJI, ExpenseCategory } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CATEGORIES: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Entertainment: '🎬',
  Utilities: '💡', Shopping: '🛍️', Other: '📌',
};

export default function DashboardScreen() {
  const budgetContext = useContext(BudgetContext);
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  if (!budgetContext) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{t.loading}</Text>
      </SafeAreaView>
    );
  }

  const bs = budgetContext.budgetState;

  const weeklyBudget = bs?.weeklyBudget || budgetContext.weeklyBudget || 300;
  const totalSpent = bs?.currentWeekSpent || budgetContext.transactions.reduce((sum: number, tx: { amount: number }) => sum + (tx.amount || 0), 0);
  const budgetLeft = bs?.currentWeekRemaining ?? (weeklyBudget - totalSpent);
  const percentSpent = weeklyBudget > 0 ? (totalSpent / weeklyBudget) * 100 : 0;

  // Build greeting with user name
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? t.goodMorning : hour < 17 ? t.goodAfternoon : t.goodEvening;
  const userName = user?.name || bs?.greeting?.split(',')[0]?.split(' ').pop() || '';
  const greeting = userName ? `${timeGreeting}, ${userName}` : timeGreeting;

  const recommendations = bs?.recommendations || [];
  const daysUntilPayday = bs?.daysUntilPayday || null;
  const savingsCurrent = bs?.savingsCurrent || 0;
  const savingsTarget = bs?.savingsTarget || 0;
  const savingsOnTrack = bs?.savingsOnTrack ?? true;

  const displayTransactions = bs
    ? budgetContext.expenses.map((e) => ({
        amount: e.amount, description: e.description,
        category: e.category, date: e.date, id: e.id,
      }))
    : budgetContext.transactions.map((tx: Transaction, i: number) => ({ ...tx, id: String(i) }));

  const getProgressGradient = (): readonly [string, string] => {
    if (percentSpent < 50) return [colors.gradientStart, colors.success];
    if (percentSpent < 75) return [colors.warning, '#f97316'];
    return ['#f97316', colors.danger];
  };

  const handleDeleteExpense = (expenseId: string, description: string) => {
    const doDelete = () => {
      if (bs) {
        budgetContext.deleteExpenseFromFirestore(expenseId);
      } else {
        const idx = parseInt(expenseId);
        if (!isNaN(idx)) budgetContext.deleteTransaction(idx);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`${t.delete}\nRemove "${description}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(t.delete, `Remove "${description}"?`, [
        { text: t.cancel, style: 'cancel' },
        { text: t.delete, style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: colors.primaryText }]}>{greeting}</Text>
              {daysUntilPayday !== null && daysUntilPayday > 0 && (
                <View style={styles.paydayBadge}>
                  <View style={[styles.paydayDot, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.paydayText, { color: colors.secondaryText }]}>
                    {t.paydayIn} {daysUntilPayday} {daysUntilPayday !== 1 ? t.days : t.day}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.settingsButton, { backgroundColor: colors.glassBg }]}
              onPress={() => router.push('/settings')}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={22} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>

          {/* Hero Budget Card */}
          <View style={[styles.heroCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
            <LinearGradient
              colors={[`${colors.gradientStart}12`, `${colors.gradientEnd}08`, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroInner}>
              <Text style={[styles.heroLabel, { color: colors.tertiaryText }]}>{t.youHave}</Text>
              <View style={styles.heroAmountRow}>
                <Text style={[styles.heroCurrency, { color: colors.accent }]}>$</Text>
                <Text style={[styles.heroAmount, { color: colors.primaryText }, budgetLeft < 0 && { color: colors.danger }]}> 
                  {Math.abs(budgetLeft).toFixed(2)}
                </Text>
              </View>
              {budgetLeft < 0 && (
                <Text style={[styles.overBudgetBadge, { color: colors.danger, backgroundColor: colors.dangerMuted }]}>
                  {t.overBudget}
                </Text>
              )}
              <Text style={[styles.heroSubtitle, { color: colors.secondaryText }]}>{t.leftThisWeek}</Text>

              {/* Carry-over indicator */}
              {bs && bs.currentWeekCarryOver !== 0 && (
                <View style={[styles.carryOverBadge, { backgroundColor: bs.currentWeekCarryOver > 0 ? colors.successMuted : colors.dangerMuted }]}>
                  <Ionicons
                    name={bs.currentWeekCarryOver > 0 ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color={bs.currentWeekCarryOver > 0 ? colors.success : colors.danger}
                  />
                  <Text style={[styles.carryOverText, { color: bs.currentWeekCarryOver > 0 ? colors.success : colors.danger }]}>
                    {bs.currentWeekCarryOver > 0 ? '+' : ''}${bs.currentWeekCarryOver.toFixed(2)} from last week
                  </Text>
                </View>
              )}

              {/* Week dates */}
              {bs && bs.currentWeek && (
                <Text style={[styles.weekDates, { color: colors.tertiaryText }]}>
                  {bs.currentWeek.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {bs.currentWeek.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {bs.currentWeek.daysLeft} day{bs.currentWeek.daysLeft !== 1 ? 's' : ''} left
                </Text>
              )}

              <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                  <Text style={[styles.progressLabel, { color: colors.tertiaryText }]}>
                    ${totalSpent.toFixed(0)} {t.spent}
                  </Text>
                  <Text style={[styles.progressLabel, { color: colors.tertiaryText }]}>
                    ${(bs?.currentWeekAdjustedBudget || weeklyBudget).toFixed(0)}{bs ? ` · Wk ${bs.currentWeekNumber}` : ''}
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.glassBgLight }]}>
                  <LinearGradient
                    colors={getProgressGradient()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${Math.min(Math.max(percentSpent, 2), 100)}%` }]}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          {bs && (
            <View style={styles.statsRow}>
              {[
                { label: t.income, value: `$${bs.totalMonthlyIncome.toFixed(0)}`, icon: 'arrow-down-outline', color: colors.accent },
                { label: t.bills, value: `$${bs.totalMonthlyConstants.toFixed(0)}`, icon: 'arrow-up-outline', color: colors.warning },
                { label: t.free, value: `$${bs.monthlyAvailable.toFixed(0)}`, icon: 'wallet-outline', color: colors.success },
              ].map((stat, idx: number) => (
                <View key={idx} style={[styles.statCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
                  <View style={[styles.statIconCircle, { backgroundColor: `${stat.color}15` }]}>
                    <Ionicons name={stat.icon as any} size={16} color={stat.color} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.primaryText }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.tertiaryText }]}>{stat.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Savings */}
          {savingsTarget > 0 && (
            <View style={[styles.savingsCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
              <View style={styles.savingsHeader}>
                <View style={styles.savingsLeft}>
                  <Ionicons name="trending-up" size={18} color={colors.success} />
                  <Text style={[styles.savingsTitle, { color: colors.primaryText }]}>{t.savingsGoal}</Text>
                </View>
                <Text style={[styles.savingsAmount, { color: savingsOnTrack ? colors.success : colors.warning }]}>
                  ${savingsCurrent.toFixed(0)}/${savingsTarget.toFixed(0)}
                </Text>
              </View>
              <View style={[styles.savingsTrack, { backgroundColor: colors.glassBgLight }]}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.success]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.savingsFill, { width: `${Math.min((savingsCurrent / savingsTarget) * 100, 100)}%` }]}
                />
              </View>
            </View>
          )}

          {/* Insights */}
          {recommendations.length > 0 && (
            <View style={styles.insightsSection}>
              {recommendations.map((rec: string, index: number) => (
                <View key={index} style={[styles.insightCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}> 
                  <LinearGradient
                    colors={[`${colors.gradientStart}08`, `${colors.gradientEnd}04`]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[styles.insightDot, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.insightText, { color: colors.secondaryText }]}>{rec}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Add Expense CTA */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(tabs)/add-expense')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={20} color={colors.buttonText} />
              <Text style={[styles.addButtonText, { color: colors.buttonText }]}>{t.addExpense}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.transactionsHeader}>
              <Text style={[styles.transactionsTitle, { color: colors.primaryText }]}>{t.thisWeeksSpending}</Text>
              {displayTransactions.length > 0 && (
                <Text style={[styles.transactionsCount, { color: colors.tertiaryText }]}>
                  {displayTransactions.length} {displayTransactions.length !== 1 ? t.items : t.item}
                </Text>
              )}
            </View>

            {displayTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🧾</Text>
                <Text style={[styles.emptyTitle, { color: colors.secondaryText }]}>{t.noExpensesYet}</Text>
                <Text style={[styles.emptySubtitle, { color: colors.tertiaryText }]}>{t.addOneToGetStarted}</Text>
              </View>
            ) : (
              displayTransactions.map((item: { id: string; amount: number; description: string; category: string; date: string }, index: number) => (
                <TouchableOpacity
                  key={item.id || index}
                  style={[styles.transactionRow, index === displayTransactions.length - 1 && styles.transactionRowLast]}
                  onLongPress={() => handleDeleteExpense(item.id, item.description)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.transactionIconCircle, { backgroundColor: colors.glassBgLight }]}> 
                    <Text style={styles.transactionEmoji}>
                      {CATEGORIES[item.category] || EXPENSE_CATEGORY_EMOJI[item.category as ExpenseCategory] || '📌'}
                    </Text>
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionName, { color: colors.primaryText }]}>{item.description}</Text>
                    <Text style={[styles.transactionDate, { color: colors.tertiaryText }]}> 
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={[styles.transactionAmount, { color: colors.danger }]}>-${item.amount.toFixed(2)}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 8 },
  errorText: { fontSize: 16, textAlign: 'center', marginTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 24 },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  paydayBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  paydayDot: { width: 6, height: 6, borderRadius: 3 },
  paydayText: { fontSize: 13, fontWeight: '500' },
  settingsButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  heroCard: { marginHorizontal: 20, borderRadius: 24, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  heroInner: { padding: 24, paddingBottom: 20 },
  heroLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  heroAmountRow: { flexDirection: 'row', alignItems: 'flex-start' },
  heroCurrency: { fontSize: 28, fontWeight: '300', marginTop: 8, marginRight: 2 },
  heroAmount: { fontSize: 52, fontWeight: '800', letterSpacing: -2, lineHeight: 58 },
  overBudgetBadge: { alignSelf: 'flex-start', fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, letterSpacing: 1, marginTop: 4 },
  heroSubtitle: { fontSize: 14, marginTop: 4, marginBottom: 4 },
  carryOverBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4, marginTop: 4 },
  carryOverText: { fontSize: 12, fontWeight: '600' },
  weekDates: { fontSize: 11, marginTop: 6, marginBottom: 12 },
  progressSection: {},
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'center', gap: 6 },
  statIconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  savingsCard: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  savingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  savingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  savingsTitle: { fontSize: 14, fontWeight: '600' },
  savingsAmount: { fontSize: 13, fontWeight: '700' },
  savingsTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  savingsFill: { height: 4, borderRadius: 2 },
  insightsSection: { paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  insightCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, padding: 14, gap: 12, overflow: 'hidden' },
  insightDot: { width: 6, height: 6, borderRadius: 3 },
  insightText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  addButton: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', marginBottom: 28 },
  addButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
  addButtonText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  transactionsSection: { paddingHorizontal: 20 },
  transactionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  transactionsTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  transactionsCount: { fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyEmoji: { fontSize: 36, marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '600' },
  emptySubtitle: { fontSize: 13 },
  transactionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', gap: 14 },
  transactionRowLast: { borderBottomWidth: 0 },
  transactionIconCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  transactionEmoji: { fontSize: 20 },
  transactionInfo: { flex: 1, gap: 2 },
  transactionName: { fontSize: 14, fontWeight: '600' },
  transactionDate: { fontSize: 12 },
  transactionAmount: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
});
