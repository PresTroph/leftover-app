// ============================================================
// LEFTOVER - Dashboard (Redesigned)
// Premium dark moody aesthetic · Glassmorphic depth
// Gradient accents · Refined typography · Smooth flow
// ============================================================

'use client';

import { BudgetContext, Transaction } from '@/src/context/BudgetContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { EXPENSE_CATEGORY_EMOJI, ExpenseCategory } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
    Dimensions,
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

// ─── DESIGN TOKENS ──────────────────────────────────────────

const GLASS = {
  background: 'rgba(255, 255, 255, 0.04)',
  backgroundLight: 'rgba(255, 255, 255, 0.06)',
  backgroundAccent: 'rgba(34, 211, 238, 0.06)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
};

const GRADIENT = {
  primary: ['#22d3ee', '#818cf8'] as const,     // cyan → indigo
  accent: ['#22d3ee', '#a855f7'] as const,       // cyan → purple
  warm: ['#f59e0b', '#ef4444'] as const,         // amber → red
  success: ['#22d3ee', '#10b981'] as const,      // cyan → emerald
  surface: ['rgba(15,23,42,0.8)', 'rgba(15,23,42,0.4)'] as const,
};

const RADIUS = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
};

export default function DashboardScreen() {
  const budgetContext = useContext(BudgetContext);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);

  if (!budgetContext) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#050a18' }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{t.loading}</Text>
      </SafeAreaView>
    );
  }

  const bs = budgetContext.budgetState;

  const weeklyBudget = bs?.weeklyBudget || budgetContext.weeklyBudget || 300;
  const totalSpent = bs?.currentWeekSpent || budgetContext.transactions.reduce((sum: number, tx: { amount: number }) => sum + (tx.amount || 0), 0);
  const budgetLeft = bs?.currentWeekRemaining ?? (weeklyBudget - totalSpent);
  const percentSpent = weeklyBudget > 0 ? (totalSpent / weeklyBudget) * 100 : 0;

  const greeting = bs?.greeting || t.dashboard;
  const recommendations = bs?.recommendations || [];
  const daysUntilPayday = bs?.daysUntilPayday || null;
  const savingsCurrent = bs?.savingsCurrent || 0;
  const savingsTarget = bs?.savingsTarget || 0;
  const savingsOnTrack = bs?.savingsOnTrack ?? true;

  const displayTransactions = bs
    ? budgetContext.expenses.map((e) => ({
        amount: e.amount,
        description: e.description,
        category: e.category,
        date: e.date,
        id: e.id,
      }))
    : budgetContext.transactions.map((tx: Transaction, i: number) => ({ ...tx, id: String(i) }));

  const getProgressGradient = (): readonly [string, string] => {
    if (percentSpent < 50) return GRADIENT.success;
    if (percentSpent < 75) return ['#f59e0b', '#f97316'];
    return GRADIENT.warm;
  };

  return (
    <View style={[styles.container, { backgroundColor: '#050a18' }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ─── HEADER ─── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{greeting}</Text>
              {daysUntilPayday !== null && daysUntilPayday > 0 && (
                <View style={styles.paydayBadge}>
                  <View style={styles.paydayDot} />
                  <Text style={styles.paydayText}>
                    Payday in {daysUntilPayday} day{daysUntilPayday !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/(tabs)/settings')}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          {/* ─── HERO BUDGET CARD ─── */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['rgba(34,211,238,0.12)', 'rgba(168,85,247,0.08)', 'rgba(5,10,24,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            />
            <View style={styles.heroInner}>
              <Text style={styles.heroLabel}>{t.youHave}</Text>
              <View style={styles.heroAmountRow}>
                <Text style={styles.heroCurrency}>$</Text>
                <Text style={[styles.heroAmount, budgetLeft < 0 && styles.heroAmountDanger]}>
                  {Math.abs(budgetLeft).toFixed(2)}
                </Text>
              </View>
              {budgetLeft < 0 && (
                <Text style={styles.overBudgetBadge}>OVER BUDGET</Text>
              )}
              <Text style={styles.heroSubtitle}>{t.leftThisWeek}</Text>

              {/* Progress Section */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabelLeft}>
                    ${totalSpent.toFixed(0)} spent
                  </Text>
                  <Text style={styles.progressLabelRight}>
                    ${weeklyBudget.toFixed(0)}{bs ? ` · Wk ${bs.currentWeekNumber}` : ''}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={getProgressGradient()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(Math.max(percentSpent, 2), 100)}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* ─── STATS ROW ─── */}
          {bs && (
            <View style={styles.statsRow}>
              <StatCard
                label="Income"
                value={`$${bs.totalMonthlyIncome.toFixed(0)}`}
                gradient={GRADIENT.primary}
                icon="arrow-down-outline"
              />
              <StatCard
                label="Bills"
                value={`$${bs.totalMonthlyConstants.toFixed(0)}`}
                gradient={GRADIENT.warm}
                icon="arrow-up-outline"
              />
              <StatCard
                label="Free"
                value={`$${bs.monthlyAvailable.toFixed(0)}`}
                gradient={GRADIENT.success}
                icon="wallet-outline"
              />
            </View>
          )}

          {/* ─── SAVINGS PROGRESS ─── */}
          {savingsTarget > 0 && (
            <View style={styles.savingsCard}>
              <View style={styles.savingsHeader}>
                <View style={styles.savingsLeft}>
                  <Ionicons name="trending-up" size={18} color="#10b981" />
                  <Text style={styles.savingsTitle}>Savings</Text>
                </View>
                <Text style={[styles.savingsAmount, { color: savingsOnTrack ? '#10b981' : '#f59e0b' }]}>
                  ${savingsCurrent.toFixed(0)}/{savingsTarget.toFixed(0)}
                </Text>
              </View>
              <View style={styles.savingsTrack}>
                <LinearGradient
                  colors={GRADIENT.success}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.savingsFill,
                    { width: `${Math.min((savingsCurrent / savingsTarget) * 100, 100)}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {/* ─── AI INSIGHTS ─── */}
          {recommendations.length > 0 && (
            <View style={styles.insightsSection}>
              {recommendations.map((rec: string, index: number) => (
                <View key={index} style={styles.insightCard}>
                  <LinearGradient
                    colors={['rgba(34,211,238,0.08)', 'rgba(168,85,247,0.04)']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.insightGradient}
                  />
                  <View style={styles.insightDot} />
                  <Text style={styles.insightText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ─── ADD EXPENSE CTA ─── */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(tabs)/add-expense')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={GRADIENT.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={20} color="#050a18" />
              <Text style={styles.addButtonText}>{t.addExpense}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* ─── TRANSACTIONS ─── */}
          <View style={styles.transactionsSection}>
            <View style={styles.transactionsHeader}>
              <Text style={styles.transactionsTitle}>{t.thisWeeksSpending}</Text>
              {displayTransactions.length > 0 && (
                <Text style={styles.transactionsCount}>
                  {displayTransactions.length} item{displayTransactions.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {displayTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🧾</Text>
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptySubtitle}>Add your first expense to start tracking</Text>
              </View>
            ) : (
              displayTransactions.map((item: { id: string; amount: number; description: string; category: string; date: string }, index: number) => (
                <View
                  key={item.id || index}
                  style={[
                    styles.transactionRow,
                    index === displayTransactions.length - 1 && styles.transactionRowLast,
                  ]}
                >
                  <View style={styles.transactionIconCircle}>
                    <Text style={styles.transactionEmoji}>
                      {CATEGORIES[item.category] || EXPENSE_CATEGORY_EMOJI[item.category as ExpenseCategory] || '📌'}
                    </Text>
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionName}>{item.description}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={styles.transactionAmount}>
                    -${item.amount.toFixed(2)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── STAT CARD COMPONENT ────────────────────────────────────

function StatCard({
  label,
  value,
  gradient,
  icon,
}: {
  label: string;
  value: string;
  gradient: readonly [string, string];
  icon: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconCircle, { backgroundColor: `${gradient[0]}15` }]}>
        <Ionicons name={icon as any} size={16} color={gradient[0]} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── STYLES ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#f1f5f9',
    letterSpacing: -0.5,
  },
  paydayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  paydayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22d3ee',
  },
  paydayText: {
    fontSize: 13,
    color: 'rgba(148,163,184,0.8)',
    fontWeight: '500',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero Card
  heroCard: {
    marginHorizontal: 20,
    borderRadius: RADIUS.xl,
    backgroundColor: GLASS.background,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroInner: {
    padding: 24,
    paddingBottom: 20,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(148,163,184,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroCurrency: {
    fontSize: 28,
    fontWeight: '300',
    color: '#22d3ee',
    marginTop: 8,
    marginRight: 2,
  },
  heroAmount: {
    fontSize: 52,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: -2,
    lineHeight: 58,
  },
  heroAmountDanger: {
    color: '#f87171',
  },
  overBudgetBadge: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '800',
    color: '#f87171',
    backgroundColor: 'rgba(248,113,113,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    letterSpacing: 1,
    marginTop: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(148,163,184,0.7)',
    marginTop: 4,
    marginBottom: 20,
  },

  // Progress
  progressSection: {},
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabelLeft: {
    fontSize: 12,
    color: 'rgba(148,163,184,0.5)',
    fontWeight: '600',
  },
  progressLabelRight: {
    fontSize: 12,
    color: 'rgba(148,163,184,0.5)',
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: GLASS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: GLASS.border,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(148,163,184,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Savings
  savingsCard: {
    marginHorizontal: 20,
    backgroundColor: GLASS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: GLASS.border,
    padding: 16,
    marginBottom: 16,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  savingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  savingsAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  savingsTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  savingsFill: {
    height: 4,
    borderRadius: 2,
  },

  // Insights
  insightsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GLASS.background,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: GLASS.border,
    padding: 14,
    gap: 12,
    overflow: 'hidden',
  },
  insightGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22d3ee',
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(226,232,240,0.8)',
    lineHeight: 18,
    fontWeight: '500',
  },

  // Add Button
  addButton: {
    marginHorizontal: 20,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: 28,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#050a18',
    letterSpacing: 0.3,
  },

  // Transactions
  transactionsSection: {
    paddingHorizontal: 20,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
    letterSpacing: -0.2,
  },
  transactionsCount: {
    fontSize: 12,
    color: 'rgba(148,163,184,0.5)',
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(226,232,240,0.5)',
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(148,163,184,0.4)',
  },

  // Transaction Rows
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 14,
  },
  transactionRowLast: {
    borderBottomWidth: 0,
  },
  transactionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
    gap: 2,
  },
  transactionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  transactionDate: {
    fontSize: 12,
    color: 'rgba(148,163,184,0.5)',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(248,113,113,0.9)',
    letterSpacing: -0.3,
  },
});
