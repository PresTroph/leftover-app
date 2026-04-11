'use client';

import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { logoutRevenueCat } from '@/src/services/revenuecat';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
	const router = useRouter();
	const { isDarkMode, toggleTheme, colors } = useTheme();
	const { language, setLanguage, t } = useLanguage();
	const { signOut, user } = useAuth();

	const handleLogout = () => {
		const doLogout = async () => {
			await logoutRevenueCat();
			await signOut();
			router.replace('/');
		};

		if (Platform.OS === 'web') {
			if (window.confirm(`${t.logout}\n${t.logoutConfirm}`)) {
				doLogout();
			}
		} else {
			Alert.alert(t.logout, t.logoutConfirm, [
				{ text: t.cancel, style: 'cancel' },
				{ text: t.logout, style: 'destructive', onPress: doLogout },
			]);
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}> 
			<SafeAreaView style={styles.safeArea}>
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.primaryText }]}>{t.settings}</Text>
					<TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
						<Ionicons name="close" size={24} color={colors.primaryText} />
					</TouchableOpacity>
				</View>

				<ScrollView contentContainerStyle={styles.scrollContent}>
					{/* Dark Mode */}
					<View style={[styles.settingRow, { borderBottomColor: colors.divider }]}>
						<View style={styles.settingLabel}>
							<Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={colors.accent} />
							<Text style={[styles.settingText, { color: colors.primaryText }]}>{t.darkMode}</Text>
						</View>
						<Switch
							value={isDarkMode}
							onValueChange={toggleTheme}
							trackColor={{ false: colors.glassBg, true: colors.accent }}
						/>
					</View>

					{/* Language */}
					<View style={[styles.settingSection, { borderBottomColor: colors.divider }]}>
						<View style={styles.settingLabel}>
							<Ionicons name="language" size={20} color={colors.accent} />
							<Text style={[styles.settingText, { color: colors.primaryText }]}>{t.language}</Text>
						</View>
						<View style={styles.languageRow}>
							{[
								{ code: 'en', label: '🇺🇸 English' },
								{ code: 'es', label: '🇪🇸 Español' },
								{ code: 'fr', label: '🇫🇷 Français' },
							].map((lang) => (
								<TouchableOpacity
									key={lang.code}
									style={[
										styles.languageChip,
										{
											backgroundColor: language === lang.code ? colors.accent : colors.glassBg,
											borderColor: language === lang.code ? colors.accent : colors.glassBorder,
										},
									]}
									onPress={() => setLanguage(lang.code as 'en' | 'es' | 'fr')}
								>
									<Text
										style={[
											styles.languageChipText,
											{ color: language === lang.code ? colors.buttonText : colors.secondaryText },
										]}
									>
										{lang.label}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>

					{/* About */}
					<View style={[styles.settingRow, { borderBottomColor: colors.divider }]}>
						<View style={styles.settingLabel}>
							<Ionicons name="information-circle-outline" size={20} color={colors.accent} />
							<Text style={[styles.settingText, { color: colors.primaryText }]}>{t.about}</Text>
						</View>
						<Text style={[styles.versionText, { color: colors.tertiaryText }]}>v1.0.0</Text>
					</View>

					{/* Account Info */}
					{user?.email ? (
						<View style={[styles.settingRow, { borderBottomColor: colors.divider }]}>
							<View style={styles.settingLabel}>
								<Ionicons name="person-outline" size={20} color={colors.accent} />
								<Text style={[styles.settingText, { color: colors.primaryText }]}>{(t as any).account || 'Account'}</Text>
							</View>
							<Text style={[styles.versionText, { color: colors.tertiaryText }]}>{user.email}</Text>
						</View>
					) : null}

					{/* Logout */}
					<TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
						<Ionicons name="log-out-outline" size={20} color={colors.danger} />
						<Text style={[styles.logoutText, { color: colors.danger }]}>{t.logout}</Text>
					</TouchableOpacity>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	safeArea: { flex: 1 },
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	title: { fontSize: 22, fontWeight: '700' },
	closeButton: { padding: 4 },
	scrollContent: { paddingHorizontal: 20 },

	settingRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 16,
		borderBottomWidth: 1,
	},
	settingSection: {
		paddingVertical: 16,
		borderBottomWidth: 1,
	},
	settingLabel: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	settingText: { fontSize: 16, fontWeight: '500' },
	versionText: { fontSize: 14 },

	languageRow: {
		flexDirection: 'row',
		gap: 8,
		marginTop: 12,
	},
	languageChip: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
	},
	languageChipText: { fontSize: 13, fontWeight: '600' },

	logoutButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 20,
		marginTop: 20,
	},
	logoutText: { fontSize: 16, fontWeight: '600' },
});
