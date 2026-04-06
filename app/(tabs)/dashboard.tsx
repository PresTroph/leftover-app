'use client';

import { useRouter } from 'expo-router';
import React from 'react';
import {
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Hardcoded data for now (will be replaced with BudgetContext)
const SAMPLE_DATA = {
  weeklyBudget: 300,
  spent: 65.50,
  transactions: [
    { id: '1', description: 'Coffee at Starbucks', category: 'Food', amount: 5.50, emoji: '🍔' },
    { id: '2', description: 'Uber to work', category: 'Transport', amount: 15.00, emoji: '🚗' },
    { id: '3', description: 'Netflix subscription', category: 'Entertainment', amount: 15.00, emoji: '🎬' },
    { id: '4', description: 'Dinner with friends', category: 'Food', amount: 30.00, emoji: '🍔' },
  ],
};

export default function DashboardScreen() {
  const router = useRouter();
  const remaining = SAMPLE_DATA.weeklyBudget - SAMPLE_DATA.spent;
  const percentage = (SAMPLE_DATA.spent / SAMPLE_DATA.weeklyBudget) * 100;

  const getProgressBarColor = () => {
    if (percentage > 80) return '#ef4444';
    if (percentage > 50) return '#f59e0b';
    return '#10b981';
  };

  const renderTransaction = ({ item }: any) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <View>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionCategory}>{item.category}</Text>
        </View>
      </View>
      <Text style={styles.transactionAmount}>${item.amount.toFixed(2)}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Settings Button */}
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
          <Text style={styles.settingsButton}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Budget Section */}
      <View style={styles.budgetCard}>
        <Text style={styles.budgetLabel}>Budget Left This Week</Text>
        <Text style={styles.budgetAmount}>${remaining.toFixed(2)}</Text>
        <Text style={styles.budgetMax}>out of ${SAMPLE_DATA.weeklyBudget}</Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.min(percentage, 100)}%`, backgroundColor: getProgressBarColor() },
            ]}
          />
        </View>
        <Text style={styles.percentageText}>{percentage.toFixed(0)}% spent</Text>
      </View>

      {/* Add Expense Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(tabs)/add-expense')}
      >
        <Text style={styles.addButtonText}>+ Add Expense</Text>
      </TouchableOpacity>

      {/* Transactions Section */}
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>This Week's Spending</Text>
        {SAMPLE_DATA.transactions.length === 0 ? (
          <Text style={styles.noTransactions}>No transactions yet</Text>
        ) : (
          <FlatList
            data={SAMPLE_DATA.transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Spacer */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  settingsButton: {
    fontSize: 24,
  },
  budgetCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  budgetLabel: {
    color: '#a0aec0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  budgetAmount: {
    color: '#0EA5E9',
    fontSize: 54,
    fontWeight: '700',
    marginBottom: 4,
  },
  budgetMax: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  addButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  noTransactions: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  transactionDescription: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionCategory: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    color: '#0EA5E9',
    fontSize: 14,
    fontWeight: '600',
  },
});