// ============================================================
// LEFTOVER - Dashboard (Enhanced)
// Uses BudgetState from calculation engine
// Falls back to legacy data if user isn't authed yet
// ============================================================

'use client';

import { BudgetContext, Transaction } from '@/src/context/BudgetContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { EXPENSE_CATEGORY_EMOJI, ExpenseCategory } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CATEGORIES: Record<string, string> = {
  Food: '🍔',
  Transport: '🚗',
  Entertainment: '🎬',
  Utilities: '💡',
  Shopping: '🛍️',
  Other: '📌',
};

export default function DashboardScreen() {
  const budgetContext = useContext(BudgetContext);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);

  if (!budgetContext) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{t.loading}</Text>
      </SafeAreaView>
    );
  }

  const bs = budgetContext.budgetState;

  // Use BudgetState if available, otherwise fall back to legacy
  const weeklyBudget = bs?.weeklyBudget || budgetContext.weeklyBudget || 300;
  const totalSpent = bs?.currentWeekSpent || budgetContext.transactions.reduce((sum: number, tx: { amount: number }) => sum + (tx.amount || 0), 0);
  const budgetLeft = bs?.currentWeekRemaining ?? (weeklyBudget - totalSpent);
  const percentSpent = weeklyBudget > 0 ? (totalSpent / weeklyBudget) * 100 : 0;

  // Greeting
  const greeting = bs?.greeting || t.dashboard;

  // Recommendations
  const recommendations = bs?.recommendations || [];

  // Payday info
  const daysUntilPayday = bs?.daysUntilPayday || null;

  // Monthly stats
  const monthlyAvailable = bs?.monthlyAvailable || null;
  const monthlyConstants = bs?.totalMonthlyConstants || null;
  const currentMonthTotal = bs?.currentMonthTotal || null;

  // Savings
  const savingsCurrent = bs?.savingsCurrent || 0;
  const savingsTarget = bs?.savingsTarget || 0;
  const savingsOnTrack = bs?.savingsOnTrack ?? true;

  // Transactions — merge legacy + Firestore expenses for display
  const displayTransactions = bs
    ? budgetContext.expenses.map((e) => ({
        amount: e.amount,
        description: e.description,
        category: e.category,
        date: e.date,
        id: e.id,
      }))
    : budgetContext.transactions.map((tx: Transaction, i: number) => ({ ...tx, id: String(i) }));

  // Progress bar color
  const getProgressBarColor = () => {
    if (percentSpent < 50) return colors.accent;
    if (percentSpent < 75) return colors.warning;
    return colors.danger;
  };

  const handleAddExpense = () => {
    router.push('/(tabs)/add-expense');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.primaryText }]}>{greeting}</Text>
            {daysUntilPayday !== null && daysUntilPayday > 0 && (
              <Text style={[styles.paydayText, { color: colors.secondaryText }]}>
                Next payday in {daysUntilPayday} day{daysUntilPayday !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
            <Ionicons name="settings-outline" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Weekly Budget Card */}
        <View style={[styles.budgetCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.budgetLabel, { color: colors.secondaryText }]}>{t.youHave}</Text>
          <Text style={[styles.budgetAmount, { color: budgetLeft >= 0 ? colors.accent : colors.danger }]}>
            ${Math.abs(budgetLeft).toFixed(2)}
          </Text>
          {budgetLeft < 0 && (
            <Text style={[styles.overBudgetText, { color: colors.danger }]}>over budget</Text>
          )}
          <Text style={[styles.budgetSubtitle, { color: colors.secondaryText }]}>{t.leftThisWeek}</Text>
          <Text style={[styles.budgetInfo, { color: colors.secondaryText }]}>
            {t.budget} ${weeklyBudget.toFixed(2)} {t.perWeek}
            {bs && ` · Week ${bs.currentWeekNumber}`}
          </Text>

          {/* Progress Bar */}
          <View style={[styles.progressBarContainer, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(percentSpent, 100)}%`,
                  backgroundColor: getProgressBarColor(),
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.secondaryText }]}>
            {percentSpent.toFixed(0)}% {t.spent}
          </Text>
        </View>

        {/* Monthly Overview Cards (only show if budget state exists) */}
        {bs && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Monthly Income</Text>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                ${bs.totalMonthlyIncome.toFixed(0)}
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Constants</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                ${bs.totalMonthlyConstants.toFixed(0)}
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Available</Text>
              <Text style={[styles.statValue, { color: colors.primaryText }]}>
                ${bs.monthlyAvailable.toFixed(0)}
              </Text>
            </View>
          </View>
        )}

        {/* Savings Progress (only show if savings exist) */}
        {savingsTarget > 0 && (
          <View style={[styles.savingsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.savingsHeader}>
              <Text style={[styles.savingsTitle, { color: colors.primaryText }]}>Savings Goal</Text>
              <Text style={[styles.savingsAmount, { color: savingsOnTrack ? colors.accent : colors.warning }]}>
                ${savingsCurrent.toFixed(0)} / ${savingsTarget.toFixed(0)}
              </Text>
            </View>
            <View style={[styles.progressBarContainer, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min((savingsCurrent / savingsTarget) * 100, 100)}%`,
                    backgroundColor: savingsOnTrack ? colors.accent : colors.warning,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Insights</Text>
            {recommendations.map((rec: string, index: number) => (
              <View
                key={index}
                style={[styles.recommendationCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              >
                <Text style={styles.recommendationIcon}>💡</Text>
                <Text style={[styles.recommendationText, { color: colors.secondaryText }]}>
                  {rec}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Add Expense Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={handleAddExpense}
        >
          <Text style={[styles.addButtonText, { color: colors.background }]}>+ {t.addExpense}</Text>
        </TouchableOpacity>

        {/* Transactions List */}
        <View style={styles.transactionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>
            {t.thisWeeksSpending}
          </Text>
          {displayTransactions.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              {t.noExpensesYet} {t.addOneToGetStarted}
            </Text>
          ) : (
            displayTransactions.map((item: { id: string; amount: number; description: string; category: string; date: string }, index: number) => (
              <View key={item.id || index} style={styles.transactionItem}>
                <Text style={styles.transactionIcon}>
                  {CATEGORIES[item.category] || EXPENSE_CATEGORY_EMOJI[item.category as ExpenseCategory] || '📌'}
                </Text>
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionTitle, { color: colors.primaryText }]}>
                    {item.description}
                  </Text>
                  <Text style={[styles.transactionDate, { color: colors.secondaryText }]}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.transactionAmount, { color: colors.accent }]}>
                  ${item.amount.toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Paywall Modal */}
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </SafeAreaView>
  );
}

// ─── PAYWALL MODAL (unchanged from Haiku's version) ─────────

function PaywallModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[paywallStyles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
        <View style={[paywallStyles.modal, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <TouchableOpacity style={paywallStyles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.primaryText} />
          </TouchableOpacity>

          <View style={paywallStyles.iconContainer}>
            <Text style={paywallStyles.crownIcon}>👑</Text>
          </View>

          <Text style={[paywallStyles.title, { color: colors.primaryText }]}>{t.leftoverPremium}</Text>
          <Text style={[paywallStyles.subtitle, { color: colors.secondaryText }]}>{t.unlockUnlimitedFeatures}</Text>

          <View style={paywallStyles.features}>
            {[
              t.unlimitedExpenses,
              t.advancedAnalytics,
              t.multiCurrencySupport,
              t.customCategories,
              t.exportYourData,
            ].map((feature, index) => (
              <View key={index} style={paywallStyles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                <Text style={[paywallStyles.featureText, { color: colors.primaryText }]}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={[paywallStyles.pricingBox, { backgroundColor: colors.surface }]}>
            <Text style={[paywallStyles.pricingHighlight, { color: colors.accent }]}>{t.daysFree}</Text>
            <Text style={[paywallStyles.pricingSubtitle, { color: colors.primaryText }]}>{t.thenPerWeek}</Text>
            <Text style={[paywallStyles.pricingSmall, { color: colors.secondaryText }]}>{t.noCommitment}</Text>
          </View>

          <TouchableOpacity style={[paywallStyles.tryButton, { backgroundColor: colors.accent }]} activeOpacity={0.8}>
            <Text style={[paywallStyles.tryButtonText, { color: colors.background }]}>{t.tryForFree}</Text>
            <Text style={[paywallStyles.tryButtonArrow, { color: colors.background }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={[paywallStyles.laterText, { color: colors.secondaryText }]}>{t.maybeLater}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── STYLES ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  greeting: { fontSize: 28, fontWeight: '700' },
  paydayText: { fontSize: 14, marginTop: 4 },
  budgetCard: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  budgetLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  budgetAmount: { fontSize: 48, fontWeight: '700', marginBottom: 4 },
  overBudgetText: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  budgetSubtitle: { fontSize: 14, marginBottom: 16 },
  budgetInfo: { fontSize: 14, marginBottom: 16 },
  progressBarContainer: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressBar: { height: 8, borderRadius: 4 },
  progressText: { fontSize: 12 },

  // Stats Row
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  statCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },

  // Savings
  savingsCard: { marginHorizontal: 16, padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  savingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  savingsTitle: { fontSize: 14, fontWeight: '600' },
  savingsAmount: { fontSize: 14, fontWeight: '600' },

  // Recommendations
  recommendationsContainer: { paddingHorizontal: 16, marginBottom: 16 },
  recommendationCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 8, gap: 10 },
  recommendationIcon: { fontSize: 20 },
  recommendationText: { flex: 1, fontSize: 13, lineHeight: 18 },

  // Add Button
  addButton: { marginHorizontal: 16, paddingVertical: 14, borderRadius: 12, marginBottom: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  addButtonText: { fontSize: 16, fontWeight: '600' },

  // Transactions
  transactionsContainer: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', gap: 12 },
  transactionIcon: { fontSize: 24 },
  transactionInfo: { flex: 1 },
  transactionTitle: { fontSize: 14, fontWeight: '500' },
  transactionDate: { fontSize: 12, marginTop: 2 },
  transactionAmount: { fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 16 },
  errorText: { fontSize: 16, textAlign: 'center' },
});

const paywallStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingVertical: 32, paddingTop: 24, maxHeight: '90%', borderWidth: 1 },
  closeButton: { alignSelf: 'flex-end', marginBottom: 16 },
  iconContainer: { alignItems: 'center', marginBottom: 16 },
  crownIcon: { fontSize: 56 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  features: { marginBottom: 24 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  featureText: { fontSize: 14 },
  pricingBox: { padding: 16, borderRadius: 12, marginBottom: 24 },
  pricingHighlight: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  pricingSubtitle: { fontSize: 16, textAlign: 'center' },
  pricingSmall: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  tryButton: { paddingVertical: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12, gap: 8 },
  tryButtonText: { fontSize: 16, fontWeight: '600' },
  tryButtonArrow: { fontSize: 18 },
  laterText: { fontSize: 14, textAlign: 'center' },
});
