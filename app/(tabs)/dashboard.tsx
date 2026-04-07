'use client';

import { BudgetContext } from '@/src/context/BudgetContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CATEGORIES = {
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

  const { weeklyBudget = 300, transactions = [] } = budgetContext;
  const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const budgetLeft = weeklyBudget - totalSpent;
  const percentSpent = (totalSpent / weeklyBudget) * 100;

  // Get progress bar color
  const getProgressBarColor = () => {
    if (percentSpent < 50) return colors.accent; // cyan healthy
    if (percentSpent < 75) return colors.warning; // yellow warning
    return colors.danger; // red danger
  };

  const handleAddExpense = () => {
    router.push('/(tabs)/add-expense');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>{t.dashboard}</Text>
        <TouchableOpacity onPress={() => setShowPaywall(true)}>
          <Ionicons name="settings" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Budget Card */}
      <View style={[styles.budgetCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.budgetLabel, { color: colors.secondaryText }]}>{t.youHave}</Text>
        <Text style={[styles.budgetAmount, { color: colors.accent }]}>${budgetLeft.toFixed(2)}</Text>
        <Text style={[styles.budgetSubtitle, { color: colors.secondaryText }]}>{t.leftThisWeek}</Text>
        <Text style={[styles.budgetInfo, { color: colors.secondaryText }]}>{t.budget} ${weeklyBudget.toFixed(2)} {t.perWeek}</Text>

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
        <Text style={[styles.progressText, { color: colors.secondaryText }]}>{percentSpent.toFixed(0)}% {t.spent}</Text>
      </View>

      {/* Add Expense Button */}
      <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={handleAddExpense}>
        <Text style={[styles.addButtonText, { color: colors.background }]}>+ {t.addExpense}</Text>
      </TouchableOpacity>

      {/* Transactions List */}
      <View style={styles.transactionsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>{t.thisWeeksSpending}</Text>
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.transactionItem}>
              <Text style={styles.transactionIcon}>
                {CATEGORIES[item.category as keyof typeof CATEGORIES] || '📌'}
              </Text>
              <View style={styles.transactionInfo}>
                <Text style={[styles.transactionTitle, { color: colors.primaryText }]}>{item.description}</Text>
                <Text style={[styles.transactionDate, { color: colors.secondaryText }]}>
                  {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.transactionAmount, { color: colors.accent }]}>
                ${item.amount.toFixed(2)}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              {t.noExpensesYet} {t.addOneToGetStarted}
            </Text>
          }
          scrollEnabled={false}
        />
      </View>

      {/* Paywall Modal */}
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </SafeAreaView>
  );
}

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

          {/* Crown Icon */}
          <View style={paywallStyles.iconContainer}>
            <Text style={paywallStyles.crownIcon}>👑</Text>
          </View>

          <Text style={[paywallStyles.title, { color: colors.primaryText }]}>{t.leftoverPremium}</Text>
          <Text style={[paywallStyles.subtitle, { color: colors.secondaryText }]}>{t.unlockUnlimitedFeatures}</Text>

          {/* Features */}
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

          {/* Pricing */}
          <View style={[paywallStyles.pricingBox, { backgroundColor: colors.surface }]}>
            <Text style={[paywallStyles.pricingHighlight, { color: colors.accent }]}>{t.daysFree}</Text>
            <Text style={[paywallStyles.pricingSubtitle, { color: colors.primaryText }]}>{t.thenPerWeek}</Text>
            <Text style={[paywallStyles.pricingSmall, { color: colors.secondaryText }]}>{t.noCommitment}</Text>
          </View>

          {/* Buttons */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  budgetCard: {
    marginHorizontal: 16,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
  },
  budgetLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  budgetAmount: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 4,
  },
  budgetSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  budgetInfo: {
    fontSize: 14,
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
  },
  addButton: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 12,
  },
  transactionIcon: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

const paywallStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingTop: 24,
    maxHeight: '90%',
    borderWidth: 1,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  crownIcon: {
    fontSize: 56,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  features: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
  },
  pricingBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  pricingHighlight: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  pricingSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  pricingSmall: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  tryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tryButtonArrow: {
    fontSize: 18,
  },
  laterText: {
    fontSize: 14,
    textAlign: 'center',
  },
});