'use client';

import { useBudget } from '@/src/context/BudgetContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { formatMonthKey, getCurrentWeekNumber, getToday } from '@/src/engine/calculations';
import { Borrowed, ExpenseCategory } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
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

type TransactionMode = 'expense' | 'gift' | 'borrow' | 'payback';

const CATEGORIES: { key: ExpenseCategory; emoji: string }[] = [
	{ key: 'Food', emoji: '🍔' },
	{ key: 'Transport', emoji: '🚗' },
	{ key: 'Entertainment', emoji: '🎬' },
	{ key: 'Utilities', emoji: '💡' },
	{ key: 'Shopping', emoji: '🛍️' },
	{ key: 'Other', emoji: '📌' },
];

export default function AddTransactionsScreen() {
	const router = useRouter();
	const { colors } = useTheme();
	const { t } = useLanguage();
	const {
    addExpenseToFirestore, budgetState,
    addBorrowed, borrowed, payBackBorrowed,
    addGift, refreshBudget,
} = useBudget();

	const [mode, setMode] = useState<TransactionMode>('expense');
	const [amount, setAmount] = useState('');
	const [description, setDescription] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('Food');
	const [isSaving, setIsSaving] = useState(false);

	// Payback state
	const [selectedDebt, setSelectedDebt] = useState<Borrowed | null>(null);

	const activeBorrowed = borrowed.filter((b) => b.status === 'active' || b.status === 'partial');
	const hasDebts = activeBorrowed.length > 0;

	const resetForm = () => {
		setAmount('');
		setDescription('');
		setSelectedCategory('Food');
		setSelectedDebt(null);
	};

	const handleSubmit = async () => {
		const parsedAmount = parseFloat(amount);
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			Alert.alert('', t.enterAmount || 'Enter a valid amount');
			return;
		}

		if (mode === 'expense' && !description.trim()) {
			Alert.alert('', t.enterDescription || 'Enter a description');
			return;
		}

		if (mode === 'payback' && !selectedDebt) {
			Alert.alert('', 'Select a debt to pay back');
			return;
		}

		setIsSaving(true);

		try {
			const now = new Date().toISOString();
			const currentMonth = formatMonthKey(getToday());
			const resetDay = budgetState?.resetDay || 1;
			const weekNumber = getCurrentWeekNumber(resetDay);

			switch (mode) {
				case 'expense':
					await addExpenseToFirestore({
						userId: '', amount: parsedAmount, description: description.trim(),
						category: selectedCategory, date: now, weekNumber, month: currentMonth,
						transactionType: 'expense',
					});
					await refreshBudget();
					break;

				case 'gift':
					await addGift({
						userId: '', amount: parsedAmount,
						description: description.trim() || 'Gift received',
						weekNumber, month: currentMonth, date: now,
					});
					await addExpenseToFirestore({
						userId: '', amount: parsedAmount,
						description: description.trim() || 'Gift received',
						category: 'Other', date: now, weekNumber, month: currentMonth,
						transactionType: 'gift',
					});
					await refreshBudget();
					break;

				case 'borrow':
					await addBorrowed({
						userId: '', amount: parsedAmount, paidBack: 0,
						from: description.trim() || 'Borrowed',
						status: 'active', weekNumber, month: currentMonth, date: now,
					});
					await addExpenseToFirestore({
						userId: '', amount: parsedAmount,
						description: description.trim() || 'Borrowed',
						category: 'Other', date: now, weekNumber, month: currentMonth,
						transactionType: 'borrow',
					});
					await refreshBudget();
					break;

				case 'payback':
					if (!selectedDebt) break;
					const remaining = selectedDebt.amount - selectedDebt.paidBack;
					const payAmount = Math.min(parsedAmount, remaining);

					await payBackBorrowed(selectedDebt.id, payAmount);
					await addExpenseToFirestore({
						userId: '', amount: payAmount,
						description: `Payback to ${selectedDebt.from}`,
						category: 'Other', date: now, weekNumber, month: currentMonth,
						transactionType: 'payback',
						borrowedId: selectedDebt.id,
					});
					await refreshBudget();
					break;
			}

			resetForm();
			router.back();
		} catch (err: unknown) {
			console.error('Failed to add transaction:', err);
			Alert.alert('Error', 'Failed to save. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const getModeConfig = () => {
		switch (mode) {
			case 'expense':
				return { icon: '💸', label: t.addExpense || 'Add Expense', color: colors.danger };
			case 'gift':
				return { icon: '🎁', label: t.addGift || 'Add Gift', color: colors.success };
			case 'borrow':
				return { icon: '🤝', label: t.addBorrowed || 'Add Borrowed', color: colors.warning };
			case 'payback':
				return { icon: '💳', label: t.payBack || 'Pay Back', color: colors.accent };
		}
	};

	const modeConfig = getModeConfig();

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
							<Text style={[styles.headerTitle, { color: colors.primaryText }]}>
								{t.addTransactions || 'Add Transaction'}
							</Text>
							<View style={{ width: 24 }} />
						</View>

						{/* Mode Selector — 2x2 grid */}
						<View style={styles.modeGrid}>
							<View style={styles.modeRow}>
								<TouchableOpacity
									style={[styles.modeButton, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder },
										mode === 'expense' && { borderColor: colors.danger, backgroundColor: `${colors.danger}15` }]}
									onPress={() => { setMode('expense'); resetForm(); }}
								>
									<Text style={styles.modeEmoji}>💸</Text>
									<Text style={[styles.modeLabel, { color: mode === 'expense' ? colors.danger : colors.secondaryText }]}>
										{t.addExpense || 'Expense'}
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[styles.modeButton, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder },
										mode === 'gift' && { borderColor: colors.success, backgroundColor: `${colors.success}15` }]}
									onPress={() => { setMode('gift'); resetForm(); }}
								>
									<Text style={styles.modeEmoji}>🎁</Text>
									<Text style={[styles.modeLabel, { color: mode === 'gift' ? colors.success : colors.secondaryText }]}>
										{t.addGift || 'Gift'}
									</Text>
								</TouchableOpacity>
							</View>

							<View style={styles.modeRow}>
								{hasDebts ? (
									<>
										<TouchableOpacity
											style={[styles.modeButton, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder },
												mode === 'borrow' && { borderColor: colors.warning, backgroundColor: `${colors.warning}15` }]}
											onPress={() => { setMode('borrow'); resetForm(); }}
										>
											<Text style={styles.modeEmoji}>🤝</Text>
											<Text style={[styles.modeLabel, { color: mode === 'borrow' ? colors.warning : colors.secondaryText }]}>
												{t.addBorrowed || 'Borrow'}
											</Text>
										</TouchableOpacity>

										<TouchableOpacity
											style={[styles.modeButton, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder },
												mode === 'payback' && { borderColor: colors.accent, backgroundColor: `${colors.accent}15` }]}
											onPress={() => { setMode('payback'); resetForm(); }}
										>
											<Text style={styles.modeEmoji}>💳</Text>
											<Text style={[styles.modeLabel, { color: mode === 'payback' ? colors.accent : colors.secondaryText }]}>
												{t.payBack || 'Payback'}
											</Text>
										</TouchableOpacity>
									</>
								) : (
									<TouchableOpacity
										style={[styles.modeButtonCentered, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder },
											mode === 'borrow' && { borderColor: colors.warning, backgroundColor: `${colors.warning}15` }]}
										onPress={() => { setMode('borrow'); resetForm(); }}
									>
										<Text style={styles.modeEmoji}>🤝</Text>
										<Text style={[styles.modeLabel, { color: mode === 'borrow' ? colors.warning : colors.secondaryText }]}>
											{t.addBorrowed || 'Borrow'}
										</Text>
									</TouchableOpacity>
								)}
							</View>
						</View>

						{/* Amount */}
						<View style={styles.section}>
							<Text style={[styles.label, { color: colors.secondaryText }]}>
								{mode === 'payback' ? (t.paybackAmount || 'Payback Amount') : (t.expenseAmount || 'Amount')}
							</Text>
							<View style={[styles.amountContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
								<Text style={[styles.currencySymbol, { color: modeConfig.color }]}>$</Text>
								<TextInput
									style={[styles.amountInput, { color: colors.primaryText }]}
									placeholder={t.enterAmount || '0.00'}
									placeholderTextColor={colors.tertiaryText}
									keyboardType="decimal-pad"
									value={amount}
									onChangeText={setAmount}
									autoFocus
								/>
							</View>
						</View>

						{/* Payback: Select Debt */}
						{mode === 'payback' && (
							<View style={styles.section}>
								<Text style={[styles.label, { color: colors.secondaryText }]}>
									{t.selectDebt || 'Select Debt to Pay Back'}
								</Text>
								{activeBorrowed.map((debt) => {
									const remaining = debt.amount - debt.paidBack;
									const isSelected = selectedDebt?.id === debt.id;
									return (
										<TouchableOpacity
											key={debt.id}
											style={[styles.debtOption, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder },
												isSelected && { borderColor: colors.accent, backgroundColor: colors.accentMuted }]}
											onPress={() => setSelectedDebt(debt)}
										>
											<View style={styles.debtInfo}>
												<Text style={[styles.debtName, { color: colors.primaryText }]}>{debt.from}</Text>
												<Text style={[styles.debtDetail, { color: colors.secondaryText }]}>
													${remaining.toFixed(2)} remaining of ${debt.amount.toFixed(2)}
												</Text>
											</View>
											{isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
										</TouchableOpacity>
									);
								})}
							</View>
						)}

						{/* Description/Name */}
						{mode !== 'payback' && (
							<View style={styles.section}>
								<Text style={[styles.label, { color: colors.secondaryText }]}>
									{mode === 'expense' ? (t.description || 'Description')
										: mode === 'gift' ? (t.giftFrom || 'Gift from')
										: (t.borrowedFrom || 'Borrowed from')}
								</Text>
								<TextInput
									style={[styles.descriptionInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.primaryText }]}
									placeholder={
										mode === 'expense' ? (t.enterDescription || 'What did you spend on?')
										: mode === 'gift' ? 'e.g. Gift from Mom'
										: 'e.g. Borrowed from Arthur'
									}
									placeholderTextColor={colors.tertiaryText}
									value={description}
									onChangeText={setDescription}
									defaultValue={mode === 'borrow' ? 'Borrowed' : undefined}
								/>
							</View>
						)}

						{/* Category — only for expenses */}
						{mode === 'expense' && (
							<View style={styles.section}>
								<Text style={[styles.label, { color: colors.secondaryText }]}>{t.category || 'Category'}</Text>
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
						)}

						{/* Week Info */}
						{budgetState && (
							<View style={[styles.weekInfo, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
								<Text style={[styles.weekInfoText, { color: colors.secondaryText }]}>
									Wk {budgetState.currentWeekNumber} · ${budgetState.currentWeekRemaining.toFixed(2)} {t.weekRemaining || 'remaining'}
								</Text>
							</View>
						)}

						{/* Submit */}
						<TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.85} disabled={isSaving}>
							<LinearGradient
								colors={mode === 'expense' ? [colors.danger, '#f97316'] :
									mode === 'gift' ? [colors.success, colors.gradientStart] :
									mode === 'borrow' ? [colors.warning, '#f97316'] :
									[colors.gradientStart, colors.gradientEnd]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								style={styles.submitGradient}
							>
								{isSaving ? (
									<ActivityIndicator color="#fff" />
								) : (
									<>
										<Text style={styles.submitEmoji}>{modeConfig.icon}</Text>
										<Text style={[styles.submitText, { color: '#fff' }]}>{modeConfig.label}</Text>
									</>
								)}
							</LinearGradient>
						</TouchableOpacity>

						<TouchableOpacity style={[styles.cancelButton, { borderColor: colors.glassBorder }]} onPress={() => router.back()}>
							<Text style={[styles.cancelText, { color: colors.secondaryText }]}>{t.cancel || 'Cancel'}</Text>
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
	header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
	headerTitle: { fontSize: 18, fontWeight: '700' },

	modeGrid: { marginBottom: 24, gap: 10 },
	modeRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
	modeButton: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center', gap: 6 },
	modeButtonCentered: { width: '48%', borderWidth: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center', gap: 6 },
	modeEmoji: { fontSize: 24 },
	modeLabel: { fontSize: 13, fontWeight: '700' },

	section: { marginBottom: 24 },
	label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
	amountContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingLeft: 16 },
	currencySymbol: { fontSize: 24, fontWeight: '700', marginRight: 4 },
	amountInput: { flex: 1, paddingVertical: 16, paddingHorizontal: 4, fontSize: 24, fontWeight: '600' },
	descriptionInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },

	debtOption: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8 },
	debtInfo: { flex: 1 },
	debtName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
	debtDetail: { fontSize: 12 },

	categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
	categoryButton: { width: '31%', aspectRatio: 1.1, borderWidth: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', gap: 6 },
	categoryEmoji: { fontSize: 26 },
	categoryLabel: { fontSize: 12, fontWeight: '600' },

	weekInfo: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 24, alignItems: 'center' },
	weekInfoText: { fontSize: 13, fontWeight: '500' },

	submitButton: { borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
	submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
	submitEmoji: { fontSize: 18 },
	submitText: { fontSize: 16, fontWeight: '700' },
	cancelButton: { paddingVertical: 14, borderWidth: 1, borderRadius: 14, alignItems: 'center' },
	cancelText: { fontSize: 15, fontWeight: '600' },
});