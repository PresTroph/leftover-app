'use client';

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CATEGORIES = [
  { name: 'Food', emoji: '🍔' },
  { name: 'Transport', emoji: '🚗' },
  { name: 'Entertainment', emoji: '🎬' },
  { name: 'Utilities', emoji: '💡' },
  { name: 'Shopping', emoji: '🛍️' },
  { name: 'Other', emoji: '📌' },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');

  const handleAddExpense = () => {
    // TODO: Implement actual expense adding logic
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor="#64748b"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
      </View>

      {/* Description Input */}
      <View style={styles.section}>
        <Text style={styles.label}>What did you buy?</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="e.g., Coffee at Starbucks"
          placeholderTextColor="#64748b"
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      {/* Category Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.name}
              style={[
                styles.categoryButton,
                selectedCategory === cat.name && styles.categoryButtonSelected,
              ]}
              onPress={() => setSelectedCategory(cat.name)}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.name && styles.categoryTextSelected,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddExpense}>
        <Text style={styles.addButtonText}>Add Expense</Text>
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#0EA5E9',
  },
  currencySymbol: {
    color: '#0EA5E9',
    fontSize: 24,
    fontWeight: '600',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
    paddingVertical: 8,
  },
  descriptionInput: {
    backgroundColor: '#1e293b',
    color: '#fff',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 8,
    alignItems: 'center',
  },
  categoryButtonSelected: {
    borderColor: '#0EA5E9',
    backgroundColor: '#0EA5E920',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  addButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
});